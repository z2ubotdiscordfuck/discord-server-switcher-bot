import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildValuesEmbed(
  preset: MarketplacePreset,
  bannerUrl: string
): { embeds: any[]; components: any[] } {
  const embed = new EmbedBuilder()
    .setColor(preset.color)
    .setDescription(
      `> We are partnered with **mm2values**, **adoptmevalues**, and **petsimulatorvalues**. Click the links shown above to be redirected to their websites.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Adopt Me")
      .setStyle(ButtonStyle.Link)
      .setURL("https://adoptmevalues.gg/"),
    new ButtonBuilder()
      .setLabel("Murder Mystery 2")
      .setStyle(ButtonStyle.Link)
      .setURL("https://supremevalues.com/mm2/"),
    new ButtonBuilder()
      .setLabel("PetSim99/GAG")
      .setStyle(ButtonStyle.Link)
      .setURL("https://petsimulatorvalues.com/")
  );

  return { embeds: [embed], components: [row] };
}
