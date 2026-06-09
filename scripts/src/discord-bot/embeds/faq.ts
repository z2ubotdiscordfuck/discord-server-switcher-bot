import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildFaqEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle(`What is ${preset.name} Marketplace?`)
    .setColor(preset.color)
    .setDescription(
      `# **What is ${preset.name} Marketplace?**\n` +
      `> ${preset.name} Marketplace is a secure platform designed for safe player-to-player trading of digital gaming goods. We provide the system for protected transactions — users handle the trading process itself.\n` +
      `> Our platform supports **250+ games and major titles worldwide**.\n\n` +
      `# **How does the Middleman service work?**\n` +
      `> Our verified Middlemen act as neutral third parties who securely hold and transfer items or funds during a trade. This ensures both buyers and sellers are fully protected throughout the process.\n\n` +
      `# **Is it free to use?**\n` +
      `> Yes. Our Middleman service is completely free for standard transactions. Simply open a support ticket and request a Middleman.\n\n` +
      `# **How long does a trade take?**\n` +
      `> Most trades are completed within a few minutes. Our Middlemen are available **24/7** to assist and complete transactions as quickly as possible.\n\n` +
      `# **What if something goes wrong?**\n` +
      `> All trades are monitored by our team. If any issue occurs, you should open a support ticket immediately so staff can review and resolve the situation.\n\n` +
      `# **Where can I report a scammer?**\n` +
      `> Report scammers by opening a support ticket and submitting all relevant proof. Our moderation team will investigate and take appropriate action.\n` +
      `> For further assistance, please use the button below to access customer support.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const components = [];
  if (preset.customerServiceUrl) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Customer Service")
        .setStyle(ButtonStyle.Link)
        .setURL(preset.customerServiceUrl)
    );
    components.push(row);
  }

  return { embeds: [embed], components };
}
