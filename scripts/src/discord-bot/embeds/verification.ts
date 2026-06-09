import { EmbedBuilder } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildVerificationEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle(`${preset.serverName} | Trader Verification`)
    .setColor(preset.color)
    .setDescription(
      `To maintain a **safe, professional, and trusted** trading environment, ${preset.serverName} runs an official **Trader Verification Program** for members involved in trading.\n\n` +
      `## __**Verified Trader**__\n\n` +
      `The **Verified Trader** role is given to users who complete the verification process and successfully prove ownership of the items or assets they intend to trade.\n\n` +
      `### **Requirements**\n` +
      `> - Contact a **Support Manager or higher**\n` +
      `> - Provide proof of ownership\n` +
      `> - Submit any additional requested verification details\n` +
      `> - Pass staff review and approval\n\n` +
      `Once approved, you will receive the **Verified Trader** role and unlock verified trading access.\n\n` +
      `## __**Trusted Trader**__\n\n` +
      `The **Trusted Trader** role is reserved for members who have built a strong and consistent trading reputation within the community.\n\n` +
      `### **Considerations**\n` +
      `> - Verified successful trade history\n` +
      `> - Positive feedback from other users\n` +
      `> - Use of official marketplace systems\n` +
      `> - Compliance with all server rules\n` +
      `> - Final staff approval\n\n` +
      `Trusted Trader status is assigned at management discretion only.\n\n` +
      `## __**Why Verify?**__\n\n` +
      `> - Builds trust with other traders\n` +
      `> - Improves trade safety and reliability\n` +
      `> - Reduces scam risk\n` +
      `> - Maintains professional marketplace standards\n\n` +
      `> All verification decisions are final and handled exclusively by ${preset.serverName} staff team`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  return { embeds: [embed], components: [] };
}
