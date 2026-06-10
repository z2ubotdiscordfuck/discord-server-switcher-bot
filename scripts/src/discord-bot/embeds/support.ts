import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildSupportEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle("Open a Support Ticket For:")
    .setColor(0x2563eb)
    .setDescription(
      `> - Reporting a __scammer__\n` +
      `> - Reporting a __Middleman__\n` +
      `> - Help with creating a ticket\n` +
      `> - Any other server-related issue\n\n` +
      `-# Click the button below to open a support ticket and connect with our support team.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("open_support_ticket")
      .setLabel("Support")
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

export function buildSupportTicketEmbed(
  preset: MarketplacePreset,
  bannerUrl: string,
  userId: string,
  issueType: string,
  description: string,
  hasProof: string
) {
  const embed = new EmbedBuilder()
    .setTitle("Support Ticket")
    .setColor(0x2563eb)
    .setDescription(
      `**User:** <@${userId}>\n\n` +
      `**Issue Type:** ${issueType}\n\n` +
      `**Description:** ${description}\n\n` +
      `**Has Proof:** ${hasProof}`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

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

  return { embeds: [embed], components: [row] };
}
