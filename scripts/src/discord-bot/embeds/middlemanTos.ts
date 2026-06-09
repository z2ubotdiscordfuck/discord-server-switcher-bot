import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildMiddlemanTosEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle("Request Middleman")
    .setColor(0x2563eb)
    .setDescription(
      `> Please read <#1480663797545828384> before proceeding, then click **Request Middleman** and complete the form.\n\n` +
      `**Vouch Required**\n` +
      `> You are required to vouch for your Middleman after the trade in <#1471435501742588028>. Failure to do so within __24 hours__ will result in a **Blacklist** from our MM service.\n\n` +
      `**Troll Tickets**\n` +
      `> Any attempt to create fake or troll tickets will result in a **Middleman ban**.\n\n` +
      `**Disclaimer**\n` +
      `> We are **NOT** responsible for anything that occurs after the trade has been completed.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("request_middleman")
      .setLabel("Request Middleman")
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}
