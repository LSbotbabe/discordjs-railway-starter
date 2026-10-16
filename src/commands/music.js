
const { SlashCommandBuilder } = require("discord.js");
const { Shoukaku, Connectors } = require("shoukaku");

const queues = new Map();
const managers = new WeakMap();

function getManager(client) {
  if (managers.has(client)) return managers.get(client);

  const host = process.env.LAVALINK_HOST;
  const port = process.env.LAVALINK_PORT || "2333";
  const password = process.env.LAVALINK_PASSWORD;

  if (!host || !password) {
    throw new Error("Missing Lavalink settings in Railway");
  }

  const secure = false;

  console.log("LS Music: host configured:", host);
console.log("LS Music: port configured:", port);
console.log("LS Music: password present:", Boolean(password));
  const manager = new Shoukaku(
    new Connectors.DiscordJS(client),
    [{
      name: "LS-Lavalink",
      url: `${host}:${port}`,
      auth: password,
      secure
    }]
  );

  manager.on("ready", name => {
    console.log("Lavalink ready:", name);
  });

manager.on("debug", (name, info) => console.log("Lavalink debug:", name, info));
  
  manager.on("error", (name, error) => {
    console.error("Lavalink error:", name, error);
  });

  manager.on("close", (name, code, reason) => {
    console.log("Lavalink closed:", name, code, reason);
  });
  
  managers.set(client, manager);
  return manager;
}

async function getNode(manager) {
  const connected = () =>
  [...manager.nodes.values()].find(node => node.state === 2);

  if (connected()) return connected();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Lavalink connection timed out"));
    }, 20000);

    function cleanup() {
      clearTimeout(timeout);
      manager.off("ready", onReady);
      manager.off("error", onError);
    }

    function onReady() {
      const node = connected();
      if (!node) return;
      cleanup();
      resolve(node);
    }

    function onError(name, error) {
      cleanup();
      reject(error || new Error(`Lavalink error: ${name}`));
    }

    manager.on("ready", onReady);
    manager.on("error", onError);

    if (connected()) {
      cleanup();
      resolve(connected());
    }
  });
}

async function findSong(node, query) {
  const identifier = /^https?:\/\//i.test(query)
    ? query
    : `ytsearch:${query}`;

  const result = await node.rest.resolve(identifier);

  if (!result || result.loadType === "error") {
    throw new Error("Lavalink could not load the song");
  }

  let tracks = [];

  if (Array.isArray(result.data)) {
    tracks = result.data;
  } else if (result.data?.tracks) {
    tracks = result.data.tracks;
  } else if (result.data?.encoded) {
    tracks = [result.data];
  }

  if (!tracks.length) {
    throw new Error("No playable tracks found");
  }

  const track = tracks[0];

  return {
    title: track.info?.title || "Unknown song",
    encoded: track.encoded || track.track
  };
}

async function playNext(guildId) {
  const queue = queues.get(guildId);

  if (!queue || queue.starting) return;

  if (!queue.songs.length) {
    queue.playing = false;
    return;
  }

  queue.starting = true;

  try {
    if (!queue.player) {
      queue.player = await queue.manager.joinVoiceChannel({
        guildId,
        channelId: queue.channelId,
        shardId: queue.shardId
      });

      queue.player.on("end", data => {
        if (queues.get(guildId) !== queue) return;

        if (data?.reason === "replaced") return;

        queue.songs.shift();
        queue.playing = false;

        playNext(guildId).catch(error => {
          console.error("Next song error:", error);
        });
      });

      queue.player.on("exception", error => {
        console.error("Track exception:", error);
      });

      queue.player.on("closed", () => {
        console.log("Voice connection closed:", guildId);

        if (queues.get(guildId) === queue) {
          queues.delete(guildId);
        }
      });
    }

    const song = queue.songs[0];

    await queue.player.playTrack({
      track: { encoded: song.encoded }
    });

    queue.playing = true;
    console.log("Playback requested:", song.title);

  } catch (error) {
    console.error("Playback failed:", error);
    queue.playing = false;
    throw error;
  } finally {
    queue.starting = false;
  }
}

function initializeMusic(client) {
  console.log("LS Music: initialization started");
  const manager = getManager(client);
  console.log("LS Music: nodes created:", [...manager.nodes.keys()]);
setTimeout(() => {
  console.log("LS Music: nodes after 5 seconds:", [...manager.nodes.keys()]);
}, 5000);
  
  return manager;
}


module.exports = {
  initializeMusic,
  data: new SlashCommandBuilder()
    .setName("music")
    .setDescription("LS Bot Babe music controls")

    .addSubcommand(sub =>
      sub.setName("play")
        .setDescription("Play or add a song")
        .addStringOption(option =>
          option.setName("song")
            .setDescription("Song name or supported URL")
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName("skip")
        .setDescription("Skip the current song")
    )

    .addSubcommand(sub =>
      sub.setName("pause")
        .setDescription("Pause music")
    )

    .addSubcommand(sub =>
      sub.setName("resume")
        .setDescription("Resume music")
    )

    .addSubcommand(sub =>
      sub.setName("queue")
        .setDescription("Show the music queue")
    )

    .addSubcommand(sub =>
      sub.setName("leave")
        .setDescription("Stop music and leave")
    ),

  async execute(interaction) {
    const action = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (action === "play") {
      const member = await interaction.guild.members.fetch(
        interaction.user.id
      );

      const channel = member.voice.channel;

      if (!channel) {
        return interaction.reply({
          content: "🎧 Join a voice channel first!",
          ephemeral: true
        });
      }

      await interaction.deferReply();

      try {
        const manager = getManager(interaction.client);
        const node = await getNode(manager);

        const query = interaction.options.getString("song");
        const song = await findSong(node, query);

        let queue = queues.get(guildId);

        if (queue && queue.channelId !== channel.id) {
          return interaction.editReply(
            "🎧 Music is already active in another voice channel."
          );
        }

        if (!queue) {
          queue = {
            manager,
            channelId: channel.id,
            shardId: interaction.guild.shardId,
            player: null,
            songs: [],
            playing: false,
            starting: false
          };

          queues.set(guildId, queue);
        }

        queue.songs.push(song);

        if (!queue.playing && !queue.starting) {
          try {
            await playNext(guildId);
          } catch (error) {
            queue.songs = queue.songs.filter(s => s !== song);

            if (!queue.player) {
              queues.delete(guildId);
            }

            throw error;
          }

          return interaction.editReply(
            `🎶 Playback requested: **${song.title}**`
          );
        }

        return interaction.editReply(
          `➕ Added to queue: **${song.title}**`
        );

      } catch (error) {
        console.error("Music command error:", error);

        return interaction.editReply(
          `❌ Music error: ${String(error.message).slice(0, 150)}`
        );
      }
    }

    const queue = queues.get(guildId);

    if (!queue) {
      return interaction.reply({
        content: "🎵 There's no active music queue.",
        ephemeral: true
      });
    }

    try {
      if (action === "skip") {
        if (!queue.player) {
          return interaction.reply("No active player.");
        }

        await queue.player.stopTrack();
        return interaction.reply("⏭️ Skipped!");
      }

      if (action === "pause") {
        if (!queue.player) {
          return interaction.reply("No active player.");
        }

        await queue.player.setPaused(true);
        return interaction.reply("⏸️ Music paused.");
      }

      if (action === "resume") {
        if (!queue.player) {
          return interaction.reply("No active player.");
        }

        await queue.player.setPaused(false);
        return interaction.reply("▶️ Music resumed.");
      }

      if (action === "queue") {
        if (!queue.songs.length) {
          return interaction.reply("🎵 The queue is empty.");
        }

        const list = queue.songs.slice(0, 10)
          .map((song, index) =>
            `${index + 1}. ${song.title}`
          )
          .join("\n");

        return interaction.reply(
          `🎶 **LS Music Queue**\n${list}`
        );
      }

      if (action === "leave") {
        queues.delete(guildId);

        if (queue.player) {
          await queue.player.destroy();
        }

        return interaction.reply(
          "👋 Music stopped. LS Bot Babe left the channel."
        );
      }

    } catch (error) {
      console.error("Music control error:", error);

      return interaction.reply({
        content: `❌ Music error: ${String(error.message).slice(0, 150)}`,
        ephemeral: true
      });
    }
  }
};
