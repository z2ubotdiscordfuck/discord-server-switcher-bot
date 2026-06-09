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
} from "discord.js";
import { EscrowTicket, ServerConfig } from "../db/models.js";
import { buildAutoMMPanelEmbed } from "../embeds/escrow.js";
import { PRESETS } from "../config/presets.js";

export async function handleEscrowPaymentSelect(interaction: StringSelectMenuInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  await interaction.deferReply({ ephemeral: true });

  const paymentMethod = interaction.values[0];

  const config = await ServerConfig.findOne({ guildId: guild.id });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";

  const ticketChannel = await guild.channels.create({
    name: `escrow-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  const escrow = await EscrowTicket.create({
    guildId: guild.id,
    channelId: ticketChannel.id,
    userId: interaction.user.id,
    paymentMethod,
    status: "pending_roles",
  });

  const { embeds, components } = buildAutoMMPanelEmbed(preset, bannerUrl, null, null, paymentMethod);
  await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds, components });

  await interaction.editReply({ content: `Your escrow ticket has been created: <#${ticketChannel.id}>` });
}

export async function handleAutoMMRole(interaction: ButtonInteraction, role: "sender" | "receiver" | "reset") {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", ephemeral: true });
    return;
  }

  const config = await ServerConfig.findOne({ guildId: interaction.guildId });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";

  if (role === "reset") {
    escrow.senderUserId = null;
    escrow.receiverUserId = null;
    escrow.rolesConfirmed = false;
    escrow.status = "pending_roles";
    await escrow.save();
    await interaction.reply({ content: "Roles have been reset.", ephemeral: true });
    return;
  }

  if (role === "sender") {
    if (escrow.senderUserId) {
      await interaction.reply({ content: "Sender is already assigned.", ephemeral: true });
      return;
    }
    escrow.senderUserId = interaction.user.id;
  } else {
    if (escrow.receiverUserId) {
      await interaction.reply({ content: "Receiver is already assigned.", ephemeral: true });
      return;
    }
    escrow.receiverUserId = interaction.user.id;
  }
  await escrow.save();

  if (escrow.senderUserId && escrow.receiverUserId) {
    const confirmEmbed = new EmbedBuilder()
      .setColor(preset.color)
      .setDescription(
        `### <a:echoload:1513916466653561096> • Role Confirmation\n\n` +
        `**Sender** | **Receiver**\n` +
        `<@${escrow.senderUserId}> | <@${escrow.receiverUserId}>\n\n` +
        `> Please confirm that both users and roles are correct.`
      );
    if (bannerUrl) confirmEmbed.setImage(bannerUrl);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("automm_confirm_roles")
        .setLabel("✓ Correct")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("automm_reset")
        .setLabel("✗ Incorrect")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [confirmEmbed], components: [row] });
  } else {
    await interaction.reply({ content: `You have been set as **${role}**.`, ephemeral: true });
  }
}

export async function handleAutoMMConfirmRoles(interaction: ButtonInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", ephemeral: true });
    return;
  }

  escrow.rolesConfirmed = true;
  escrow.status = "pending_amount";
  await escrow.save();

  const modal = new ModalBuilder()
    .setCustomId("automm_amount_modal")
    .setTitle("Set Payment Amount");

  const amountInput = new TextInputBuilder()
    .setCustomId("amount")
    .setLabel(`Enter the trade amount in ${escrow.paymentMethod.toUpperCase()}`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput));
  await interaction.showModal(modal);
}

export async function handleAutoMMAmountSubmit(interaction: ModalSubmitInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", ephemeral: true });
    return;
  }

  const amount = interaction.fields.getTextInputValue("amount");
  escrow.amount = amount;
  escrow.status = "amount_confirmed";
  await escrow.save();

  const config = await ServerConfig.findOne({ guildId: interaction.guildId });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";

  const confirmEmbed = new EmbedBuilder()
    .setColor(preset.color)
    .setDescription(
      `### <a:echoload:1513916466653561096> • Amount Set\n\n` +
      `> The payment amount has been set to: **$${amount}**\n\n` +
      `Please verify before continuing.`
    );
  if (bannerUrl) confirmEmbed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("automm_confirm_amount")
      .setLabel("<:echocheck:1513916473976950824> Correct")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("automm_reject_amount")
      .setLabel("<a:echoexlamation:1513916464254419165> Incorrect")
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [confirmEmbed], components: [row] });
}

export async function handleAutoMMConfirmAmount(interaction: ButtonInteraction) {
  const escrow = await EscrowTicket.findOne({ channelId: interaction.channelId });
  if (!escrow) {
    await interaction.reply({ content: "Escrow ticket not found.", ephemeral: true });
    return;
  }

  escrow.status = "pending_payment";
  await escrow.save();

  const paymentEmbed = new EmbedBuilder()
    .setColor(0x2563eb)
    .setDescription(
      `### <a:echorules:1513916477944893643> • Payment Details\n\n` +
      `> Send the **exact amount** shown below.\n\n` +
      `**USD Value** | **${escrow.paymentMethod.toUpperCase()} Amount**\n` +
      `\`$${escrow.amount}\` | \`[Calculated by staff]\`\n\n` +
      `**Payment Address**\n` +
      `\`[Staff will provide address]\`\n\n` +
      `> Current Rate: Contact staff for current rate\n\n` +
      `⚠ This trade will be automatically closed in **20 minutes** if no payment activity is detected.`
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("claim_ticket")
      .setLabel("Claim Ticket")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("add_user_ticket")
      .setLabel("Add User")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("delete_ticket")
      .setLabel("Delete Ticket")
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [paymentEmbed], components: [row] });

  setTimeout(async () => {
    const updated = await EscrowTicket.findOne({ channelId: interaction.channelId });
    if (updated && updated.status === "pending_payment") {
      const channel = interaction.channel;
      if (channel && channel.isTextBased() && !channel.isDMBased()) {
        await (channel as TextChannel).send({ content: "⚠ No payment activity detected in 20 minutes. This ticket has been flagged. A staff member will review." });
      }
    }
  }, 20 * 60 * 1000);
}
