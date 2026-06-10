import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export const INDEXING_BASES = [
  { value: "diamond",     label: "Diamond Base",     description: "5+ Garamas or $20",    emojiId: "1490933774156955659", emojiName: "Diamond_Mutation",    animated: false },
  { value: "rainbow",     label: "Rainbow Base",     description: "5+ Garamas or $20",    emojiId: "1490933734910988298", emojiName: "Rainbow_Mutation",    animated: false },
  { value: "candy",       label: "Candy Base",       description: "3+ Garamas or $8",     emojiId: "1490933701964726375", emojiName: "Candy_Mutation",      animated: false },
  { value: "lava",        label: "Lava Base",        description: "4+ Garamas or $10",    emojiId: "1490933698156167270", emojiName: "Lava_Mutation",       animated: false },
  { value: "galaxy",      label: "Galaxy Base",      description: "4+ Garamas or $10",    emojiId: "1490933717517209652", emojiName: "Galaxy_Mutation",     animated: false },
  { value: "gold",        label: "Gold Base",        description: "4+ Garamas or $10",    emojiId: "1490933721518571602", emojiName: "Gold_Mutation",       animated: false },
  { value: "yinyang",     label: "Yin Yang Base",    description: "5+ Garamas or $15",    emojiId: "1490933738576805962", emojiName: "YinYang_Mutation",    animated: false },
  { value: "radioactive", label: "Radioactive Base", description: "5+ Garamas or $17",    emojiId: "1490933731232448724", emojiName: "Radioactive_Mutation", animated: false },
  { value: "cursed",      label: "Cursed Base",      description: "5+ Garamas or $17",    emojiId: "1490933709678055635", emojiName: "Cursed_Mutation",     animated: false },
  { value: "divine",      label: "Divine Base",      description: "8+ Garamas or $25",    emojiId: "1490933713704321105", emojiName: "Divine_Mutation",     animated: false },
  { value: "halloween",   label: "Halloween Base",   description: "$4 or 1–2 Garamas",    emojiId: "1490933749624340493", emojiName: "headlesshorseman",    animated: false },
  { value: "christmas",   label: "Christmas Base",   description: "$4 or 1–2 Garamas",    emojiId: "1490933770600058930", emojiName: "cookiandmilki",       animated: false },
  { value: "aquatic",     label: "Aquatic Base",     description: "$4 or 1–2 Garamas",    emojiId: "1491297239996301483", emojiName: "Fishspinning",        animated: true  },
  { value: "easter",      label: "Easter Base",      description: "$4 or 1–2 Garamas",    emojiId: "1491297988948262973", emojiName: "e_z_heart",           animated: false },
];

export function buildIndexingServiceEmbed(
  preset: MarketplacePreset,
  bannerUrl: string
): { embeds: any[]; components: any[] } {
  const embed = new EmbedBuilder()
    .setColor(preset.color)
    .setDescription(
      `### PlayerAuctions Marketplace — Indexing Service\n` +
      `> Select one of the available bases below and a professional indexer will assist you.\n\n` +
      `One of our professional indexers will assist you in completing it!\n\n` +
      `<:Diamond_Mutation:1490933774156955659> **Diamond Base** — \`5+ Garamas or $20\`\n` +
      `<:Rainbow_Mutation:1490933734910988298> **Rainbow Base** — \`5+ Garamas or $20\`\n` +
      `<:Candy_Mutation:1490933701964726375> **Candy Base** — \`3+ Garamas or $8\`\n` +
      `<:Lava_Mutation:1490933698156167270> **Lava Base** — \`4+ Garamas or $10\`\n` +
      `<:Galaxy_Mutation:1490933717517209652> **Galaxy Base** — \`4+ Garamas or $10\`\n` +
      `<:Gold_Mutation:1490933721518571602> **Gold Base** — \`4+ Garamas or $10\`\n` +
      `<:YinYang_Mutation:1490933738576805962> **Yin Yang Base** — \`5+ Garamas or $15\`\n` +
      `<:Radioactive_Mutation:1490933731232448724> **Radioactive Base** — \`5+ Garamas or $17\`\n` +
      `<:Cursed_Mutation:1490933709678055635> **Cursed Base** — \`5+ Garamas or $17\`\n` +
      `<:Divine_Mutation:1490933713704321105> **Divine Base** — \`8+ Garamas or $25\`\n` +
      `<:headlesshorseman:1490933749624340493> **Halloween Base** — \`$4 or 1–2 Garamas\`\n` +
      `<:cookiandmilki:1490933770600058930> **Christmas Base** — \`$4 or 1–2 Garamas\`\n` +
      `<a:Fishspinning:1491297239996301483> **Aquatic Base** — \`$4 or 1–2 Garamas\`\n` +
      `<:e_z_heart:1491297988948262973> **Easter Base** — \`$4 or 1–2 Garamas\`\n\n` +
      `-# Collateral may be required • pricing is negotiable.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("indexing_base_select")
    .setPlaceholder("Select a base to get started...");

  for (const base of INDEXING_BASES) {
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setValue(base.value)
        .setLabel(base.label)
        .setDescription(base.description)
        .setEmoji({ id: base.emojiId, name: base.emojiName, animated: base.animated })
    );
  }

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  return { embeds: [embed], components: [row] };
}
