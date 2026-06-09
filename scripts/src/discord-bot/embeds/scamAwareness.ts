import { EmbedBuilder } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildScamAwarenessEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle("Common Scams in Roblox and Discord Communities (2025 Guide)")
    .setColor(preset.color)
    .setDescription(
      `This document outlines the most common scams targeting Roblox players and Discord users. It is made to help members, moderators, and staff recognize, avoid, and report suspicious activity.\n\n` +
      `**1. Free Robux and Giveaway Scams**\n> Purpose: To steal Roblox account details or personal information.\n> Description: Scammers promote fake "free Robux," "limited items," or "headless giveaways" through messages, Discord servers, or fake websites.\n\n` +
      `**Warning Signs:**\n> Links not ending in "roblox.com"\n> Promises of large or unrealistic Robux rewards\n> Urgent messages or pressure to act quickly\n\n` +
      `**2. Impersonation of Roblox Staff or Developers**\n> Purpose: To trick users into giving sensitive information.\n> Description: Scammers pretend to be Roblox staff, moderators, or developers to gain trust and access accounts.\n\n` +
      `**Warning Signs:**\n> Claims like "Roblox Support," "Admin," or "QA Tester"\n> Requests for passwords, cookies, verification codes, or login details\n> Fake badges or copied staff profiles\n\n` +
      `**3. Limited Item and Robux Trading Scams**\n> Purpose: To trick users into unsafe or unfair trades.\n> Description: Scammers offer fake deals involving Robux or limited items outside official Roblox systems.\n\n` +
      `**Warning Signs:**\n> Offers of discounted rare items (e.g. cheap headless)\n> Use of "trusted middlemen" outside official staff\n> Requests to move trades outside Roblox trading system\n\n` +
      `-# Stay cautious, verify everything before trading, and report suspicious users to staff immediately.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  return { embeds: [embed], components: [] };
}
