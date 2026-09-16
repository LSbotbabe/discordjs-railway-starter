const { SlashCommandBuilder, ChannelType } = require("discord.js");
const {
  joinVoiceChannel,
  getVoiceConnection,
} = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("music")
    .setDescription("LSBotBabe music controls")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("join")
        .setDescription("Join your current voice channel")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leave")
        .setDescription("Leave the voice channel")
    ),

  async execute(interaction) {
    const action = interaction.options.getSubcommand();

    if (action === "join") {
      const voiceChannel = interaction.member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({
          content: "🎧 Join a voice channel first, then try again.",
          ephemeral: true,
        });
      }

      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      return interaction.reply(
        `🎶 LSBotBabe joined **${voiceChannel.name}**!`
      );
    }

    if (action === "leave") {
      const connection = getVoiceConnection(interaction.guild.id);

      if (!connection) {
        return interaction.reply({
          content: "I'm not in a voice channel right now.",
          ephemeral: true,
        });
      }

      connection.destroy();
      return interaction.reply("👋 LSBotBabe left the voice channel.");
    }
  },
};
