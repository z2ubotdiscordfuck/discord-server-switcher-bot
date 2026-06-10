import { type ButtonInteraction, type GuildMember, MessageFlags } from "discord.js";

export async function handleReactionRole(interaction: ButtonInteraction) {
  const customId = interaction.customId;
  const parts = customId.split("_");
  const roleId = parts[parts.length - 1];

  const member = interaction.member as GuildMember;
  if (!member) {
    await interaction.reply({ content: "Could not find your member data.", flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      await interaction.reply({ content: `Role removed successfully.`, flags: MessageFlags.Ephemeral });
    } else {
      await member.roles.add(roleId);
      await interaction.reply({ content: `Role added successfully.`, flags: MessageFlags.Ephemeral });
    }
  } catch {
    await interaction.reply({ content: "Failed to manage role. Make sure the bot has the Manage Roles permission.", flags: MessageFlags.Ephemeral });
  }
}
