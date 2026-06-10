import {
  Message,
  TextChannel,
  AttachmentBuilder,
} from "discord.js";
import { PRESETS, CHANNEL_IDS, CHANNEL_NAMES } from "../config/presets.js";
import { PanelMessage, ServerConfig } from "../db/models.js";
import { buildRulesEmbed } from "../embeds/rules.js";
import { buildReactionRolesEmbed } from "../embeds/reactionRoles.js";
import { buildScamAwarenessEmbed } from "../embeds/scamAwareness.js";
import { buildAboutEmbed } from "../embeds/about.js";
import { buildTrustpilotEmbed } from "../embeds/trustpilot.js";
import { buildFaqEmbed } from "../embeds/faq.js";
import { buildSupportEmbed } from "../embeds/support.js";
import { buildTosEmbed, buildTradingRulesEmbed } from "../embeds/tos.js";
import { buildMiddlemanTosEmbed } from "../embeds/middlemanTos.js";
import { buildEscrowEmbed } from "../embeds/escrow.js";
import { buildVerificationEmbed } from "../embeds/verification.js";
import { buildIndexingServiceEmbed } from "../embeds/indexingService.js";
import { buildValuesEmbed } from "../embeds/values.js";

const ADMIN_USERNAME = "imechoplay";

type EmbedPayload = { embeds: any[]; components: any[] };

interface PanelSpec {
  panelType: string;
  build: (preset: any, bannerUrl: string, thumbnailUrl: string) => EmbedPayload;
}

const CHANNEL_ORDER: PanelSpec[] = [
  {
    panelType: "rules",
    build: (p, b, t) => buildRulesEmbed(p, b, t),
  },
  {
    panelType: "reaction-roles",
    build: (p, b, t) => buildReactionRolesEmbed(p, b, t),
  },
  {
    panelType: "scam-awareness",
    build: (p, b, _t) => buildScamAwarenessEmbed(p, b),
  },
  {
    panelType: "about",
    build: (p, b, _t) => buildAboutEmbed(p, b),
  },
  {
    panelType: "trustpilot",
    build: (p, b, _t) => buildTrustpilotEmbed(p, b),
  },
  {
    panelType: "faq",
    build: (p, b, _t) => buildFaqEmbed(p, b),
  },
  {
    panelType: "support",
    build: (p, b, _t) => buildSupportEmbed(p, b),
  },
  {
    panelType: "tos",
    build: (p, b, t) => buildTosEmbed(p, b, t),
  },
  {
    panelType: "middleman-tos",
    build: (p, b, _t) => buildMiddlemanTosEmbed(p, b),
  },
  {
    panelType: "automm",
    build: (p, b, _t) => buildEscrowEmbed(p, b),
  },
  {
    panelType: "marketplace-tos",
    build: (p, b, _t) => buildTradingRulesEmbed(p, b),
  },
  {
    panelType: "verification",
    build: (p, b, _t) => buildVerificationEmbed(p, b),
  },
  {
    panelType: "indexing-service",
    build: (p, b, _t) => buildIndexingServiceEmbed(p, b),
  },
  {
    panelType: "values",
    build: (p, b, _t) => buildValuesEmbed(p, b),
  },
];

export async function handleSwitchServer(message: Message, args: string[]) {
  if (message.author.username !== ADMIN_USERNAME) {
    await message.reply("You do not have permission to use this command.");
    return;
  }

  const presetKey = args[0]?.toLowerCase();
  if (!presetKey || !PRESETS[presetKey]) {
    const available = Object.keys(PRESETS).join(", ");
    await message.reply(
      `Please provide a valid marketplace preset.\n` +
      `Usage: \`.switchserveradminonlymadebyecho <preset> [bannerUrl] [thumbnailUrl]\`\n` +
      `Available presets: ${available}`
    );
    return;
  }

  const preset = PRESETS[presetKey];

  const trimUrl = (u: string) => u.replace(/[&?]+$/, "").trim();

  let bannerUrl = trimUrl(args[1] ?? "");
  let thumbnailUrl = trimUrl(args[2] ?? "");

  if (!bannerUrl && message.attachments.size > 0) {
    const attachments = [...message.attachments.values()];
    bannerUrl = trimUrl(attachments[0]?.url ?? "");
    thumbnailUrl = trimUrl(attachments[1]?.url ?? thumbnailUrl);
  }

  const statusMsg = await message.reply(`Switching server to **${preset.serverName}**... Please wait.`);

  await ServerConfig.findOneAndUpdate(
    { guildId: message.guild!.id },
    {
      preset: presetKey,
      bannerUrl,
      thumbnailUrl,
      logoUrl: thumbnailUrl,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  let successCount = 0;
  let failCount = 0;
  const results: string[] = [];

  for (let i = 0; i < CHANNEL_IDS.length; i++) {
    const channelId = CHANNEL_IDS[i];
    const spec = CHANNEL_ORDER[i];
    if (!spec) continue;

    const channelName = CHANNEL_NAMES[channelId] ?? channelId;

    try {
      const channel = message.guild!.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel) {
        results.push(`⚠ #${channelName} (${channelId}) — channel not found, skipped`);
        failCount++;
        continue;
      }

      const payload = spec.build(preset, bannerUrl, thumbnailUrl);

      const existing = await PanelMessage.findOne({
        guildId: message.guild!.id,
        channelId,
        panelType: spec.panelType,
      });

      if (existing) {
        try {
          const existingMsg = await channel.messages.fetch(existing.messageId);
          await existingMsg.edit(payload);
          results.push(`✅ #${channelName} — updated`);
          successCount++;
          continue;
        } catch {
          await PanelMessage.deleteOne({ _id: existing._id });
        }
      }

      const sent = await channel.send(payload);
      await PanelMessage.findOneAndUpdate(
        { guildId: message.guild!.id, channelId, panelType: spec.panelType },
        { messageId: sent.id, preset: presetKey, updatedAt: new Date() },
        { upsert: true }
      );
      results.push(`✅ #${channelName} — sent`);
      successCount++;
    } catch (err) {
      results.push(`❌ #${channelName} (${channelId}) — error: ${(err as Error).message}`);
      failCount++;
    }
  }

  const summary =
    `**Server switched to ${preset.serverName}** ✅\n\n` +
    `**Results:**\n${results.join("\n")}\n\n` +
    `**Done:** ${successCount} succeeded, ${failCount} failed.`;

  await statusMsg.edit(summary);
}
