// 🎮 LS BOT BABE — START GAME COMMAND

const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const gameManager = require("./gameManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startgame")
    .setDescription("🎮 Start an LS Bot Babe game!")
    .addStringOption(option =>
      option
        .setName("game")
        .setDescription("Choose a game to play")
        .setRequired(true)
        .addChoices(
          ...gameManager.GAMES.map(game => ({
            name: game.name,
            value: game.id
          }))
        )
    ),

  async execute(interaction) {
    // 👑 Server owner or LS Hosts only
    const allowedRoleIds = [
      "1536050723542794351",
      "1536227795246645299"
    ];

    const isOwner =
      interaction.guild?.ownerId === interaction.user.id;

    const hasAllowedRole =
      interaction.member?.roles?.cache?.some(role =>
        allowedRoleIds.includes(role.id)
      ) ?? false;

    if (!isOwner && !hasAllowedRole) {
      return interaction.reply({
        content: "💋 Only LS Hosts and Server Owners can start games!",
        ephemeral: true
      });
    }

    // 🎮 Only one game at a time
    if (gameManager.getActiveGame()) {
      return interaction.reply({
        content: "🎮 Babyyy! There's already a game running!",
        ephemeral: true
      });
    }

    const gameId = interaction.options.getString("game");

    await interaction.deferReply({ ephemeral: true });

    try {
      const game = await gameManager.announceGame(
        interaction.channel,
        gameId,
        "host"
      );

      if (!game) {
        return interaction.editReply(
          "💋 Couldn't start that game right now!"
        );
      }

      await interaction.editReply(
        `💖 ${game.name} has officially started!`
      );
    } catch (error) {
      console.error("LS Game Start Error:", error);

      await interaction.editReply(
        "😭 Something went wrong starting the game!"
      );
    }
  }
};
