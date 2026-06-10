import { Client, EmbedBuilder, TextChannel } from "discord.js";

const MIDDLEMAN_ROLE_ID = "1481044272756166801";
const ARROW_EMOJI = "<a:arrowslogo:1514191782211096628>";

// Each pair: the emoji and the matching item name used in vouch text
const VOUCH_PAIRS = [
  { name: "Dragon Fruit",       emoji: "<:DragonFruit:1514189379332214944>"      },
  { name: "Canneloni",          emoji: "<:Dragoncanneloni:1514189381794005002>"   },
  { name: "Raccoon",            emoji: "<:raccoon:1514189376337346620>"           },
  { name: "Meowl",              emoji: "<:Meowl:1514189387108319333>"             },
  { name: "Strawberry Elephant",emoji: "<:strawberryelephant:1514189384482553867>"},
  { name: "Fragrama",           emoji: "<:Fragrama:1514189389901594625>"          },
  { name: "Kitsune",            emoji: "<:KitsuneFruit:1514189393030811658>"      },
  { name: "Robux",              emoji: "<:robux:1514189397560656003>"             },
  { name: "Commando",           emoji: "<:commando:1514189371203653692>"          },
  { name: "Frozen Tomatrio",    emoji: "<:frozen_tomatrio:1514189374064033802>"   },
];

// AutoMM crypto emojis shown in header
const AUTOMM_CRYPTO_EMOJIS =
  "<:echoltc:1513916480427786311> " +
  "<:echobtc:1513916482294120640> " +
  "<:echoeth:1513916818962649108> " +
  "<:echousdc:1513916486627102976> " +
  "<:echousdcet:1513916488963068175> " +
  "<:echousdt:1513916491328655410> " +
  "<:echpaypal:1513916484802445332>";

// Realistic small amounts: min/max in USD, not crypto units
const AUTOMM_CURRENCIES = [
  { label: "BTC",  emoji: "<:echobtc:1513916482294120640>",   usdMin: 2,  usdMax: 400,  rate: 67400, decimals: 8 },
  { label: "ETH",  emoji: "<:echoeth:1513916818962649108>",   usdMin: 2,  usdMax: 400,  rate: 3520,  decimals: 6 },
  { label: "LTC",  emoji: "<:echoltc:1513916480427786311>",   usdMin: 2,  usdMax: 300,  rate: 88,    decimals: 4 },
  { label: "SOL",  emoji: "<:echosol:1513916493803552798>",   usdMin: 2,  usdMax: 350,  rate: 168,   decimals: 4 },
  { label: "USDT", emoji: "<:echousdt:1513916491328655410>",  usdMin: 2,  usdMax: 500,  rate: 1,     decimals: 2 },
  { label: "USDC", emoji: "<:echousdc:1513916486627102976>",  usdMin: 2,  usdMax: 500,  rate: 1,     decimals: 2 },
];

const MM_CURRENCIES = [
  { label: "PayPal", emoji: "<:echpaypal:1513916484802445332>", usdMin: 2, usdMax: 250, rate: 1,    decimals: 2 },
  { label: "BTC",    emoji: "<:echobtc:1513916482294120640>",   usdMin: 2, usdMax: 300, rate: 67400,decimals: 8 },
  { label: "ETH",    emoji: "<:echoeth:1513916818962649108>",   usdMin: 2, usdMax: 300, rate: 3520, decimals: 6 },
  { label: "LTC",    emoji: "<:echoltc:1513916480427786311>",   usdMin: 2, usdMax: 200, rate: 88,   decimals: 4 },
  { label: "Robux",  emoji: "<:robux:1514189397560656003>",     usdMin: 2, usdMax: 100, rate: 0.004,decimals: 0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pick2Unique<T>(arr: T[]): [T, T] {
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

function formatCrypto(usd: number, rate: number, decimals: number): string {
  const amount = usd / rate;
  if (decimals === 0) return Math.floor(amount).toLocaleString();
  return amount.toFixed(decimals).replace(/\.?0+$/, "");
}

// ─── Member helpers ───────────────────────────────────────────────────────────
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
    const members = await guild.members.fetch({ limit: 200 });
    const mms = members.filter((m) => m.roles.cache.has(MIDDLEMAN_ROLE_ID) && !m.user.bot);
    if (mms.size === 0) return null;
    return pickRandom([...mms.values()]).id;
  } catch {
    return null;
  }
}

// ─── AutoMM trade embed ───────────────────────────────────────────────────────
function buildAutoMMTradeEmbed(): EmbedBuilder {
  const cur = pickRandom(AUTOMM_CURRENCIES);
  const usd = rand(cur.usdMin, cur.usdMax);
  const cryptoStr = formatCrypto(usd, cur.rate, cur.decimals);
  const usdStr = usd.toFixed(2);
  const customEmoji = pickRandom(VOUCH_PAIRS).emoji;
  const includeTx = Math.random() > 0.4;
  const txId = includeTx ? generateTxId(cur.label) : null;

  let desc =
    `## ${customEmoji} ${AUTOMM_CRYPTO_EMOJIS}  ・Trade Completed\n` +
    `### **\`${cryptoStr}\` ${cur.emoji} ${cur.label}** ($${usdStr} USD)\n` +
    `### Sender\n\`Anonymous\`\n` +
    `### Receiver\n\`Anonymous\``;

  if (txId) {
    desc += `\n### Transaction ID\n\`${txId}\``;
  }

  return new EmbedBuilder().setColor(0x2563eb).setDescription(desc);
}

// ─── MM vouch embed (emoji matches vouch text) ────────────────────────────────
function buildMMVouchEmbed(
  senderName: string,
  receiverName: string,
  middlemanId: string | null
): EmbedBuilder {
  const cur = pickRandom(MM_CURRENCIES);
  const usd = rand(cur.usdMin, cur.usdMax);
  const cryptoStr = formatCrypto(usd, cur.rate, cur.decimals);
  const usdStr = usd.toFixed(2);

  // Pick 2 matched pairs — emoji and name are consistent
  const [pair1, pair2] = pick2Unique(VOUCH_PAIRS);
  const mmPing = middlemanId ? `<@${middlemanId}>` : "the Middleman";

  const desc =
    `## ${pair1.emoji} ${ARROW_EMOJI} ${pair2.emoji}  Trade Completed\n` +
    `### **\`${cryptoStr}\` ${cur.emoji} ${cur.label}** ($${usdStr} USD)\n` +
    `### Sender\n\`${senderName}\`\n` +
    `### Receiver\n\`${receiverName}\`\n` +
    `__Vouch Proof__\n` +
    `Vouch ${mmPing} ${pair1.name} for ${pair2.name}.`;

  return new EmbedBuilder().setColor(0x16a34a).setDescription(desc);
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
        await channel.send({ embeds: [buildMMVouchEmbed(sender, receiver, mmId)] });
      } else {
        await channel.send({ embeds: [buildAutoMMTradeEmbed()] });
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
