// 💋 LS BOT BABE — GAME MANAGER

const GAMES = [
  { id: "spillthetea", name: "☕ Spill the Tea" },
  { id: "familyfeud", name: "🔥 LS Family Feud" },
  { id: "truthordare", name: "😈 Truth or Dare" },
  { id: "roastbattle", name: "💀 Roast Battle" },
  { id: "imposter", name: "🕵️ Who's the Imposter?" },
  { id: "dealornodeal", name: "💰 Deal or No Deal" },
  { id: "guessthesong", name: "🎶 Guess That Song" },
  { id: "ratetherizz", name: "💋 Rate the Rizz" }
];

const MAX_AUTO_GAMES_PER_DAY = 3;
const AUTO_GAME_COOLDOWN = 2 * 60 * 60 * 1000;

let activeGame = null;
let automaticGamesToday = 0;
let lastAutomaticGame = 0;
let currentDay = new Date().toDateString();

function resetDailyGames() {
  const today = new Date().toDateString();

  if (today !== currentDay) {
    currentDay = today;
    automaticGamesToday = 0;
  }
}

function getRandomGame() {
  return GAMES[Math.floor(Math.random() * GAMES.length)];
}

function canStartAutomaticGame() {
  resetDailyGames();

  if (activeGame) return false;

  if (automaticGamesToday >= MAX_AUTO_GAMES_PER_DAY) {
    return false;
  }

  if (Date.now() - lastAutomaticGame < AUTO_GAME_COOLDOWN) {
    return false;
  }

  return true;
}

function startGame(gameId, startedBy = "host") {
  if (activeGame) return null;

  const game = GAMES.find(g => g.id === gameId);
  if (!game) return null;

  activeGame = {
    ...game,
    startedBy,
    startedAt: Date.now(),
    players: [],
    scores: {}
  };

  if (startedBy === "auto") {
    automaticGamesToday++;
    lastAutomaticGame = Date.now();
  }

  return activeGame;
}

function stopGame() {
  const finishedGame = activeGame;
  activeGame = null;
  return finishedGame;
}

function getActiveGame() {
  return activeGame;
}

// 🎮 LS BOT BABE — GAME ANNOUNCEMENT
async function announceGame(channel, gameId, startedBy = "host") {
  const game = startGame(gameId, startedBy);

  if (!game) {
    return null;
  }

  const { createJoinButton } = require("./gameInteractions");

  try {
    await channel.send({
      content:
        `🎮🔥 **HEYYYY LS FAMILYYYY!!** 💋\n\n` +
        `Your favorite Bot Babe is bringing the FUN! 😈\n\n` +
        `👑 **NOW PLAYING: ${game.name}**\n\n` +
        `💖 Click **JOIN GAME** below to participate!\n\n` +
        `Let's get LITTT! 🔥💋`,
      components: [createJoinButton()]
    });

    return game;
  } catch (error) {
    stopGame();
    throw error;
  }
}


module.exports = {
  GAMES,
  getRandomGame,
  canStartAutomaticGame,
  startGame,
  stopGame,
  getActiveGame,
  announceGame
};
