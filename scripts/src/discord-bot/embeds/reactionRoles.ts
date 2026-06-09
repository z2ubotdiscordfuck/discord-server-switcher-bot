import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";
import { REACTION_ROLE_IDS } from "../config/presets.js";

export function buildReactionRolesEmbed(preset: MarketplacePreset, bannerUrl: string, thumbnailUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle(`${preset.serverName} | Reaction Roles`)
    .setColor(preset.color)
    .setDescription(
      `> Click on the buttons below to manage your notification preferences and receive updates that matter to you.\n\n` +
      `**\`・\`Additional Notes**\n` +
      `> You can remove roles whenever you like by pressing the same button again.\n>\n` +
      `> These notification roles are optional and only exist to keep you informed about the categories you choose.\n\n` +
      `-# Use the buttons below to add or remove your preferred notification roles.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);
  if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`rr_giveaways_${REACTION_ROLE_IDS[0]}`)
      .setLabel("Giveaways Ping")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`rr_updates_${REACTION_ROLE_IDS[1]}`)
      .setLabel("Updates Ping")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`rr_blacklist_${REACTION_ROLE_IDS[2]}`)
      .setLabel("Blacklist Pings")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}
