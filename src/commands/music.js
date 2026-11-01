const { SlashCommandBuilder } = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
  getVoiceConnection
} = require("@discordjs/voice");

const play = require("@iamtraction/play-dl");
const TEST_AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

const queues = new Map();

function initializeMusic(client) {
  console.log("LS Music: Direct voice playback initialized");
}

async function findSong(query) {

if (query.toLowerCase() === "test") {
  return {
    title: "LS Bot Babe Audio Test",
    url: TEST_AUDIO_URL,
    isTest: true
  };
}
  
  let url = query;
  let title = query;

  if (!/^https?:\/\//i.test(query)) {
    const results = await play.search(query, {
      limit: 1,
      source: { youtube: "video" }
    });

    if (!results.length) {
      throw new Error("No songs found.");
    }

    url = results[0].url;
    title = results[0].title;
  } else {
    const info = await play.video_info(url);
    title = info.video_details.title;
  }

  return { title, url };
}

async function playNext(guildId) {
  const queue = queues.get(guildId);

  if (!queue || queue.starting) return;

  if (!queue.songs.length) {
    queue.playing = false;

    queue.timer = setTimeout(() => {
      if (
        queues.get(guildId) === queue &&
        !queue.playing &&
        !queue.songs.length
      ) {
        queue.connection.destroy();
        queues.delete(guildId);
      }
    }, 5 * 60 * 1000);

    return;
  }

  queue.starting = true;

  try {
    const song = queue.songs[0];

    console.log("LS Music loading:", song.title);

    let resource;

if (song.isTest) {
  const response = await fetch(song.url);

  if (!response.ok) {
    throw new Error(`MP3 download failed: ${response.status}`);
  }

  const { Readable } = require("node:stream");
  const audioStream = Readable.fromWeb(response.body);

  resource = createAudioResource(audioStream, {
    inlineVolume: true
  });

    
} else {
  const stream = await play.stream(song.url);

  resource = createAudioResource(stream.stream, {
    inputType: stream.type,
    inlineVolume: true
  });
}

    resource.volume.setVolume(1);

    queue.player.play(resource);
    queue.playing = true;

    console.log("LS Music playback started:", song.title);

  } catch (error) {
    console.error("LS Music playback error:", error);

    queue.songs.shift();
    queue.playing = false;

    setTimeout(() => {
      playNext(guildId).catch(console.error);
    }, 1000);

  } finally {
    queue.starting = false;
  }
}

async function createQueue(interaction, channel) {
  const guildId = interaction.guildId;

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator,
    selfDeaf: true
  });

  await entersState(
    connection,
    VoiceConnectionStatus.Ready,
    20000
  );

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause
    }
  });

  connection.subscribe(player);

  const queue = {
    connection,
    player,
    channelId: channel.id,
    songs: [],
    playing: false,
    starting: false,
    timer: null
  };

  queues.set(guildId, queue);

  player.on(AudioPlayerStatus.Idle, () => {
    if (queues.get(guildId) !== queue) return;

    queue.songs.shift();
    queue.playing = false;

    playNext(guildId).catch(console.error);
  });

  player.on(AudioPlayerStatus.Playing, () => {
    console.log("LS Music: Audio player is playing");
  });

  player.on("error", error => {
    console.error("LS Music player error:", error);

    if (queues.get(guildId) !== queue) return;

    queue.songs.shift();
    queue.playing = false;

    playNext(guildId).catch(console.error);
  });

  connection.on("error", error => {
    console.error("LS Music voice connection error:", error);
  });

  return queue;
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
            .setDescription("Song name or YouTube URL")
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
      await interaction.deferReply();
      const member = await interaction.guild.members.fetch(
        interaction.user.id
      );

      const channel = member.voice.channel;

      if (!channel) {
        return interaction.editReply({
          content: "🎧 Join a voice channel first!",
          ephemeral: true
        });
      }

      try {
        const query = interaction.options.getString("song");
        const song = await findSong(query);

        let queue = queues.get(guildId);

        if (queue && queue.channelId !== channel.id) {
          return interaction.editReply(
            "🎧 Music is already active in another voice channel."
          );
        }

        if (!queue) {
          queue = await createQueue(interaction, channel);
        }

        if (queue.timer) {
          clearTimeout(queue.timer);
          queue.timer = null;
        }

        queue.songs.push(song);

        if (!queue.playing && !queue.starting) {
        playNext(guildId).catch(error => {
  console.error("LS Music playback failed:", error);
});

          return interaction.editReply(
            `🎶 Loading: **${song.title}**`
          );
        }

        return interaction.editReply(
          `➕ Added to queue: **${song.title}**`
        );

      } catch (error) {
        console.error("LS Music command error:", error);

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
        queue.player.stop(true);

        return interaction.reply("⏭️ Skipped!");
      }

      if (action === "pause") {
        queue.player.pause();

        return interaction.reply("⏸️ Music paused.");
      }

      if (action === "resume") {
        queue.player.unpause();

        return interaction.reply("▶️ Music resumed.");
      }

      if (action === "queue") {
        if (!queue.songs.length) {
          return interaction.reply("🎵 The queue is empty.");
        }

        const list = queue.songs
          .slice(0, 10)
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

        if (queue.timer) {
          clearTimeout(queue.timer);
        }

        queue.player.stop(true);
        queue.connection.destroy();

        return interaction.reply(
          "👋 Music stopped. LS Bot Babe left the channel."
        );
      }

    } catch (error) {
      console.error("LS Music control error:", error);

      return interaction.reply({
        content: `❌ Music error: ${String(error.message).slice(0, 150)}`,
        ephemeral: true
      });
    }
  }
};
