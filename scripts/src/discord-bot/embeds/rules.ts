import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildRulesEmbed(preset: MarketplacePreset, bannerUrl: string, thumbnailUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle(`**${preset.serverName} | Rules & Guidelines**`)
    .setColor(preset.color)
    .setDescription(
      `1. **\`・\` Follow Discord Policies**\n> This server operates on Discord's platform, meaning every member is expected to comply with Discord's Terms of Service and Community Guidelines. Failure to do so may result in moderation action.\n\n` +
      `2. **\`・\` Protect Personal Information**\n> Do not share private information belonging to yourself or others without permission. Impersonating staff members, Middlemen, or community members is strictly prohibited.\n\n` +
      `3. **\`・\` Keep Content Appropriate**\n> All content shared within the community must remain suitable for all audiences. NSFW, explicit, graphic, or disturbing material is not allowed.\n\n` +
      `4. **\`・\` Use the Appropriate Channels**\n> Please keep conversations and uploads within their designated channels. Reading channel descriptions beforehand helps maintain an organized server.\n\n` +
      `5. **\`・\` No Illegal Activities**\n> Discussions, promotion, or distribution of illegal activities are strictly forbidden. This includes hacking, piracy, malicious software, and any other unlawful conduct.\n\n` +
      `6. **\`・\` Respect Privacy**\n> Respect the privacy of all members. Sharing personal conversations, screenshots containing sensitive information, or confidential details without consent is prohibited.\n\n` +
      `7. **\`・\` No Impersonation**\n> Pretending to be another member, moderator, public figure, or any other individual is not permitted and may lead to punishment.\n\n` +
      `8. **\`・\` Follow Discord's Official Rules**\n> All members are required to abide by Discord's Terms of Service and Community Guidelines alongside our own regulations.\n> Discord Terms of Service:\n> https://discord.com/terms\n\n` +
      `9. **\`・\` Respect Staff Decisions**\n> The staff team is responsible for maintaining a safe and fair environment. If you have concerns regarding a decision, approach staff respectfully through the proper channels.\n\n` +
      `10. **\`・\` Disclaimer of Responsibility**\n> ${preset.serverName} cannot guarantee the actions of every community member or advertiser. Participating in trades where you choose to go first is entirely at your own risk. If you encounter fraudulent activity, contact management with sufficient evidence for review.\n\n` +
      `11. **\`・\` Advertisement Policy**\n> Purchases relating to server advertisements are final and non-refundable. Members who violate server rules and receive bans may have their advertisements removed without compensation.\n\n` +
      `-# Remaining in this server and using its services means you acknowledge and agree to these guidelines.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);
  if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Discord ToS")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com/terms"),
    new ButtonBuilder()
      .setLabel("Discord Guidelines")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com/guidelines")
  );

  return { embeds: [embed], components: [row] };
}
