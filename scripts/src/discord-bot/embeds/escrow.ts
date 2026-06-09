import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import type { MarketplacePreset } from "../config/presets.js";

export function buildEscrowEmbed(preset: MarketplacePreset, bannerUrl: string) {
  const embed = new EmbedBuilder()
    .setTitle("How It Works")
    .setColor(preset.color)
    .setDescription(
      `# **How It Works**\n` +
      `> **1. Deposit —** The buyer selects a payment method and opens a private transaction ticket\n` +
      `> **2. Escrow —** Funds are securely held in the platform escrow system\n` +
      `> **3. Delivery —** The seller delivers the agreed item or service\n` +
      `> **4. Release —** The buyer confirms completion and funds are released\n\n` +
      `# **Supported Currencies**\n\n` +
      `> Bitcoin (BTC)\n` +
      `> Ethereum (ETH)\n` +
      `> Litecoin (LTC)\n` +
      `> Solana (SOL)\n` +
      `> USDT (ERC-20)\n` +
      `> USDC (ERC-20)\n` +
      `> USDT (SOL)\n` +
      `> USDC (SOL)\n\n` +
      `> ⚠ All transactions are monitored. Any attempt to bypass escrow or move trades to direct messages will result in a permanent ban and loss of access to the service.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("escrow_payment_method")
    .setPlaceholder("Choose Payment Method")
    .addOptions([
      { label: "Bitcoin (BTC)", value: "btc" },
      { label: "PayPal (PP)", value: "paypal" },
      { label: "Ethereum (ETH)", value: "eth" },
      { label: "Litecoin (LTC)", value: "ltc" },
      { label: "Solana (SOL)", value: "sol" },
      { label: "USDT (ERC20)", value: "usdt_erc20" },
      { label: "USDC (ERC20)", value: "usdc_erc20" },
      { label: "USDT (SOL)", value: "usdt_sol" },
      { label: "USDC (SOL)", value: "usdc_sol" },
    ]);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  return { embeds: [embed], components: [row] };
}

export function buildAutoMMPanelEmbed(
  preset: MarketplacePreset,
  bannerUrl: string,
  senderUserId: string | null,
  receiverUserId: string | null,
  paymentMethod: string
) {
  const payLabel = paymentMethod.toUpperCase();

  const embed = new EmbedBuilder()
    .setTitle(`👋 • ${preset.serverName} Middleman Service`)
    .setColor(preset.color)
    .setDescription(
      `——————————————————\n` +
      `Hello ${senderUserId ? `<@${senderUserId}>` : "@user"} & ${receiverUserId ? `<@${receiverUserId}>` : "@user"}! Welcome to the automated Middleman system.\n\n` +
      `Please follow the steps below carefully to continue your trade.\n\n` +
      `### <:echomem:1513916469036060753> • Select Your Role\n` +
      `> Choose your position in this transaction:\n\n` +
      `> - **Sender** → You are sending ${payLabel} through the bot\n` +
      `> - **Receiver** → You are receiving ${payLabel} after completion\n\n` +
      `${senderUserId ? `[<@${senderUserId}>]` : "[@sender_user]"} | ${receiverUserId ? `[<@${receiverUserId}>]` : "[@receiver_user]"}`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("automm_sender")
      .setLabel("Sender")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("automm_receiver")
      .setLabel("Receiver")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("automm_reset")
      .setLabel("Reset")
      .setStyle(ButtonStyle.Danger)
  );

  const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("claim_ticket")
      .setLabel("Claim Ticket")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("add_user_ticket")
      .setLabel("Add User")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("delete_ticket")
      .setLabel("Delete Ticket")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row, controlRow] };
}
