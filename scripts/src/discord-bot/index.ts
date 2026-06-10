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
  handleAutoMMStaffConfirm,
  handleAutoMMRelease,
  handleAutoMMRefund,
  sendTradeConfirmationToChannel,
} from "./handlers/escrowHandler.js";
import { startTradeLoop, stopTradeLoop } from "./handlers/tradeLoop.js";
import { ServerConfig, WalletConfig } from "./db/models.js";
import { getCurrencyLabel } from "./utils/rates.js";

const ADMIN_USERNAME = "imechoplay";
const STAFF_CONFIRM_ROLE = "1490089609013755924";

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

  for (const guild of client.guilds.cache.values()) {
    const config = await ServerConfig.findOne({ guildId: guild.id });
    if (config?.tradeLoopChannelId) {
      startTradeLoop(client, guild.id, config.tradeLoopChannelId);
      console.log(`[TradeLoop] Restored loop for guild ${guild.id}`);
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

  // ── .setwalletadminonlymadebyecho <currency> <address> ────────────────────
  if (content.startsWith(".setwalletadminonlymadebyecho")) {
    if (!isAdmin) { await message.reply("You do not have permission to use this command."); return; }
    const parts = content.slice(".setwalletadminonlymadebyecho".length).trim().split(/\s+/);
    const currency = parts[0]?.toLowerCase();
    const address = parts[1];
    if (!currency || !address) {
      await message.reply(
        "Usage: `.setwalletadminonlymadebyecho <currency> <address>`\n" +
        "Example: `.setwalletadminonlymadebyecho ltc ltc1q530vea6u6tdy7c99ujz3p0tj6f3439mauc676u`\n" +
        "Currencies: `btc` `paypal` `eth` `ltc` `sol` `usdt_erc20` `usdc_erc20` `usdt_sol` `usdc_sol`"
      );
      return;
    }
    const label = getCurrencyLabel(currency);
    await WalletConfig.findOneAndUpdate(
      { guildId: message.guild.id, currency },
      { address, updatedAt: new Date() },
      { upsert: true }
    );
    await ServerConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { universalWallet: "", updatedAt: new Date() },
      { upsert: true }
    );
    await message.reply(`✅ **${label}** payment address set to:\n\`${address}\`\nThis will be shown when traders select ${label} in AutoMM.`);
    return;
  }

  // ── .tradeconfirmationonlyadminmadebyecho <#channel> ──────────────────────
  if (content.startsWith(".tradeconfirmationonlyadminmadebyecho")) {
    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    const hasRole = member?.roles.cache.has(STAFF_CONFIRM_ROLE) ?? false;
    if (!hasRole) { await message.reply("You need the required staff role to use this command."); return; }

    const raw = content.slice(".tradeconfirmationonlyadminmadebyecho".length).trim();
    const channelId = raw.replace(/[^0-9]/g, "");
    if (!channelId) {
      await message.reply("Usage: `.tradeconfirmationonlyadminmadebyecho #channel`");
      return;
    }

    const result = await sendTradeConfirmationToChannel(
      message.guild.id,
      channelId,
      message.author.id,
      client
    );
    await message.reply(result);
    return;
  }

  // ── .startloopadminonlymadebyecho <channelId> ─────────────────────────────
  if (content.startsWith(".startloopadminonlymadebyecho")) {
    if (!isAdmin) { await message.reply("You do not have permission to use this command."); return; }
    const channelId = content.slice(".startloopadminonlymadebyecho".length).trim();
    if (!channelId) {
      await message.reply("Usage: `.startloopadminonlymadebyecho <channelId>`");
      return;
    }
    try { await message.guild.channels.fetch(channelId); } catch {
      await message.reply(`Could not find channel \`${channelId}\`.`); return;
    }
    await ServerConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { tradeLoopChannelId: channelId, updatedAt: new Date() },
      { upsert: true }
    );
    startTradeLoop(client, message.guild.id, channelId);
    await message.reply(`✅ Trade loop started in <#${channelId}>. Posts every 2–5 minutes.`);
    return;
  }

  // ── .stoploopadminonlymadebyecho ──────────────────────────────────────────
  if (content.startsWith(".stoploopadminonlymadebyecho")) {
    if (!isAdmin) { await message.reply("You do not have permission to use this command."); return; }
    const stopped = stopTradeLoop(message.guild.id);
    await ServerConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { tradeLoopChannelId: "", updatedAt: new Date() },
      { upsert: true }
    );
    await message.reply(stopped ? "✅ Trade loop stopped." : "No active loop found.");
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
      } else if (id === "automm_staff_confirm") {
        await handleAutoMMStaffConfirm(interaction as ButtonInteraction);
      } else if (id === "automm_release") {
        await handleAutoMMRelease(interaction as ButtonInteraction);
      } else if (id === "automm_refund") {
        await handleAutoMMRefund(interaction as ButtonInteraction);
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
