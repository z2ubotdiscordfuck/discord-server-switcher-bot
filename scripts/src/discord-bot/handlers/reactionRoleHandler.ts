import type { ButtonInteraction, GuildMember } from "discord.js";

export async function handleReactionRole(interaction: ButtonInteraction) {
  const customId = interaction.customId; // rr_giveaways_ROLEID, rr_updates_ROLEID, rr_blacklist_ROLEID
  const parts = customId.split("_");
  const roleId = parts[parts.length - 1];

  const member = interaction.member as GuildMember;
  if (!member) {
    await interaction.reply({ content: "Could not find your member data.", ephemeral: true });
    return;
  }

  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      await interaction.reply({ content: `Role removed successfully.`, ephemeral: true });
    } else {
      await member.roles.add(roleId);
      await interaction.reply({ content: `Role added successfully.`, ephemeral: true });
    }
  } catch {
    await interaction.reply({ content: "Failed to manage role. Make sure the bot has the Manage Roles permission.", ephemeral: true });
  }
}
