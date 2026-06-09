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
  handleAutoMMRole,
  handleAutoMMConfirmRoles,
  handleAutoMMAmountSubmit,
  handleAutoMMConfirmAmount,
} from "./handlers/escrowHandler.js";

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

client.once("ready", () => {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();

  if (content.startsWith(".switchserveradminonlymadebyecho")) {
    const args = content.slice(".switchserveradminonlymadebyecho".length).trim().split(/\s+/).filter(Boolean);
    await handleSwitchServer(message, args);
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
        await handleAutoMMRole(interaction as ButtonInteraction, "reset");
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
        await (interaction as any).reply({ content: "An error occurred.", ephemeral: true });
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
