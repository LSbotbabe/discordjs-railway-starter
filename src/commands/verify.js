const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Open Lit Sessions verification"),

  execute: async (interaction) => {
    const button = new ButtonBuilder()
      .setCustomId("lit_verify_open")
      .setLabel("Verify for Lit Sessions")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content:
        "🔥 **Welcome to Lit Sessions!**\nTap the button below to enter your Sunday City Game Name and Game Tag.",
      components: [row],
    });
  },
};
