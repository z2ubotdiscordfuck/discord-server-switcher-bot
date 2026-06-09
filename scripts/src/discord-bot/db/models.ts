import mongoose from "mongoose";

const panelMessageSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  panelType: { type: String, required: true },
  preset: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

panelMessageSchema.index({ guildId: 1, channelId: 1, panelType: 1 }, { unique: true });

export const PanelMessage = mongoose.model("PanelMessage", panelMessageSchema);

const ticketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  ticketType: { type: String, enum: ["support", "middleman", "escrow"], required: true },
  claimedBy: { type: String, default: null },
  status: { type: String, enum: ["open", "claimed", "closed"], default: "open" },
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

export const Ticket = mongoose.model("Ticket", ticketSchema);

const escrowTicketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  senderUserId: { type: String, default: null },
  receiverUserId: { type: String, default: null },
  rolesConfirmed: { type: Boolean, default: false },
  amount: { type: String, default: null },
  amountConfirmed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["pending_roles", "roles_confirmed", "pending_amount", "amount_confirmed", "pending_payment", "payment_detected", "completed", "closed"],
    default: "pending_roles",
  },
  claimedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const EscrowTicket = mongoose.model("EscrowTicket", escrowTicketSchema);

const serverConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  preset: { type: String, required: true },
  bannerUrl: { type: String, default: "" },
  thumbnailUrl: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

export const ServerConfig = mongoose.model("ServerConfig", serverConfigSchema);
