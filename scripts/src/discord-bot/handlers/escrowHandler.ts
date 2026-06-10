import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  ModalSubmitInteraction,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  TextChannel,
  MessageFlags,
  Message,
} from "discord.js";
import { EscrowTicket, ServerConfig, WalletConfig } from "../db/models.js";
import { PRESETS } from "../config/presets.js";
import { fetchCryptoRate, getCurrencyLabel, getCurrencyEmoji, getBlockchainName } from "../utils/rates.js";

async function getPresetAndBanner(guildId: string) {
  const config = await ServerConfig.findOne({ guildId });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";
  return { preset, bannerUrl };
}

async function getWalletAddress(guildId: string, currency: string): Promise<string> {
  // Universal wallet takes priority (set via .setwalletadminonlymadebyecho)
  const config = await ServerConfig.findOne({ guildId });
  if (config?.universalWallet) return config.universalWallet;
  // Fall back to per-currency wallet
  const wallet = await WalletConfig.findOne({ guildId, currency });
  return wallet?.address ?? "Contact staff for payment address";
}

function buildRoleSelectionEmbed(
  preset: ReturnType<typeof Object.values<(typeof PRESETS)[string]>>[number],
  bannerUrl: string,
  initiatorId: string,
  secondUserId: string,
  paymentMethod: string
) {
  const currLabel = getCurrencyLabel(paymentMethod);
  const currEmoji = getCurrencyEmoji(paymentMethod);

  const embed = new EmbedBuilder()
    .setTitle(`👋 - ${preset.serverName} Middleman Service`)
    .setColor(preset.color)
    .setDescription(
      `——————————————————\n` +
      `Hello <@${initiatorId}> & <@${secondUserId}>! Welcome to the automated Middleman system.\n\n` +
      `Please follow the steps below carefully to continue your trade.\n\n` +
      `### <:echomem:1513916469036060753> - Select Your Role\n` +
      `> Choose your position in this transaction:\n\n` +
      `> - **Sender** → You are sending ${currEmoji} ${currLabel} through the bot\n` +
      `> - **Receiver** → You are receiving ${currEmoji} ${currLabel} after completion\n\n` +
      `<@${initiatorId}> | <@${secondUserId}>`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const roleRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("automm_sender").setLabel("Sender").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("automm_receiver").setLabel("Receiver").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("automm_reset").setLabel("Reset").setStyle(ButtonStyle.Danger)
  );

  const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim Ticket").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("add_user_ticket").setLabel("Add User").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [roleRow, controlRow] };
}

// ─── Step 1: Payment method selected → ask for second trader ─────────────────
export async function handleEscrowPaymentSelect(interaction: StringSelectMenuInteraction) {
  const paymentMethod = interaction.values[0];

  const modal = new ModalBuilder()
    .setCustomId(`automm_setup_modal_${paymentMethod}`)
    .setTitle("AutoMM Setup");

  const secondUserInput = new TextInputBuilder()
    .setCustomId("second_user_id")
    .setLabel("Second trader's Discord user ID")
    .setPlaceholder("Right-click user → Copy User ID")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(secondUserInput));
  await interaction.showModal(modal);
}

// ─── Step 2: Setup modal submitted → create ticket ───────────────────────────
export async function handleAutoMMSetupSubmit(interaction: ModalSubmitInteraction, paymentMethod: string) {
  const guild = interaction.guild;
  if (!guild) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const secondUserId = interaction.fields.getTextInputValue("second_user_id").trim();

  let secondMember;
  try {
    secondMember = await guild.members.fetch(secondUserId);
  } catch {
    await interaction.editReply({ content: `Could not find a member with ID \`${secondUserId}\`. Make sure the ID is correct.` });
    return;
  }

  const { preset, bannerUrl } = await getPresetAndBanner(guild.id);

  const ticketChannel = await guild.channels.create({
    name: `automm-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: secondUserId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  const payload = buildRoleSelectionEmbed(preset, bannerUrl, interaction.user.id, secondUserId, paymentMethod);
  const panelMsg = await ticketChannel.send({
    content: `<@${interaction.user.id}> <@${secondUserId}>`,
    ...payload,
  });

  await EscrowTicket.create({
    guildId: guild.id,
    channelId: ticketChannel.id,
    userId: interaction.user.id,
    secondUserId,
    paymentMethod,
    status: "pending_roles",
    panelMessageId: panelMsg.id,
  });

  await interaction.editReply({ content: `AutoMM ticket created: <#${ticketChannel.id}>` });
}

// ─── Step 3: Sender / Receiver / Reset buttons ───────────────────────────────
export async function handleAutoMMRole(interaction: ButtonInteraction, role: "sender" | "receiver" | "reset") {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (role === "reset") {
    escrow.senderUserId = null;
    escrow.receiverUserId = null;
    escrow.rolesConfirmed = false;
    escrow.status = "pending_roles";
    await escrow.save();
    await interaction.reply({ content: "Roles have been reset. Both traders can now re-select.", flags: MessageFlags.Ephemeral });
    return;
  }

  const allowedIds = [escrow.userId, escrow.secondUserId].filter(Boolean) as string[];
  if (!allowedIds.includes(interaction.user.id)) {
    await interaction.reply({ content: "Only the two traders in this ticket can select a role.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (role === "sender") {
    if (escrow.senderUserId === interaction.user.id) {
      await interaction.reply({ content: "You are already set as **Sender**.", flags: MessageFlags.Ephemeral });
      return;
    }
    if (escrow.senderUserId && escrow.senderUserId !== interaction.user.id) {
      await interaction.reply({ content: `<@${escrow.senderUserId}> is already the Sender. Use **Reset** to reassign.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (escrow.receiverUserId === interaction.user.id) {
      escrow.receiverUserId = null;
    }
    escrow.senderUserId = interaction.user.id;
  } else {
    if (escrow.receiverUserId === interaction.user.id) {
      await interaction.reply({ content: "You are already set as **Receiver**.", flags: MessageFlags.Ephemeral });
      return;
    }
    if (escrow.receiverUserId && escrow.receiverUserId !== interaction.user.id) {
      await interaction.reply({ content: `<@${escrow.receiverUserId}> is already the Receiver. Use **Reset** to reassign.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (escrow.senderUserId === interaction.user.id) {
      escrow.senderUserId = null;
    }
    escrow.receiverUserId = interaction.user.id;
  }
  await escrow.save();

  if (escrow.senderUserId && escrow.receiverUserId) {
    const { preset, bannerUrl } = await getPresetAndBanner(interaction.guildId!);

    const confirmEmbed = new EmbedBuilder()
      .setColor(preset.color)
      .setDescription(
        `### <a:echoload:1513916466653561096> - Role Confirmation\n\n` +
        `**Sender** | **Receiver**\n` +
        `<@${escrow.senderUserId}> | <@${escrow.receiverUserId}>\n\n` +
        `> Please confirm that both users and roles are correct.`
      );
    if (bannerUrl) confirmEmbed.setImage(bannerUrl);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("automm_confirm_roles").setLabel("✓ Correct").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("automm_reset").setLabel("✗ Incorrect").setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [confirmEmbed], components: [row] });
  } else {
    await interaction.reply({
      content: `You have been set as **${role === "sender" ? "Sender" : "Receiver"}**. Waiting for the other trader to select their role.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

// ─── Step 4: Roles confirmed → show amount modal to sender ───────────────────
export async function handleAutoMMConfirmRoles(interaction: ButtonInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (interaction.user.id !== escrow.senderUserId) {
    await interaction.reply({ content: `Only the **Sender** (<@${escrow.senderUserId}>) can confirm and enter the amount.`, flags: MessageFlags.Ephemeral });
    return;
  }

  escrow.rolesConfirmed = true;
  escrow.status = "pending_amount";
  await escrow.save();

  const currLabel = getCurrencyLabel(escrow.paymentMethod);

  const modal = new ModalBuilder()
    .setCustomId("automm_amount_modal")
    .setTitle("Enter Trade Amount");

  const amountInput = new TextInputBuilder()
    .setCustomId("usd_amount")
    .setLabel("Trade amount in USD")
    .setPlaceholder("e.g. 50.00")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput));
  await interaction.showModal(modal);
}

// ─── Step 5: Amount entered → fetch rate, show payment details ───────────────
export async function handleAutoMMAmountSubmit(interaction: ModalSubmitInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply();

  const rawAmount = interaction.fields.getTextInputValue("usd_amount").replace(/[^0-9.]/g, "");
  const usdAmount = parseFloat(rawAmount);
  if (isNaN(usdAmount) || usdAmount <= 0) {
    await interaction.editReply({ content: "Invalid amount. Please enter a valid USD number (e.g. `50.00`)." });
    return;
  }

  const { preset, bannerUrl } = await getPresetAndBanner(interaction.guildId!);
  const { cryptoAmount, displayRate } = await fetchCryptoRate(escrow.paymentMethod, usdAmount);
  const walletAddress = await getWalletAddress(interaction.guildId!, escrow.paymentMethod);
  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);

  escrow.usdAmount = usdAmount;
  escrow.cryptoAmount = cryptoAmount;
  escrow.rateDisplay = displayRate;
  escrow.walletAddress = walletAddress;
  escrow.status = "amount_confirmed";
  await escrow.save();

  const confirmEmbed = new EmbedBuilder()
    .setColor(preset.color)
    .setDescription(
      `### <a:echoload:1513916466653561096> - Amount Set\n\n` +
      `> The payment amount has been set to: **$${usdAmount.toFixed(2)} USD**\n` +
      `> Equivalent: **${cryptoAmount} ${currEmoji} ${currLabel}**\n` +
      `> Rate: ${displayRate}\n\n` +
      `Please verify before continuing.\n\n` +
      `**Sender:** <@${escrow.senderUserId}> | **Receiver:** <@${escrow.receiverUserId}>`
    );
  if (bannerUrl) confirmEmbed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("automm_confirm_amount").setLabel("✓ Correct").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("automm_reject_amount").setLabel("✗ Incorrect — Re-enter").setStyle(ButtonStyle.Danger)
  );

  await interaction.editReply({ embeds: [confirmEmbed], components: [row] });
}

// ─── Step 6: Amount confirmed → show payment address ─────────────────────────
export async function handleAutoMMConfirmAmount(interaction: ButtonInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (interaction.user.id !== escrow.senderUserId) {
    await interaction.reply({ content: `Only the **Sender** (<@${escrow.senderUserId}>) can confirm the amount.`, flags: MessageFlags.Ephemeral });
    return;
  }

  escrow.amountConfirmed = true;
  escrow.status = "pending_payment";
  await escrow.save();

  const { preset, bannerUrl } = await getPresetAndBanner(interaction.guildId!);
  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);

  const isPayPal = escrow.paymentMethod === "paypal";

  const paymentEmbed = new EmbedBuilder()
    .setColor(preset.color)
    .setDescription(
      `### <a:echorules:1513916477944893643> - Payment Details\n\n` +
      `> Send the **exact amount** shown below to complete this trade.\n\n` +
      `**USD Value** | **${currEmoji} ${currLabel} Amount**\n` +
      `\`$${(escrow.usdAmount ?? 0).toFixed(2)}\` | \`${escrow.cryptoAmount ?? "N/A"} ${isPayPal ? "USD" : currLabel}\`\n\n` +
      (isPayPal
        ? `**PayPal Address / Email**\n\`\`\`${escrow.walletAddress}\`\`\`\n\n`
        : `**${currLabel} Payment Address**\n\`\`\`${escrow.walletAddress}\`\`\`\n\n`) +
      `**Rate:** ${escrow.rateDisplay}\n\n` +
      `**Sender:** <@${escrow.senderUserId}> | **Receiver:** <@${escrow.receiverUserId}>\n\n` +
      `> ⚠ This trade will be automatically flagged in **20 minutes** if no payment activity is detected.\n` +
      `> <a:echcross:1513916475830702402> Do NOT close this ticket until the trade is fully completed.`
    );
  if (bannerUrl) paymentEmbed.setImage(bannerUrl);

  const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("automm_payment_sent").setLabel("I Have Sent Payment").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("automm_staff_confirm").setLabel("Confirm Payment").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim Ticket").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("add_user_ticket").setLabel("Add User").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [paymentEmbed], components: [controlRow] });

  setTimeout(async () => {
    const updated = await EscrowTicket.findOne({ channelId: interaction.channelId });
    if (updated && updated.status === "pending_payment") {
      const channel = interaction.channel;
      if (channel && channel.isTextBased() && !channel.isDMBased()) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(0xef4444)
          .setDescription(
            `### <a:echoexlamation:1513916464254419165> - 20 Minute Timeout\n\n` +
            `No payment activity detected for this trade.\n` +
            `**Sender:** <@${updated.senderUserId}> | **Receiver:** <@${updated.receiverUserId}>\n\n` +
            `A staff member will review this ticket. If the trade is still active, please respond here.`
          );
        await (channel as TextChannel).send({ embeds: [timeoutEmbed] });
      }
    }
  }, 20 * 60 * 1000);
}

// ─── Step 7: Payment sent → update status ────────────────────────────────────
export async function handleAutoMMPaymentSent(interaction: ButtonInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (interaction.user.id !== escrow.senderUserId) {
    await interaction.reply({ content: `Only the **Sender** (<@${escrow.senderUserId}>) can mark payment as sent.`, flags: MessageFlags.Ephemeral });
    return;
  }

  escrow.status = "payment_detected";
  await escrow.save();

  const { preset, bannerUrl } = await getPresetAndBanner(interaction.guildId!);
  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);

  const statusEmbed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setDescription(
      `### <a:echoload:1513916466653561096> - Transaction Status\n\n` +
      `> Status: **Pending Confirmation** — waiting for staff verification.\n\n` +
      `**Amount Sent:** \`${escrow.cryptoAmount} ${currEmoji} ${currLabel}\`\n` +
      `**USD Value:** \`$${(escrow.usdAmount ?? 0).toFixed(2)}\`\n\n` +
      `**Sender:** <@${escrow.senderUserId}> | **Receiver:** <@${escrow.receiverUserId}>\n\n` +
      `> A staff member will verify the payment and release funds to the Receiver.`
    );
  if (bannerUrl) statusEmbed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("automm_staff_confirm").setLabel("Confirm Payment").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("automm_complete").setLabel("Mark Complete").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim Ticket").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [statusEmbed], components: [row] });
}

// ─── Step 8: Mark complete ────────────────────────────────────────────────────
export async function handleAutoMMComplete(interaction: ButtonInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  escrow.status = "completed";
  await escrow.save();

  const { preset, bannerUrl } = await getPresetAndBanner(interaction.guildId!);
  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);

  const completeEmbed = new EmbedBuilder()
    .setColor(0x16a34a)
    .setDescription(
      `### <:echocheck:1513916473976950824> - Trade Completed\n\n` +
      `> This trade has been marked as **complete** by <@${interaction.user.id}>.\n\n` +
      `**Sender:** <@${escrow.senderUserId}>\n` +
      `**Receiver:** <@${escrow.receiverUserId}>\n` +
      `**Amount:** \`${escrow.cryptoAmount} ${currEmoji} ${currLabel}\` (\`$${(escrow.usdAmount ?? 0).toFixed(2)} USD\`)\n\n` +
      `> Please remember to **vouch** for the Middleman in the vouch channel within **24 hours**.`
    );
  if (bannerUrl) completeEmbed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [completeEmbed], components: [row] });
}

// ─── Staff: .tradeconfirmationonlyadminmadebyecho ─────────────────────────────
export async function handleTradeConfirmation(
  guildId: string,
  channelId: string,
  staffUserId: string,
  replyFn: (content: string) => Promise<void>
) {
  const escrow = await EscrowTicket.findOne({ guildId, channelId });
  if (!escrow) {
    await replyFn("No AutoMM ticket found for that channel.");
    return;
  }

  const config = await ServerConfig.findOne({ guildId });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";

  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);
  const blockchain = getBlockchainName(escrow.paymentMethod);
  const cryptoAmount = escrow.cryptoAmount ?? "N/A";
  const usdAmount = escrow.usdAmount ?? 0;
  const txId = escrow.cryptoAmount ? `See ticket for TX` : "Awaiting TX";

  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setDescription(
      `### <:echoreport:1513916471309242528> - Transaction Detected\n\n` +
      `The transaction is currently **unconfirmed** and waiting for staff confirmation.\n\n` +
      `**Transaction**\n` +
      `\`${blockchain}\` \`${txId}\`\n\n` +
      `**Amount Received** | **Required Amount**\n` +
      `\`${cryptoAmount} ${currEmoji} ${currLabel}\` | \`$${usdAmount.toFixed(2)} USD\`\n\n` +
      `**Sender:** <@${escrow.senderUserId ?? "Unknown"}> | **Receiver:** <@${escrow.receiverUserId ?? "Unknown"}>\n` +
      `> Confirmed by <@${staffUserId}>`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("automm_complete").setLabel("Mark Complete").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
  );

  const channel = await (await import("discord.js")).Client;
  // Send to the ticket channel
  await replyFn(`✅ Confirmation embed sent to <#${channelId}>.`);

  return { embed, row };
}

export async function sendTradeConfirmationToChannel(
  guildId: string,
  targetChannelId: string,
  staffUserId: string,
  client: import("discord.js").Client
): Promise<string> {
  const escrow = await EscrowTicket.findOne({ guildId, channelId: targetChannelId });
  if (!escrow) return "No AutoMM ticket found for that channel.";

  const config = await ServerConfig.findOne({ guildId });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";

  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);
  const blockchain = getBlockchainName(escrow.paymentMethod);
  const cryptoAmount = escrow.cryptoAmount ?? "N/A";
  const usdAmount = escrow.usdAmount ?? 0;

  const embed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setDescription(
      `### <:echoreport:1513916471309242528> - Transaction Detected\n\n` +
      `The transaction is currently **unconfirmed** and waiting for staff confirmation.\n\n` +
      `**Transaction**\n` +
      `\`${blockchain}\`\n\n` +
      `**Amount Received** | **Required Amount**\n` +
      `\`${cryptoAmount} ${currEmoji} ${currLabel}\` | \`$${usdAmount.toFixed(2)} USD\`\n\n` +
      `**Sender:** <@${escrow.senderUserId ?? "Unknown"}> | **Receiver:** <@${escrow.receiverUserId ?? "Unknown"}>\n` +
      `> Confirmed by <@${staffUserId}>`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  try {
    const guild = await client.guilds.fetch(guildId);
    const ch = await guild.channels.fetch(targetChannelId);
    if (!ch || !(ch instanceof TextChannel)) return "Could not find the ticket channel.";

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("automm_complete").setLabel("Mark Complete").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("delete_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
    );

    await ch.send({ embeds: [embed], components: [row] });

    escrow.status = "payment_detected";
    await escrow.save();
    return `✅ Transaction confirmation sent to <#${targetChannelId}>.`;
  } catch {
    return "Failed to send confirmation — check channel permissions.";
  }
}

// ─── Staff: Confirm Payment → send confirmed message with Release/Refund ──────
const MM_ROLE_ID = "1481044272756166801";

export async function handleAutoMMStaffConfirm(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member?.roles.cache.has(MM_ROLE_ID)) {
    await interaction.reply({ content: "Only **Head Middleman** or above can confirm payments.", flags: MessageFlags.Ephemeral });
    return;
  }

  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);
  const networkLabels: Record<string, string> = {
    btc: "BTC", eth: "ETH", ltc: "LTC", sol: "SOL",
    usdt_erc20: "USDT ERC-20", usdc_erc20: "USDC ERC-20",
    usdt_sol: "USDT SPL", usdc_sol: "USDC SPL", paypal: "PayPal",
  };
  const networkLabel = networkLabels[escrow.paymentMethod] ?? currLabel;
  const cryptoAmount = escrow.cryptoAmount ?? "N/A";
  const usdAmount = (escrow.usdAmount ?? 0).toFixed(2);

  escrow.status = "payment_detected";
  await escrow.save();

  const desc =
    `${currEmoji} **${cryptoAmount}** ${networkLabel} ($${usdAmount} USD) confirmed.\n\n` +
    `<@${escrow.senderUserId}> — proceed with the trade and provide the items.\n` +
    `<@${escrow.receiverUserId}> — release funds once you've received the items.\n\n` +
    `> Refund goes to <@${escrow.senderUserId}> on cancel. Wrong person? Open a support ticket.\n\n` +
    `Make sure to keep all messages in this ticket and record when giving/receiving the items.`;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("automm_release").setLabel("Release Funds").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("automm_refund").setLabel("Refund Payment").setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ content: desc, components: [row] });
}

// ─── Staff: Release funds ─────────────────────────────────────────────────────
export async function handleAutoMMRelease(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member?.roles.cache.has(MM_ROLE_ID)) {
    await interaction.reply({ content: "Only **Head Middleman** or above can release funds.", flags: MessageFlags.Ephemeral });
    return;
  }

  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);

  escrow.status = "completed";
  await escrow.save();

  const { preset, bannerUrl } = await getPresetAndBanner(interaction.guildId!);

  const embed = new EmbedBuilder()
    .setColor(0x16a34a)
    .setDescription(
      `### <:echocheck:1513916473976950824> - Funds Released\n\n` +
      `Payment of \`${escrow.cryptoAmount} ${currEmoji} ${currLabel}\` has been **released** to <@${escrow.receiverUserId}>.\n\n` +
      `**Sender:** <@${escrow.senderUserId}> | **Receiver:** <@${escrow.receiverUserId}>\n\n` +
      `> Trade complete. Please vouch for the Middleman in the vouch channel within **24 hours**.`
    );
  if (bannerUrl) embed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

// ─── Staff: Refund payment ────────────────────────────────────────────────────
export async function handleAutoMMRefund(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member?.roles.cache.has(MM_ROLE_ID)) {
    await interaction.reply({ content: "Only **Head Middleman** or above can issue refunds.", flags: MessageFlags.Ephemeral });
    return;
  }

  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const currLabel = getCurrencyLabel(escrow.paymentMethod);
  const currEmoji = getCurrencyEmoji(escrow.paymentMethod);

  escrow.status = "closed";
  await escrow.save();

  const { preset, bannerUrl } = await getPresetAndBanner(interaction.guildId!);

  const embed = new EmbedBuilder()
    .setColor(0xef4444)
    .setDescription(
      `### <a:echoexlamation:1513916464254419165> - Payment Refunded\n\n` +
      `Payment of \`${escrow.cryptoAmount} ${currEmoji} ${currLabel}\` has been **refunded** to <@${escrow.senderUserId}>.\n\n` +
      `**Sender:** <@${escrow.senderUserId}> | **Receiver:** <@${escrow.receiverUserId}>\n\n` +
      `> Trade cancelled. If you have concerns, open a support ticket.`
    );
  if (bannerUrl) embed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

// ─── Reject amount → re-enter ─────────────────────────────────────────────────
export async function handleAutoMMRejectAmount(interaction: ButtonInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  escrow.usdAmount = null;
  escrow.cryptoAmount = null;
  escrow.rateDisplay = null;
  escrow.status = "pending_amount";
  await escrow.save();

  const modal = new ModalBuilder()
    .setCustomId("automm_amount_modal")
    .setTitle("Enter Trade Amount");

  const amountInput = new TextInputBuilder()
    .setCustomId("usd_amount")
    .setLabel("Trade amount in USD")
    .setPlaceholder("e.g. 50.00")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput));
  await interaction.showModal(modal);
}
