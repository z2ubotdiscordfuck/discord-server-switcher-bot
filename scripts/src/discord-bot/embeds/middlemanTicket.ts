import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildMiddlemanTicketEmbed(
  preset: MarketplacePreset,
  bannerUrl: string,
  userId: string,
  otherTrader: string,
  tradeType: string,
  mmFee: string,
  inviteLink: string,
  extraNotes: string
) {
  const embed = new EmbedBuilder()
    .setTitle("Middleman Request")
    .setColor(0x2563eb)
    .setDescription(
      `**Requesting User:** <@${userId}>\n\n` +
      `**Other Trader:** ${otherTrader}\n\n` +
      `**Trade Type / Platform:** ${tradeType}\n\n` +
      `**MM Fee Paid By:** ${mmFee}\n\n` +
      `**Can Other Trader Join via Invite?:** ${inviteLink}\n\n` +
      `**Extra Notes:** ${extraNotes || "None"}`
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
