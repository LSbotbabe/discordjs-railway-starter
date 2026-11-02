// ☕ LS BOT BABE — SPILL THE TEA

const QUESTIONS = [
  "👀 Have you ever caught feelings for someone you swore was just a friend?",
  "🔥 What's the pettiest reason you've stopped talking to someone?",
  "😂 What's the most embarrassing thing you've done to impress a crush?",
  "😈 Have you ever gone back to an ex after saying you were DONE?",
  "🚩 What's one red flag you ignored because someone was attractive?",
  "💋 Have you ever flirted with someone just to make another person jealous?",
  "☕ What's the juiciest secret you've accidentally revealed?",
  "😭 Have you ever sent a screenshot to the person you were talking about?",
  "👀 Have you ever pretended not to see someone's message?",
  "🔥 What's the biggest lie you've told to get out of a date?",
  "😂 What's your most embarrassing dating experience?",
  "💖 Have you ever had a crush on someone in a Discord server?",
  "😈 Have you ever caught someone lying and played along?",
  "☕ What's something you did out of jealousy but never admitted?",
  "💀 Have you ever accidentally liked an old picture while stalking someone's profile?",
  "💋 What's the worst pickup line someone has used on you?",
  "👀 Have you ever had two crushes at the same time?",
  "🔥 What's the biggest relationship dealbreaker for you?",
  "😂 What's the funniest excuse someone gave you for ghosting?",
  "😈 Have you ever entertained someone you knew was trouble?",
  "👀 Have you ever secretly liked someone your friend was talking to?",
  "💋 Have you ever kissed someone and immediately regretted it?",
  "🔥 What's the messiest situation you've ever gotten yourself into?",
  "😂 Have you ever lied about being busy just to avoid someone?",
  "☕ Have you ever found out someone was talking about you behind your back?",
  "😈 Have you ever flirted with someone knowing they had a crush on you?",
  "💀 What's the most embarrassing text you've ever sent to the wrong person?",
  "🚩 Have you ever ignored your friends' warnings about someone?",
  "👀 Have you ever caught someone creeping on your social media?",
  "💖 What's something that instantly makes you lose interest in someone?"
];

// Pick 5 different random questions
function getRandomQuestions(count = 5) {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

module.exports = {
  QUESTIONS,
  getRandomQuestions
};
