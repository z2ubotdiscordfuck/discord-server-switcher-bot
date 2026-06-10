import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  GuildMember,
  MessageFlags,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Ticket } from "../db/models.js";
import { buildSupportTicketEmbed } from "../embeds/support.js";
import { buildMiddlemanTicketEmbed } from "../embeds/middlemanTicket.js";
import { ServerConfig } from "../db/models.js";
import { PRESETS } from "../config/presets.js";

const LOG_CHANNEL_ID = "1480663812721086689";

async function sendLog(interaction: ButtonInteraction | ModalSubmitInteraction, embed: EmbedBuilder) {
  try {
    const ch = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
    if (ch && ch.isTextBased() && !ch.isDMBased()) {
      await (ch as TextChannel).send({ embeds: [embed] });
    }
  } catch {}
}

export async function handleOpenSupportTicket(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("support_ticket_modal")
    .setTitle("Open Support Ticket");

  const issueTypeInput = new TextInputBuilder()
    .setCustomId("issue_type")
    .setLabel("What is your issue?")
    .setPlaceholder("e.g. scammer report, middleman issue, other")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const descriptionInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Describe your issue in detail")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const proofInput = new TextInputBuilder()
    .setCustomId("has_proof")
    .setLabel("Do you have proof or images? (Yes/No)")
    .setPlaceholder("Yes or No")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(issueTypeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(proofInput)
  );

  await interaction.showModal(modal);
}

export async function handleSupportTicketSubmit(interaction: ModalSubmitInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const issueType = interaction.fields.getTextInputValue("issue_type");
  const description = interaction.fields.getTextInputValue("description");
  const hasProof = interaction.fields.getTextInputValue("has_proof");

  const config = await ServerConfig.findOne({ guildId: guild.id });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";

  const ticketChannel = await guild.channels.create({
    name: `ticket-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  await Ticket.create({
    guildId: guild.id,
    channelId: ticketChannel.id,
    userId: interaction.user.id,
    ticketType: "support",
    formData: { issueType, description, hasProof },
  });

  const { embeds, components } = buildSupportTicketEmbed(preset, bannerUrl, interaction.user.id, issueType, description, hasProof);
  await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds, components });

  await interaction.editReply({ content: `Your ticket has been created: <#${ticketChannel.id}>` });

  await sendLog(interaction, new EmbedBuilder()
    .setColor(0x2563eb)
    .setTitle("📋 Support Ticket Created")
    .setDescription(
      `**User:** <@${interaction.user.id}> (\`${interaction.user.username}\`)\n` +
      `**Issue:** ${issueType}\n` +
      `**Channel:** <#${ticketChannel.id}>`
    )
    .setTimestamp()
  );
}

export async function handleRequestMiddleman(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("middleman_ticket_modal")
    .setTitle("Request Middleman");

  const otherTraderInput = new TextInputBuilder()
    .setCustomId("other_trader")
    .setLabel("Other trader username")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const tradeTypeInput = new TextInputBuilder()
    .setCustomId("trade_type")
    .setLabel("Trade type / platform")
    .setPlaceholder("e.g. Roblox, Discord, Crypto")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const mmFeeInput = new TextInputBuilder()
    .setCustomId("mm_fee")
    .setLabel("MM fee paid by? (buyer/seller/split)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const inviteLinkInput = new TextInputBuilder()
    .setCustomId("invite_link")
    .setLabel("Other trader can join via invite? (Yes/No)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const notesInput = new TextInputBuilder()
    .setCustomId("extra_notes")
    .setLabel("Any extra notes")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(otherTraderInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(tradeTypeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(mmFeeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(inviteLinkInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput)
  );

  await interaction.showModal(modal);
}

export async function handleMiddlemanTicketSubmit(interaction: ModalSubmitInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const otherTrader = interaction.fields.getTextInputValue("other_trader");
  const tradeType = interaction.fields.getTextInputValue("trade_type");
  const mmFee = interaction.fields.getTextInputValue("mm_fee");
  const inviteLink = interaction.fields.getTextInputValue("invite_link");
  const extraNotes = interaction.fields.getTextInputValue("extra_notes");

  const config = await ServerConfig.findOne({ guildId: guild.id });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";

  const ticketChannel = await guild.channels.create({
    name: `mm-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  await Ticket.create({
    guildId: guild.id,
    channelId: ticketChannel.id,
    userId: interaction.user.id,
    ticketType: "middleman",
    formData: { otherTrader, tradeType, mmFee, inviteLink, extraNotes },
  });

  const { embeds, components } = buildMiddlemanTicketEmbed(preset, bannerUrl, interaction.user.id, otherTrader, tradeType, mmFee, inviteLink, extraNotes);
  await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds, components });

  await interaction.editReply({ content: `Your Middleman ticket has been created: <#${ticketChannel.id}>` });

  await sendLog(interaction, new EmbedBuilder()
    .setColor(0x16a34a)
    .setTitle("🤝 Middleman Ticket Created")
    .setDescription(
      `**User:** <@${interaction.user.id}> (\`${interaction.user.username}\`)\n` +
      `**Other Trader:** ${otherTrader}\n` +
      `**Trade Type:** ${tradeType}\n` +
      `**Channel:** <#${ticketChannel.id}>`
    )
    .setTimestamp()
  );
}

const MM_ROLE_ID = "1481044272756166801";

export async function handleClaimTicket(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  const hasMMRole = member?.roles.cache.has(MM_ROLE_ID) ?? false;

  // Try regular ticket first, then escrow ticket
  const { EscrowTicket } = await import("../db/models.js");
  const ticket = await Ticket.findOne({ channelId: interaction.channelId });
  const escrow = ticket ? null : await EscrowTicket.findOne({ channelId: interaction.channelId });

  if (!ticket && !escrow) {
    await interaction.reply({ content: "Ticket not found.", flags: MessageFlags.Ephemeral });
    return;
  }

  const existingClaim = ticket?.claimedBy ?? escrow?.claimedBy;
  if (existingClaim) {
    await interaction.reply({ content: `This ticket is already claimed by <@${existingClaim}>.`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (ticket) {
    ticket.claimedBy = interaction.user.id;
    ticket.status = "claimed";
    await ticket.save();
  } else if (escrow) {
    escrow.claimedBy = interaction.user.id;
    await escrow.save();
  }

  await interaction.reply({ content: `Ticket claimed by <@${interaction.user.id}>.` });

  // Lock the channel if claimer has MM role
  if (hasMMRole && interaction.channel && "permissionOverwrites" in interaction.channel) {
    const ch = interaction.channel as import("discord.js").TextChannel;
    try {
      // Deny @everyone from sending messages
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      // Ensure the claimer can still send
      await ch.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true,
        SendMessages: true,
      });
      await ch.send({ content: `🔒 This ticket has been locked by <@${interaction.user.id}>. Only staff can now send messages here.` });
    } catch (err) {
      console.error("[ClaimTicket] Failed to lock channel:", err);
    }
  }
}

export async function handleDeleteTicket(interaction: ButtonInteraction) {
  const channel = interaction.channel;
  if (!channel) return;

  const ticket = await Ticket.findOne({ channelId: channel.id });
  const ticketType = ticket?.ticketType ?? "unknown";
  const ticketUser = ticket?.userId;

  await interaction.reply({ content: "Closing ticket..." });

  await sendLog(interaction, new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("🗑️ Ticket Closed")
    .setDescription(
      `**Channel:** \`${"name" in channel ? (channel as TextChannel).name : channel.id}\`\n` +
      `**Closed By:** <@${interaction.user.id}> (\`${interaction.user.username}\`)\n` +
      `**Type:** ${ticketType}` +
      (ticketUser ? `\n**Owner:** <@${ticketUser}>` : "")
    )
    .setTimestamp()
  );

  await Ticket.deleteOne({ channelId: channel.id });
  setTimeout(() => channel.delete().catch(() => {}), 3000);
}

export async function handleAddUser(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("add_user_modal")
    .setTitle("Add User to Ticket");

  const userIdInput = new TextInputBuilder()
    .setCustomId("user_id")
    .setLabel("User ID to add")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput));
  await interaction.showModal(modal);
}

export async function handleAddUserSubmit(interaction: ModalSubmitInteraction) {
  const guild = interaction.guild;
  const channel = interaction.channel;
  if (!guild || !channel || !channel.isTextBased()) return;

  const userId = interaction.fields.getTextInputValue("user_id");
  try {
    const member = await guild.members.fetch(userId);
    await (channel as any).permissionOverwrites.edit(member, {
      ViewChannel: true,
      SendMessages: true,
    });
    await interaction.reply({ content: `<@${userId}> has been added to the ticket.` });
  } catch {
    await interaction.reply({ content: "Could not find that user. Make sure the ID is correct.", flags: MessageFlags.Ephemeral });
  }
}
