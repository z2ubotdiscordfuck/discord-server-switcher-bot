import { EmbedBuilder } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildTosEmbed(preset: MarketplacePreset, bannerUrl: string, thumbnailUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle("Please Read Carefully")
    .setColor(preset.color)
    .setDescription(
      `> By opening a ticket and using our **Middleman Services**, you confirm that you have read, understood, and __agreed__ to all terms listed below.\n\n` +
      `### 1 · Responsibility Disclaimer\n` +
      `> We are **not responsible** for any losses that are __not caused by the Middleman__.\n` +
      `> *Examples:* incorrect crypto wallet addresses, wrong PayPal emails, incorrect gamepass links, or misspelled Roblox usernames during Limited item trades.\n\n` +
      `### 2 · AFK Middlemen\n` +
      `> If a Middleman becomes **AFK during a trade**, it means they are temporarily unavailable due to real-life responsibilities.\n` +
      `> They will return within a few hours, and you will be __notified once they are back online__.\n\n` +
      `### 3 · AFK Traders\n` +
      `> We are **not responsible** if either trader becomes AFK.\n` +
      `> This includes situations where items are returned to the seller if the buyer does not complete their part of the trade.\n\n` +
      `### 4 · Vouching Requirement\n` +
      `> You are **required to __vouch__** for the Middleman after every completed trade.\n` +
      `> Failure to vouch within **24 hours** may result in a __blacklist__ from our Middleman services.\n\n` +
      `-# By opening a Middleman ticket, you automatically agree to these terms.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);
  if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

  return { embeds: [embed], components: [] };
}

export function buildTradingRulesEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle("Please Read & Follow All Rules")
    .setColor(preset.color)
    .setDescription(
      `> These terms are in place to keep our marketplace **safe, fair, and scam-free** for all members.\n` +
      `> By participating in trading within this server, you __agree__ to follow all rules listed below.\n\n` +
      `### 1 · Cross-Trading\n` +
      `> Cross-trading is **only permitted** with __server-approved Middlemen__.\n` +
      `> Violations will result in a warning. *(3 warnings = mute)*\n\n` +
      `### 2 · Prohibited Statements\n` +
      `> Terms such as **"mm of my choice"** or **"ngf"** are strictly not allowed during cross-trading.\n` +
      `> Violations will result in warnings. *(3 warnings = mute, further violations = ban)*\n\n` +
      `### 3 · Trading Locations\n` +
      `> Cross-trading is only allowed in the designated channel.\n` +
      `> Roblox-related trading is only allowed in the approved trading channel.\n\n` +
      `### 4 · Middleman Violations\n` +
      `> Suggesting an unapproved Middleman or refusing to use a trusted one will result in an __instant ban__.\n` +
      `> If you notice a violation, report it immediately through the support system.\n\n` +
      `### 5 · Illegal Trading\n` +
      `> Trading illegal or prohibited items is strictly forbidden and will result in an __instant ban__.\n` +
      `> This includes Discord Nitro, accounts, scripts, cheats, or anything violating Discord's Terms of Service.\n\n` +
      `### 6 · Middleman Usage\n` +
      `> A Middleman must be used for all cross-trades, following the official Middleman guidelines.\n` +
      `> Request a Middleman through the designated support channel.\n\n` +
      `### 7 · Respectful Trading\n` +
      `> All members must remain **respectful and polite**, especially toward new traders.\n` +
      `> Toxic or disruptive behavior may result in warnings or bans.\n\n` +
      `-# Trading within this server confirms acceptance of these terms`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  return { embeds: [embed], components: [] };
}
