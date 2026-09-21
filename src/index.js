const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error(
    "DISCORD_TOKEN is not set. Add it as a service variable in Railway: " +
      "Discord Developer Portal -> your application -> Bot -> Reset Token."
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
client.commands = new Collection();

// Load every command file next to this one, so the working directory does not matter.
const commandsDir = path.join(__dirname, "commands");
const payload = [];
for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"))) {
  const command = require(path.join(commandsDir, file));
  if (!command?.data || typeof command.execute !== "function") {
    console.warn(`Skipping ${file}: it must export { data, execute }.`);
    continue;
  }
  client.commands.set(command.data.name, command);
  payload.push(command.data.toJSON());
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  try {
    const rest = new REST({ version: "10" }).setToken(token);
    await rest.put(Routes.applicationCommands(c.user.id), { body: payload });
    console.log(`Registered ${payload.length} slash command(s): ${payload.map((p) => "/" + p.name).join(", ")}`);
    console.log("Global commands can take a few minutes to appear in Discord.");
  } catch (error) {
    console.error("Failed to register slash commands:", error.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`Command /${interaction.commandName} failed:`, error);

      const reply = {
        content: "Something went wrong while running that command.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
    return;
  }

  // Wave button
if (
  interaction.isButton() &&
  interaction.customId.startsWith("lit_wave_")
) {
  const newMemberId = interaction.customId.replace("lit_wave_", "");
const coastalCutieSticker =
  interaction.guild.stickers.cache.find(
    sticker => sticker.name === "Coastal Cutie"
  );
  await interaction.reply({
  content: `👋 <@${interaction.user.id}> waved at <@${newMemberId}>!`,
  stickers: coastalCutieSticker ? [coastalCutieSticker.id] : []
});

  return;
}
  
  
  // Verify button
  if (
    interaction.isButton() &&
    interaction.customId === "lit_verify_open"
  ) {
    await interaction.showModal({
      custom_id: "lit_verify_submit",
      title: "Lit Sessions Verification",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "game_name",
              label: "Sunday City Game Name",
              style: 1,
              required: true,
              max_length: 50,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "game_tag",
              label: "Sunday City Game Tag",
              style: 1,
              required: true,
              max_length: 50,
            },
          ],
        },
      ],
    });
    return;
  }
// Verification form submission
if (
  interaction.isModalSubmit() &&
  interaction.customId === "lit_verify_submit"
) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const gameName = interaction.fields
      .getTextInputValue("game_name")
      .trim();

    const gameTag = interaction.fields
      .getTextInputValue("game_tag")
      .trim();

    const nickname = `${gameName} | ${gameTag}`;

    if (nickname.length > 32) {
      await interaction.editReply(
        "❌ Your Game Name + Game Tag is too long. Please shorten it."
      );
      return;
    }

    await interaction.member.setNickname(nickname);

    const memberRole = interaction.guild.roles.cache.find(
      role => role.name === "LS Member"
    );

    if (!memberRole) {
      await interaction.editReply(
        '❌ I could not find the "LS Member" role.'
      );
      return;
    }

    await interaction.member.roles.add(memberRole);
const chatChannel = interaction.guild.channels.cache.get(
  process.env.CHAT_CHANNEL_ID
);

if (chatChannel) {
  await chatChannel.send({
    content: `➡️ <@${interaction.user.id}> just slid into the server. 🔥`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: `lit_wave_${interaction.user.id}`,
            label: "Wave",
            emoji: { name: "👋" },
            style: 1,
          },
        ],
      },
    ],
  });
}
    await interaction.editReply(
      `✅ Verified! Your server name is now **${nickname}** and you now have access to the member channels.`
    );
  } catch (error) {
    console.error("Verification error:", error);

    await interaction.editReply(
      "❌ I couldn't complete verification. Please contact an LS admin."
    );
  }

  return;
}});

client.login(token).catch((error) => {
  if (error?.code === "TokenInvalid" || /token/i.test(error?.message ?? "")) {
    console.error(
      "Discord rejected the token. Copy it again from the Developer Portal and update DISCORD_TOKEN."
    );
  } else {
    console.error("Login failed:", error);
  }
  process.exit(1);
});
