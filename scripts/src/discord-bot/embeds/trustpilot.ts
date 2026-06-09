import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildTrustpilotEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setColor(preset.color)
    .setDescription(
      `> **${preset.name}** is currently rated __"Excellent"__ with a \`4.0 / 5\` score on Trustpilot.\n\n` +
      `Voice your opinion today and see what **55,000+** users have already shared about their experience with us.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const components = [];
  if (preset.trustpilotUrl) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("View On Trustpilot")
        .setStyle(ButtonStyle.Link)
        .setURL(preset.trustpilotUrl)
    );
    components.push(row);
  }

  return { embeds: [embed], components };
}
