import { EmbedBuilder } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildAboutEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle(`Who We Are`)
    .setColor(preset.color)
    .setDescription(
      `> **${preset.name}** is a trusted gaming trade platform providing a __secure player-to-player trading experience__ for users worldwide.\n` +
      `> We support trading across **250+ games and titles**, backed by a reliable Middleman system designed to keep every transaction safe.\n\n` +
      `> With thousands of completed trades and an __Excellent__ Trustpilot rating, our focus remains on **security, speed, and trust**.\n\n` +
      `### **What We Do**\n` +
      `> • Trading of in-game items, accounts, currencies, and digital goods across **250+ games**\n` +
      `> • Secure transactions handled by __verified Middlemen__\n` +
      `> • Peer-to-peer marketplace supported by full **escrow protection**\n` +
      `> • **24/7** Middleman availability\n` +
      `> • Fair dispute handling and buyer/seller protection\n\n` +
      `### **Middleman Services**\n` +
      `> Our Middleman team is available **24/7** to ensure every trade is __safe, fast, and scam-free__.\n` +
      `> Whether trading items, accounts, or currency, our escrow system protects __both parties__ during the entire process.\n\n` +
      `### **Our Promise**\n` +
      `> __Security. Speed. Trust.__\n` +
      `> Every trade is monitored, every Middleman is verified, and every user is valued.\n\n` +
      `-# Trusted by thousands of traders worldwide.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  return { embeds: [embed], components: [] };
}
