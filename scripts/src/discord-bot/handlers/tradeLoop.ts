import { Client, TextChannel } from "discord.js";

// ─── Currency config ──────────────────────────────────────────────────────────
const AUTOMM_CURRENCIES = [
  { label: "BTC",  emoji: "<:echobtc:1513916482294120640>",   min: 0.0008, max: 1.4,    rate: 67400,  txType: "btc"  },
  { label: "ETH",  emoji: "<:echoeth:1513916818962649108>",   min: 0.01,   max: 7.5,    rate: 3520,   txType: "eth"  },
  { label: "LTC",  emoji: "<:echoltc:1513916480427786311>",   min: 0.1,    max: 60,     rate: 88,     txType: "btc"  },
  { label: "SOL",  emoji: "<:echosol:1513916493803552798>",   min: 0.5,    max: 120,    rate: 168,    txType: "sol"  },
  { label: "USDT", emoji: "<:echousdt:1513916491328655410>",  min: 10,     max: 4800,   rate: 1,      txType: "eth"  },
  { label: "USDC", emoji: "<:echousdc:1513916486627102976>",  min: 10,     max: 4800,   rate: 1,      txType: "eth"  },
];

const MM_CURRENCIES = [
  { label: "PayPal", emoji: "<:echpaypal:1513916484802445332>", min: 10, max: 1800, rate: 1,   txType: "none" },
  { label: "BTC",    emoji: "<:echobtc:1513916482294120640>",   min: 0.0008, max: 0.8, rate: 67400, txType: "btc" },
  { label: "ETH",    emoji: "<:echoeth:1513916818962649108>",   min: 0.01, max: 4,  rate: 3520,  txType: "eth" },
  { label: "LTC",    emoji: "<:echoltc:1513916480427786311>",   min: 0.1,  max: 30, rate: 88,    txType: "btc" },
];

// All emojis shown in the AutoMM header row
const AUTOMM_HEADER_EMOJIS =
  "<:echoltc:1513916480427786311> " +
  "<:echobtc:1513916482294120640> " +
  "<:echoeth:1513916818962649108> " +
  "<:echousdc:1513916486627102976> " +
  "<:echousdcet:1513916488963068175> " +
  "<:echousdt:1513916491328655410> " +
  "<:echpaypal:1513916484802445332>";

// MM header shows PayPal first
const MM_HEADER_EMOJIS =
  "<:echpaypal:1513916484802445332> " +
  "<:echobtc:1513916482294120640> " +
  "<:echoeth:1513916818962649108> " +
  "<:echoltc:1513916480427786311> " +
  "<:echousdt:1513916491328655410> " +
  "<:echousdc:1513916486627102976>";

// ─── Random helpers ───────────────────────────────────────────────────────────
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function randomBase58(len: number): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generateTxId(txType: string): string {
  switch (txType) {
    case "eth":  return "0x" + randomHex(64);
    case "sol":  return randomBase58(88);
    case "btc":  return randomHex(64);
    default:     return "";
  }
}

function formatAmount(value: number, label: string): string {
  if (label === "USDT" || label === "USDC" || label === "PayPal") {
    return value.toFixed(2);
  }
  if (label === "BTC" || label === "ETH") {
    return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  }
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

// ─── Message builders ─────────────────────────────────────────────────────────
function buildAutoMMTradeMessage(): string {
  const cur = AUTOMM_CURRENCIES[Math.floor(Math.random() * AUTOMM_CURRENCIES.length)];
  const amount = rand(cur.min, cur.max);
  const usd = amount * cur.rate;
  const txId = generateTxId(cur.txType);
  const amountStr = formatAmount(amount, cur.label);
  const usdStr = usd.toFixed(2);

  return (
    `## ${AUTOMM_HEADER_EMOJIS}  ・Trade Completed\n` +
    `### **\`${amountStr}\` ${cur.emoji} ${cur.label}** ($${usdStr} USD)\n` +
    `### Sender\n` +
    `\`Anonymous\`\n` +
    `### Receiver\n` +
    `\`Anonymous\`\n` +
    `### Transaction ID\n` +
    `\`${txId}\``
  );
}

function buildMMVouchMessage(senderName: string, receiverName: string): string {
  const cur = MM_CURRENCIES[Math.floor(Math.random() * MM_CURRENCIES.length)];
  const amount = rand(cur.min, cur.max);
  const usd = amount * cur.rate;
  const amountStr = formatAmount(amount, cur.label);
  const usdStr = usd.toFixed(2);

  return (
    `## ${MM_HEADER_EMOJIS}  ・MM Trade Vouched\n` +
    `### **\`${amountStr}\` ${cur.emoji} ${cur.label}** ($${usdStr} USD)\n` +
    `### Sender\n` +
    `\`${senderName}\`\n` +
    `### Receiver\n` +
    `\`${receiverName}\``
  );
}

// ─── Loop state ───────────────────────────────────────────────────────────────
const activeLoops = new Map<string, ReturnType<typeof setTimeout>>();

async function getRandomMemberNames(client: Client, guildId: string): Promise<[string, string]> {
  try {
    const guild = await client.guilds.fetch(guildId);
    const members = await guild.members.fetch({ limit: 100 });
    const humans = members.filter((m) => !m.user.bot).map((m) => m.user.username);
    if (humans.length < 2) return ["User1", "User2"];
    const shuffled = [...humans].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  } catch {
    return ["User1", "User2"];
  }
}

function scheduleNext(client: Client, guildId: string, channelId: string) {
  const delay = Math.floor(rand(2 * 60 * 1000, 5 * 60 * 1000));
  const timer = setTimeout(async () => {
    try {
      const guild = await client.guilds.fetch(guildId);
      const channel = await guild.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        activeLoops.delete(guildId);
        return;
      }

      const isVouch = Math.random() < 0.4;
      let content: string;
      if (isVouch) {
        const [sender, receiver] = await getRandomMemberNames(client, guildId);
        content = buildMMVouchMessage(sender, receiver);
      } else {
        content = buildAutoMMTradeMessage();
      }

      await channel.send({ content });
    } catch (err) {
      console.error("[TradeLoop] Post error:", err);
    }
    scheduleNext(client, guildId, channelId);
  }, delay);

  activeLoops.set(guildId, timer);
}

export function startTradeLoop(client: Client, guildId: string, channelId: string) {
  if (activeLoops.has(guildId)) {
    clearTimeout(activeLoops.get(guildId)!);
  }
  scheduleNext(client, guildId, channelId);
}

export function stopTradeLoop(guildId: string): boolean {
  if (!activeLoops.has(guildId)) return false;
  clearTimeout(activeLoops.get(guildId)!);
  activeLoops.delete(guildId);
  return true;
}

export function isLoopActive(guildId: string): boolean {
  return activeLoops.has(guildId);
}
