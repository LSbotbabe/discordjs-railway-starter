// 💋 LS BOT BABE — AI CONVERSATION SYSTEM

const OpenAI = require("openai");

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GAME_CHANNEL_ID = "1565829843550085270";

// 💰 Usage safeguards
const MAX_DAILY_REPLIES = 100;
const COOLDOWN_MS = 15000;
const MAX_HISTORY = 12;

let dailyReplies = 0;
let currentDay = new Date().toISOString().slice(0, 10);
let lastReply = 0;

// 💕 Separate conversation history for each member
const conversationHistory = new Map();
// 💕 Prevent overlapping AI replies from the same member
const userReplyCooldowns = new Map();
const USER_COOLDOWN_MS = 2000;

// 💕 Track active conversations by member
const activeConversations = new Map();

// Keep conversations active for 5 minutes
const CONVERSATION_TIMEOUT = 2 * 60 * 1000;

// 💖 LS BOT BABE'S PERSONALITY
const personality = `
You are LS Bot Babe, the official game host and
fun-loving member of the Lit Sessions Discord server.

PERSONALITY:
- Sweet, funny, sassy, sarcastic, playful, and confident.
- Sometimes messy and dramatic in a humorous way.
- Occasionally give lighthearted, friendly roasts.
- Be supportive when someone is genuinely upset.
- Talk naturally like a real participant in Discord.
- Use emojis naturally: 💋💕😂😭🔥☕👀💖
- Keep responses short, usually 1–3 sentences.
- Avoid repeating catchphrases.
- Never repeatedly offer confidence boosts, style tune-ups, hype moments, or the same choices. Respond naturally to the actual conversation without redirecting the topic. Do not end every response with a question.
- Never be cruel, discriminatory, or genuinely insulting.
- Don't pretend to know private information about members.

CONVERSATION:
- Understand what members are actually saying.
- Respond to their specific message.
- Ask follow-up questions when appropriate.
- Remember the recent conversation provided to you.
- Don't turn every conversation into a game.
- Don't claim someone won a game unless the game
  system has confirmed it.

You are entertaining, welcoming, and full of personality!
`;

function resetDailyCount() {
  const today = new Date().toISOString().slice(0, 10);

  if (today !== currentDay) {
    currentDay = today;
    dailyReplies = 0;
  }
}

async function handleMessage(message) {
  if (message.author.bot) return;
  if (message.channel.id !== GAME_CHANNEL_ID) return;

  const content = message.content.trim();
  if (!content) return;

  resetDailyCount();

  if (dailyReplies >= MAX_DAILY_REPLIES) return;

  const now = Date.now();
  // 💕 Allow active conversations without the 15-second cooldown
const isActiveChat =
  (activeConversations.get(message.author.id) || 0) > now;

if (!isActiveChat && now - lastReply < COOLDOWN_MS) return;

// 💕 Limit each member to one AI request every 2 seconds
const userId = message.author.id;
const lastUserReply = userReplyCooldowns.get(userId) || 0;

if (now - lastUserReply < USER_COOLDOWN_MS) return;


  
  const text = content.toLowerCase();

  // 💬 Respond when directly addressed
  const directlyAddressed =
    message.mentions.has(message.client.user) ||
    /\b(ls bot babe|bot babe|ls babe)\b/i.test(text) ||
    message.reference?.messageId &&
      (await isReplyToBot(message));

  // 👋 Recognize greetings
  const greeting =
    /^(hi|hello|hey|heyy|heyyy|good morning|good evening|good night)[!?. ]*$/i
      .test(content);

  // 👀 Occasionally join conversations
  const joinConversation = Math.random() < 0.20;

  // 💕 Check whether this member is continuing a conversation

const activeUntil = activeConversations.get(userId) || 0;

const continuingConversation = now < activeUntil;

  if (
  !directlyAddressed &&
  !greeting &&
  !joinConversation
) {
  return;
}

  // Reserve a reply slot before the API request
  lastReply = now;
  dailyReplies++;

  // 💕 Track when this member starts an AI request
userReplyCooldowns.set(userId, now);

  try {
    await message.channel.sendTyping();

    const history = (
  conversationHistory.get(message.channel.id) || []
).slice(-MAX_HISTORY);

    const result = await ai.chat.completions.create({
    model: "gpt-5-nano",
reasoning_effort: "minimal",
max_completion_tokens: 500,
      messages: [
        { role: "system", content: personality },
        ...history,
        {
          role: "user",
          content: `${message.author.username}: ${content}`,
        },
      ],
    });

console.log("LS AI response status:", {
  finishReason: result.choices[0]?.finish_reason,
  hasContent: !!result.choices[0]?.message?.content,
  outputTokens: result.usage?.completion_tokens
});
    
    const reply = result.choices[0]?.message?.content?.trim();

    if (!reply) return;

    // 💕 Save this member's conversation separately
const updatedHistory = [
  ...history,
  {
    role: "user",
    content: `${message.author.username}: ${content}`,
  },
  {
    role: "assistant",
    content: reply,
  },
];

// Keep only the most recent messages
conversationHistory.set(
  message.channel.id,
  updatedHistory.slice(-MAX_HISTORY)
);

    // 💕 Keep this member's conversation active for 5 minutes
activeConversations.set(
  message.author.id,
  Date.now() + CONVERSATION_TIMEOUT
);
    
    await message.reply({
      content: reply.slice(0, 1900),
      allowedMentions: { repliedUser: false, parse: [] },
    });

  } catch (error) {
    console.error("LS Bot Babe AI error:", error.message);
  }
}

async function isReplyToBot(message) {
  try {
    const original = await message.fetchReference();
    return original.author.id === message.client.user.id;
  } catch {
    return false;
  }
}

module.exports = {
  handleMessage,
};
