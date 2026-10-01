const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("partycountdown")
    .setDescription("Start an LS party countdown!")
    .addIntegerOption(option =>
      option
        .setName("minutes")
        .setDescription("How many minutes until the party?")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1440)
    ),

  async execute(interaction) {
    const minutes = interaction.options.getInteger("minutes");
    const partyTime = Math.floor(Date.now() / 1000) + minutes * 60;

    await interaction.reply(
      `🔥 **LS PARTY COUNTDOWN** 🔥\n\n` +
      `🥳 Lit Sessions, get ready!\n` +
      `⏰ **PARTY STARTS:** <t:${partyTime}:F>\n` +
      `🎉 **COUNTDOWN:** <t:${partyTime}:R>\n\n` +
      `🍾🔥 **LS Bot Babe says GET READY TO TURN UP!** 🔥🍾`
    );
  },
};
