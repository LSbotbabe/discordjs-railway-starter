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
client.partyRSVPs = new Map();
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
  if (interaction.user.id === newMemberId) {
  await interaction.reply({
    content: "😂 You can't wave at yourself! This button is for everyone else to welcome you.",
    ephemeral: true
  });
  return;
}
const serverStickers = await interaction.guild.stickers.fetch();

const waveStickerNames = [
  "Coastal Cutie",
  "Dripster",
  "Dandy",
  "Sunny Dee",
  "Influencer",
  "Girl Next Door",
  "Go Girl",
  "Buddy",
  "Dripster1",
  "Agent 51",
  "Jawsie",
  "Frank Furter",
  "Moo Bert T-Bone"
];

const availableWaveStickers = serverStickers.filter(
  sticker => waveStickerNames.includes(sticker.name)
);

const randomSticker = availableWaveStickers.random();
await interaction.deferUpdate();

if (randomSticker) {
  await interaction.channel.send({
    content: `👋 <@${interaction.user.id}> waved at <@${newMemberId}>!`,
    stickers: [randomSticker.id]
  });
}

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

// Party RSVP buttons
if (
  interaction.isButton() &&
  ["party_going", "party_decline", "party_maybe"].includes(interaction.customId)
) {
  const message = interaction.message;
  const oldEmbed = message.embeds[0];

  if (!oldEmbed) {
    await interaction.reply({
      content: "❌ I couldn't find this party RSVP.",
      ephemeral: true,
    });
    return;
  }

  // Read party capacity from the PARTY SPOTS field
  const spotsField = oldEmbed.fields.find(
    field => field.name === "👥 PARTY SPOTS"
  );

  const maxSpots = spotsField
    ? parseInt(spotsField.value.split("/")[1])
    : 100;

  // Store RSVP lists using Discord user IDs
  if (!client.partyRSVPs) {
    client.partyRSVPs = new Map();
  }

  let party = client.partyRSVPs.get(message.id);

  if (!party) {
    party = {
      going: [],
      maybe: [],
      declined: [],
      waitlist: [],
      maxSpots: maxSpots,
    };

    client.partyRSVPs.set(message.id, party);
  }

  const userId = interaction.user.id;

  // Remove person from every list first
  party.going = party.going.filter(id => id !== userId);
  party.maybe = party.maybe.filter(id => id !== userId);
  party.declined = party.declined.filter(id => id !== userId);
  party.waitlist = party.waitlist.filter(id => id !== userId);

  let responseMessage = "";

  if (interaction.customId === "party_going") {
    if (party.going.length < party.maxSpots) {
      party.going.push(userId);
      responseMessage = "✅ You're going! See you at the party! 🔥";
    } else {
      party.waitlist.push(userId);
      responseMessage =
        "⏳ The party is full, babe! You've been added to the waitlist.";
    }
  }

  if (interaction.customId === "party_maybe") {
    party.maybe.push(userId);
    responseMessage = "❓ You've been added as Maybe!";
  }

  if (interaction.customId === "party_decline") {
    party.declined.push(userId);
    responseMessage = "❌ RSVP updated — you can't make this one.";
  }

  // If a Going spot opened, move first waitlisted person up
  while (
    party.going.length < party.maxSpots &&
    party.waitlist.length > 0
  ) {
    const promotedUser = party.waitlist.shift();
    party.going.push(promotedUser);
  }

const names = ids =>
  ids.length
    ? ids.map(id => {
        const member = interaction.guild.members.cache.get(id);
        return member ? member.displayName : `User ${id}`;
      }).join("\n")
    : "Nobody yet";

  const updatedFields = oldEmbed.fields.map(field => {
    if (field.name === "👥 PARTY SPOTS") {
      return {
        name: field.name,
        value: `${party.going.length}/${party.maxSpots}`,
        inline: field.inline,
      };
    }

    if (field.name === "✅ Going") {
      return {
        name: field.name,
        value: names(party.going),
        inline: field.inline,
      };
    }

    if (field.name === "❓ Maybe") {
      return {
        name: field.name,
        value: names(party.maybe),
        inline: field.inline,
      };
    }

    if (field.name === "⏳ Waitlist") {
      return {
        name: field.name,
        value: names(party.waitlist),
        inline: field.inline,
      };
    }
if (field.name === "⏳ Waitlist") {
  return {
    name: field.name,
    value: names(party.waitlist),
    inline: field.inline,
  };
}

if (field.name === "❌ Can't Go") {
  return {
    name: field.name,
    value: names(party.declined),
    inline: field.inline,
  };
}

return {
  name: field.name,
  value: field.value,
  inline: field.inline,
};
    
  });

  const updatedEmbed = {
    title: oldEmbed.title,
    description: oldEmbed.description,
    color: oldEmbed.color,
    fields: updatedFields,
    footer: oldEmbed.footer,
    timestamp: oldEmbed.timestamp,
    image: oldEmbed.image,
  };

  await interaction.update({
    embeds: [updatedEmbed],
    components: message.components,
  });

  await interaction.followUp({
    content: responseMessage,
    ephemeral: true,
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
    content: `➡️ Glad you're here, <@${interaction.user.id}>! 🔥`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: `lit_wave_${interaction.user.id}`,
            label: "Wave to say hi!",
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
