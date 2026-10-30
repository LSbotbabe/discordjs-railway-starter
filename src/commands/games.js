// 💋 LS BOT BABE — GAME NIGHT PERSONALITY

const GAME_CHANNEL_ID = "1565829843550085270";

// 🎀 PERSONALITY RESPONSES
const responses = {

  // 💋 GREETINGS
  greetings: [
    "Heyyyy boo! 💕 What's good?!",
    "Look who decided to bless us with their presence! 👀",
    "Hiiii bestie! Come sit, we got tea! ☕",
    "Heyyyy gorgeous! 💋 Ready for some chaos?",
    "Well, well, well! Look who showed up! 😂🔥",
    "Hey baby! 💖 Welcome to the madness!",
    "OOP! My favorite troublemaker is here! 😭💕",
    "Hiiii love! 💕 What are we getting into today?"
  ],

  // ☕ MESSY & SASSY
  messy: [
    "OOP! 👀 Now why would you expose yourself like that?!",
    "Not you telling everybody's business! 😭",
    "The tea is HOT and I'm seated! ☕🔥",
    "I'm not saying you're messy, but the evidence is giving messy! 💀",
    "BABYYYY! 👀 You can't just say that and disappear!",
    "Hold on! Let me grab my popcorn! 🍿😂",
    "Somebody spill the rest because I'm INVESTED! ☕",
    "Now why does this sound like a whole reality show?! 😭",
    "I wasn't being nosy, but now I need details! 💋"
  ],

  // 😂 FUNNY REACTIONS
  funny: [
    "Somebody come get their friend! 😭",
    "I just KNOW you didn't type that with a straight face! 💀",
    "The way y'all act in here needs to be studied! 😂",
    "SCREAMINGGGG! 😭😂",
    "NOT ME CRYINGGG! 💀🤣",
    "I cannot deal with this family! 😭💕",
    "WHO RAISED Y'ALL?! 😂",
    "I'm logging off emotionally! 😭💀",
    "This server needs adult supervision! 😂🔥"
  ],

  // 💕 SWEET RESPONSES
  sweet: [
    "Awww! 🥹💕 I love my LS family!",
    "You're such a sweetheart! 💖",
    "Sending you virtual hugs, boo! 🫶",
    "You deserve all the love in the world! 💕",
    "Don't let anybody dim your sparkle, baby! ✨",
    "You're appreciated more than you know! 💖",
    "That's my LS family right there! 🥹",
    "Nothing but love and good vibes for you! 💋"
  ],

  // 😈 PLAYFUL ROASTS
  savage: [
    "Not you being confidently incorrect! 😭",
    "Bestie, that answer needs a refund! 💀",
    "I'm gonna give you a second chance to rethink that! 😂",
    "BABYYYY! The math ain't mathing! 😭",
    "Who gave you permission to be this loud AND wrong?! 💀",
    "I'm not judging... okay maybe a little! 👀😂",
    "You really woke up and chose chaos today! 😭🔥",
    "Somebody take the keyboard away! 😂",
    "I'm gonna pretend I didn't read that! 💋"
  ],

  // 🔥 GAME HOST REACTIONS
  gameHost: [
    "OOOH! We got a winner! 🏆",
    "Y'all better step it up! 👀",
    "The competition is getting PERSONAL! 😭🔥",
    "Somebody check the scoreboard because BABYYYY! 💋",
    "Don't get quiet now! Where's that confidence?! 😂",
    "The LS family came to PLAY today! 🔥",
    "Who wants to be our next champion?! 👑",
    "Okayyyy! I see we got some competition! 💎",
    "This game is getting SPICY! 😈🔥"
  ],

  // 💋 GENERAL CONVERSATION
  general: [
    "GIRLLLL! 😭💀 You really just said that?!",
    "OOP! 👀☕ Somebody spill the rest!",
    "BABYYYY! 😂🔥 I'm listening!",
    "Not you being messy in my game room! 💋😂",
    "The way I just GASPED! 😭",
    "Tell me more, bestie! 👀💕",
    "Now THAT'S interesting! 💋",
    "Wait a minute! We need to discuss this! 😂",
    "I'm listening, boo! ☕💕"
  ]
};

// 🎲 PICK RANDOM RESPONSE
function randomResponse(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 💖 RESPOND TO MEMBERS
async function handleMessage(message) {
  if (message.author.bot) return;
  if (message.channel.id !== GAME_CHANNEL_ID) return;

  const text = message.content.toLowerCase().trim();

  if (!text) return;

  let category = null;

  // Greetings
  if (/\b(hi|hello|hey|heyyy|heyyyy)\b/.test(text)) {
    category = "greetings";
  }

  // Laughter
  else if (/\b(lol|lmao|lmfao|haha|hahaha)\b/.test(text)) {
    category = "funny";
  }

  // Sweet messages
  else if (
    /\b(love|sweet|beautiful|thank you|thanks|hug)\b/.test(text)
  ) {
    category = "sweet";
  }

  // Tea and gossip
  else if (
    /\b(tea|gossip|drama|messy|spill)\b/.test(text)
  ) {
    category = "messy";
  }

  // Playful teasing
  else if (
    /\b(roast|savage|wrong|clown)\b/.test(text)
  ) {
    category = "savage";
  }

  // Game-related messages
  else if (
    /\b(game|play|winner|score|challenge)\b/.test(text)
  ) {
    category = "gameHost";
  }

  // Talking directly to LS Bot Babe
  else if (
    text.includes("bot babe") ||
    text.includes("ls babe")
  ) {
    category = "general";
  }

  if (category) {
    await message.reply(randomResponse(responses[category]));
  }
}

module.exports = {
  handleMessage,
  responses,
  randomResponse
};
