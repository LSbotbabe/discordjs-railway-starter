// 🎮 LS BOT BABE — GAME INTERACTIONS

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const gameManager = require("./gameManager");

// Create the JOIN GAME button
function createJoinButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ls_game_join")
      .setLabel("JOIN GAME 💖")
      .setStyle(ButtonStyle.Success)
  );
}

// Handle game button clicks
async function handleGameInteraction(interaction) {
  if (!interaction.isButton()) return false;
  if (interaction.customId !== "ls_game_join") return false;

  const game = gameManager.getActiveGame();

  if (!game) {
    await interaction.reply({
      content: "💋 Babyyy! There's no active game right now!",
      ephemeral: true
    });
    return true;
  }

  if (game.players.includes(interaction.user.id)) {
    await interaction.reply({
      content: "💕 You're already in this game, babe!",
      ephemeral: true
    });
    return true;
  }

  game.players.push(interaction.user.id);

  await interaction.reply({
    content: `🎮💖 You're IN, ${interaction.user}! Get ready for ${game.name}!`,
    ephemeral: false
  });

  return true;
}

module.exports = {
  createJoinButton,
  handleGameInteraction
};
