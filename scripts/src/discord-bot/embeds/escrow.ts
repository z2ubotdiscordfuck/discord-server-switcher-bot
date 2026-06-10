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
      `> <:echobtc:1513916482294120640> Bitcoin (BTC)\n` +
      `> <:echpaypal:1513916484802445332> PayPal (PP)\n` +
      `> <:echoeth:1513916818962649108> Ethereum (ETH)\n` +
      `> <:echoltc:1513916480427786311> Litecoin (LTC)\n` +
      `> <:echosol:1513916493803552798> Solana (SOL)\n` +
      `> <:echousdt:1513916491328655410> USDT (ERC-20)\n` +
      `> <:echousdc:1513916486627102976> USDC (ERC-20)\n` +
      `> <:echousdt:1513916491328655410> USDT (SOL)\n` +
      `> <:echousdc:1513916486627102976> USDC (SOL)\n\n` +
      `> ⚠ All transactions are monitored. Any attempt to bypass escrow or move trades to direct messages will result in a permanent ban and loss of access to the service.`
    );

  if (bannerUrl) embed.setImage(bannerUrl);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("escrow_payment_method")
    .setPlaceholder("Choose Payment Method")
    .addOptions([
      { label: "Bitcoin (BTC)", value: "btc", emoji: { id: "1513916482294120640", name: "echobtc" } },
      { label: "PayPal (PP)", value: "paypal", emoji: { id: "1513916484802445332", name: "echpaypal" } },
      { label: "Ethereum (ETH)", value: "eth", emoji: { id: "1513916818962649108", name: "echoeth" } },
      { label: "Litecoin (LTC)", value: "ltc", emoji: { id: "1513916480427786311", name: "echoltc" } },
      { label: "Solana (SOL)", value: "sol", emoji: { id: "1513916493803552798", name: "echosol" } },
      { label: "USDT (ERC20)", value: "usdt_erc20", emoji: { id: "1513916491328655410", name: "echousdt" } },
      { label: "USDC (ERC20)", value: "usdc_erc20", emoji: { id: "1513916486627102976", name: "echousdc" } },
      { label: "USDT (SOL)", value: "usdt_sol", emoji: { id: "1513916491328655410", name: "echousdt" } },
      { label: "USDC (SOL)", value: "usdc_sol", emoji: { id: "1513916486627102976", name: "echousdc" } },
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
    .setTitle(`👋 - ${preset.serverName} Middleman Service`)
    .setColor(preset.color)
    .setDescription(
      `——————————————————\n` +
      `Hello ${senderUserId ? `<@${senderUserId}>` : "@user"} & ${receiverUserId ? `<@${receiverUserId}>` : "@user"}! Welcome to the automated Middleman system.\n\n` +
      `Please follow the steps below carefully to continue your trade.\n\n` +
      `### <:echomem:1513916469036060753> - Select Your Role\n` +
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
