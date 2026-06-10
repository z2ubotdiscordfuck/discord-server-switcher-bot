import { Client, EmbedBuilder, TextChannel } from "discord.js";

const MIDDLEMAN_ROLE_ID = "1481044272756166801";
const ARROW_EMOJI = "<a:arrowslogo:1514191782211096628>";

const CUSTOM_EMOJIS = [
  "<:DragonFruit:1514189379332214944>",
  "<:Dragoncanneloni:1514189381794005002>",
  "<:raccoon:1514189376337346620>",
  "<:Meowl:1514189387108319333>",
  "<:strawberryelephant:1514189384482553867>",
  "<:Fragrama:1514189389901594625>",
  "<:echoltc:1513916480427786311>",
  "<:echpaypal:1513916484802445332>",
  "<:commando:1514189371203653692>",
  "<:frozen_tomatrio:1514189374064033802>",
  "<:KitsuneFruit:1514189393030811658>",
  "<:robux:1514189397560656003>",
];

const AUTOMM_CRYPTO_EMOJIS =
  "<:echoltc:1513916480427786311> " +
  "<:echobtc:1513916482294120640> " +
  "<:echoeth:1513916818962649108> " +
  "<:echousdc:1513916486627102976> " +
  "<:echousdcet:1513916488963068175> " +
  "<:echousdt:1513916491328655410> " +
  "<:echpaypal:1513916484802445332>";

const AUTOMM_CURRENCIES = [
  { label: "BTC",  emoji: "<:echobtc:1513916482294120640>",   min: 0.00003, max: 14.8,   rate: 67400 },
  { label: "ETH",  emoji: "<:echoeth:1513916818962649108>",   min: 0.0006,  max: 284,    rate: 3520  },
  { label: "LTC",  emoji: "<:echoltc:1513916480427786311>",   min: 0.02,    max: 11360,  rate: 88    },
  { label: "SOL",  emoji: "<:echosol:1513916493803552798>",   min: 0.01,    max: 5952,   rate: 168   },
  { label: "USDT", emoji: "<:echousdt:1513916491328655410>",  min: 2,       max: 1000000, rate: 1    },
  { label: "USDC", emoji: "<:echousdc:1513916486627102976>",  min: 2,       max: 1000000, rate: 1    },
];

const MM_CURRENCIES = [
  { label: "PayPal", emoji: "<:echpaypal:1513916484802445332>", min: 2, max: 50000,  rate: 1    },
  { label: "BTC",    emoji: "<:echobtc:1513916482294120640>",   min: 0.00003, max: 14.8, rate: 67400 },
  { label: "ETH",    emoji: "<:echoeth:1513916818962649108>",   min: 0.0006, max: 284, rate: 3520  },
  { label: "LTC",    emoji: "<:echoltc:1513916480427786311>",   min: 0.02, max: 11360, rate: 88    },
  { label: "Robux",  emoji: "<:robux:1514189397560656003>",     min: 200, max: 100000, rate: 0.004 },
];

const VOUCH_ITEMS = [
  "Dragon Fruit", "Kitsune", "Raccoon", "Canneloni", "Meowl Pet",
  "Strawberry Elephant", "Fragrama", "Robux", "Frozen Tomatrio", "Commando",
  "Limited Pet", "Rare Item", "Game Currency", "Season Pass", "Dragon",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pick2Random<T>(arr: T[]): [T, T] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function randomHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function randomBase58(len: number) {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generateTxId(label: string): string {
  if (label === "ETH" || label === "USDT" || label === "USDC") return "0x" + randomHex(64);
  if (label === "SOL") return randomBase58(88);
  return randomHex(64);
}

function formatAmount(value: number, label: string): string {
  if (label === "USDT" || label === "USDC" || label === "PayPal") return value.toFixed(2);
  if (label === "Robux") return Math.floor(value).toLocaleString();
  if (value < 0.01) return value.toFixed(8).replace(/\.?0+$/, "");
  if (value < 1) return value.toFixed(6).replace(/\.?0+$/, "");
  return value.toFixed(4).replace(/\.?0+$/, "");
}

// ─── Random member helpers ────────────────────────────────────────────────────
async function getRandomMemberNames(client: Client, guildId: string): Promise<[string, string]> {
  try {
    const guild = await client.guilds.fetch(guildId);
    const members = await guild.members.fetch({ limit: 200 });
    const humans = members.filter((m) => !m.user.bot).map((m) => m.user.username);
    if (humans.length < 2) return ["Trader1", "Trader2"];
    const shuffled = [...humans].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  } catch {
    return ["Trader1", "Trader2"];
  }
}

async function getRandomMiddlemanId(client: Client, guildId: string): Promise<string | null> {
  try {
    const guild = await client.guilds.fetch(guildId);
    const role = await guild.roles.fetch(MIDDLEMAN_ROLE_ID);
    if (!role) return null;
    const members = await guild.members.fetch({ limit: 200 });
    const mms = members.filter((m) => m.roles.cache.has(MIDDLEMAN_ROLE_ID) && !m.user.bot);
    if (mms.size === 0) return null;
    const arr = [...mms.values()];
    return pickRandom(arr).id;
  } catch {
    return null;
  }
}

// ─── AutoMM embed ─────────────────────────────────────────────────────────────
function buildAutoMMTradeEmbed(): EmbedBuilder {
  const cur = pickRandom(AUTOMM_CURRENCIES);
  const usd = rand(cur.min * cur.rate, cur.max * cur.rate);
  const crypto = usd / cur.rate;
  const amountStr = formatAmount(crypto, cur.label);
  const usdStr = usd.toFixed(2);
  const customEmoji = pickRandom(CUSTOM_EMOJIS);
  const includeTx = Math.random() > 0.35;
  const txId = includeTx ? generateTxId(cur.label) : null;

  let desc =
    `## ${customEmoji} ${AUTOMM_CRYPTO_EMOJIS}  ・Trade Completed\n` +
    `### **\`${amountStr}\` ${cur.emoji} ${cur.label}** ($${usdStr} USD)\n` +
    `### Sender\n\`Anonymous\`\n` +
    `### Receiver\n\`Anonymous\``;

  if (txId) {
    desc += `\n### Transaction ID\n\`${txId}\``;
  }

  return new EmbedBuilder()
    .setColor(0x2563eb)
    .setDescription(desc);
}

// ─── MM vouch embed ───────────────────────────────────────────────────────────
function buildMMVouchEmbed(
  senderName: string,
  receiverName: string,
  middlemanId: string | null
): EmbedBuilder {
  const cur = pickRandom(MM_CURRENCIES);
  const usd = rand(cur.min * cur.rate, cur.max * cur.rate);
  const crypto = usd / cur.rate;
  const amountStr = formatAmount(crypto, cur.label);
  const usdStr = usd.toFixed(2);

  const [emoji1, emoji2] = pick2Random(CUSTOM_EMOJIS);
  const item1 = pickRandom(VOUCH_ITEMS);
  const item2 = pickRandom(VOUCH_ITEMS.filter((i) => i !== item1));
  const mmPing = middlemanId ? `<@${middlemanId}>` : "the Middleman";

  const desc =
    `## ${emoji1} ${ARROW_EMOJI} ${emoji2}  Trade Completed\n` +
    `### **\`${amountStr}\` ${cur.emoji} ${cur.label}** ($${usdStr} USD)\n` +
    `### Sender\n\`${senderName}\`\n` +
    `### Receiver\n\`${receiverName}\`\n` +
    `__Vouch Proof__\n` +
    `Vouch ${mmPing} ${item1} for ${item2}.`;

  return new EmbedBuilder()
    .setColor(0x16a34a)
    .setDescription(desc);
}

// ─── Loop state ───────────────────────────────────────────────────────────────
const activeLoops = new Map<string, ReturnType<typeof setTimeout>>();

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

      if (isVouch) {
        const [sender, receiver] = await getRandomMemberNames(client, guildId);
        const mmId = await getRandomMiddlemanId(client, guildId);
        const embed = buildMMVouchEmbed(sender, receiver, mmId);
        await channel.send({ embeds: [embed] });
      } else {
        const embed = buildAutoMMTradeEmbed();
        await channel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error("[TradeLoop] Post error:", err);
    }

    scheduleNext(client, guildId, channelId);
  }, delay);

  activeLoops.set(guildId, timer);
}

export function startTradeLoop(client: Client, guildId: string, channelId: string) {
  if (activeLoops.has(guildId)) clearTimeout(activeLoops.get(guildId)!);
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
