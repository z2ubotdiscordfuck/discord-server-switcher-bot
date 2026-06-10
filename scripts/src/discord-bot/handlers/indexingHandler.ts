import {
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  MessageFlags,
} from "discord.js";
import { Ticket, ServerConfig } from "../db/models.js";
import { PRESETS } from "../config/presets.js";
import { INDEXING_BASES } from "../embeds/indexingService.js";

const LOG_CHANNEL_ID = "1480663812721086689";

export async function sendTicketLog(
  client: import("discord.js").Client,
  embed: EmbedBuilder
) {
  try {
    const ch = await client.channels.fetch(LOG_CHANNEL_ID);
    if (ch && ch.isTextBased() && !ch.isDMBased()) {
      await (ch as TextChannel).send({ embeds: [embed] });
    }
  } catch {
  }
}

export async function handleIndexingSelect(interaction: StringSelectMenuInteraction) {
  const baseValue = interaction.values[0];
  const base = INDEXING_BASES.find((b) => b.value === baseValue);
  if (!base) { await interaction.reply({ content: "Invalid base selected.", flags: MessageFlags.Ephemeral }); return; }

  const modal = new ModalBuilder()
    .setCustomId(`indexing_modal_${baseValue}`)
    .setTitle(`${base.label} — Indexing Ticket`);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("payment_amount")
        .setLabel("Payment amount")
        .setPlaceholder("e.g. $20 or 5 Garamas")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("index_left")
        .setLabel("How much index is left for you?")
        .setPlaceholder("e.g. 80%, half, 200 slots")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("roblox_user")
        .setLabel("Your Roblox username")
        .setPlaceholder("e.g. Builderman")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("can_join")
        .setLabel("Can you join through links? (Yes / No)")
        .setPlaceholder("Yes or No")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    )
  );

  await interaction.showModal(modal);
}

export async function handleIndexingModalSubmit(
  interaction: ModalSubmitInteraction,
  baseValue: string
) {
  const guild = interaction.guild;
  if (!guild) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const base = INDEXING_BASES.find((b) => b.value === baseValue);
  const baseName = base?.label ?? baseValue;

  const paymentAmount = interaction.fields.getTextInputValue("payment_amount");
  const indexLeft    = interaction.fields.getTextInputValue("index_left");
  const robloxUser   = interaction.fields.getTextInputValue("roblox_user");
  const canJoin      = interaction.fields.getTextInputValue("can_join");

  const config = await ServerConfig.findOne({ guildId: guild.id });
  const preset = config ? PRESETS[config.preset] ?? PRESETS["playerauctions"] : PRESETS["playerauctions"];
  const bannerUrl = config?.bannerUrl ?? "";

  const ticketChannel = await guild.channels.create({
    name: `index-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id,  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  await Ticket.create({
    guildId: guild.id,
    channelId: ticketChannel.id,
    userId: interaction.user.id,
    ticketType: "indexing",
    formData: { baseName, paymentAmount, indexLeft, robloxUser, canJoin },
  });

  const ticketEmbed = new EmbedBuilder()
    .setColor(preset.color)
    .setDescription(
      `### <a:echorules:1513916477944893643> - Indexing Ticket — ${baseName}\n\n` +
      `**User:** <@${interaction.user.id}>\n\n` +
      `**Payment Amount**\n\`${paymentAmount}\`\n\n` +
      `**Index Left**\n\`${indexLeft}\`\n\n` +
      `**Roblox Username**\n\`${robloxUser}\`\n\n` +
      `**Can Join Through Links**\n\`${canJoin}\`\n\n` +
      `> A staff member will claim this ticket and assist you shortly.`
    );
  if (bannerUrl) ticketEmbed.setImage(bannerUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim Ticket").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );

  await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [row] });

  await interaction.editReply({ content: `Your indexing ticket has been created: <#${ticketChannel.id}>` });

  await sendTicketLog(interaction.client, new EmbedBuilder()
    .setColor(0x2563eb)
    .setTitle("📋 Indexing Ticket Created")
    .setDescription(
      `**User:** <@${interaction.user.id}> (\`${interaction.user.username}\`)\n` +
      `**Base:** ${baseName}\n` +
      `**Payment:** ${paymentAmount}\n` +
      `**Channel:** <#${ticketChannel.id}>`
    )
    .setTimestamp()
  );
}
