const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");
const play = require("@iamtraction/play-dl");
const youtubedl = require("youtube-dl-exec");
const { Shoukaku, Connectors } = require("shoukaku");

const queues = new Map();
let shoukaku;

function getShoukaku(client) {

    if (!shoukaku) {

          const nodes = [{

        name: "LS-Lavalink",

  url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,

        auth: process.env.LAVALINK_PASSWORD,

            secure: false,

              }];

          shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes);

        }

    return shoukaku;
  }
module.exports = {
  data: new SlashCommandBuilder()
    .setName("music")
    .setDescription("LSBotBabe music controls")

    .addSubcommand((sub) =>
      sub
        .setName("play")
        .setDescription("Play or add a song")
        .addStringOption((option) =>
          option
            .setName("song")
            .setDescription("YouTube/Spotify link or song name")
            .setRequired(true)
        )
    )

    .addSubcommand((sub) =>
      sub.setName("skip").setDescription("Skip the current song")
    )

    .addSubcommand((sub) =>
      sub.setName("pause").setDescription("Pause the music")
    )

    .addSubcommand((sub) =>
      sub.setName("resume").setDescription("Resume the music")
    )

    .addSubcommand((sub) =>
      sub.setName("queue").setDescription("Show the music queue")
    )

    .addSubcommand((sub) =>
      sub.setName("leave").setDescription("Stop music and leave")
    ),

  async execute(interaction) {
    const action = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (action === "play") {
      const member = await interaction.guild.members.fetch(interaction.user.id);
const voiceChannel = member.voice.channel;
      if (!voiceChannel) {
        return interaction.reply({
          content: "🎧 Join a voice channel first!",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const query = interaction.options.getString("song");
      let song;

      try {
        if (play.yt_validate(query) === "video") {
          const info = await play.video_basic_info(query);
          song = {
            title: info.video_details.title,
            url: info.video_details.url,
          };
        } else if (play.sp_validate(query) === "track") {
          const spotify = await play.spotify(query);
          const results = await play.search(
            `${spotify.name} ${spotify.artists.join(" ")}`,
            { limit: 1 }
          );

          if (!results.length) throw new Error("Song not found");

          song = {
            title: results[0].title,
            url: results[0].url,
          };
        } else {
          const results = await play.search(query, { limit: 1 });

          if (!results.length) throw new Error("Song not found");

          song = {
            title: results[0].title,
            url: results[0].url,
          };
        }
      } catch (error) {
        console.error(error);
        return interaction.editReply("❌ I couldn't find that song.");
      }

      let queue = queues.get(guildId);

      if (!queue) {
       

        queue = {
          client: interaction.client,
          voiceChannelId: voiceChannel.id,
          lavalinkPlayer: null,
          songs: [],
          playing: false,
        };

        queues.set(guildId, queue);
        
      }

      queue.songs.push(song);

      if (!queue.playing) {
        playNext(guildId);
        return interaction.editReply(`🎶 Now playing: **${song.title}**`);
      }

      return interaction.editReply(`➕ Added to queue: **${song.title}**`);
    }

    const queue = queues.get(guildId);

    if (!queue) {
      return interaction.reply({
        content: "🎵 There's no active music queue.",
        ephemeral: true,
      });
    }

    if (action === "skip") {
    await queue.lavalinkPlayer.stopTrack();
      return interaction.reply("⏭️ Skipped!");
    }

    if (action === "pause") {
      await queue.lavalinkPlayer.setPaused(true);
      return interaction.reply("⏸️ Music paused.");
    }

    if (action === "resume") {
    await queue.lavalinkPlayer.setPaused(false);
      return interaction.reply("▶️ Music resumed.");
    }

    if (action === "queue") {
      if (!queue.songs.length) {
        return interaction.reply("🎵 The queue is empty.");
      }

      const list = queue.songs
        .slice(0, 10)
        .map((song, index) => `${index + 1}. ${song.title}`)
        .join("\n");

      return interaction.reply(`🎶 **LS Music Queue**\n${list}`);
    }

    if (action === "leave") {
      await queue.lavalinkPlayer.stopTrack();
      await queue.lavalinkPlayer.destroy();
      queues.delete(guildId);

      return interaction.reply("👋 Music stopped. LSBotBabe left the channel.");
    }
  },
};

async function playNext(guildId) {
  const queue = queues.get(guildId);

  if (!queue || !queue.songs.length) {
    if (queue) queue.playing = false;
    return;
  }

  try {
    queue.playing = true;

    const song = queue.songs[0];
    const shoukaku = getShoukaku(queue.client);
    const node = shoukaku.options.nodeResolver(shoukaku.nodes);
    const result = await node.rest.resolve(song.url);
    if (!result || !result.data) {
  throw new Error("Lavalink could not load this song.");
}
    const track = Array.isArray(result.data)
  ? result.data[0]
  : result.data;
    const player = await shoukaku.joinVoiceChannel({
  guildId: guildId,
  channelId: queue.voiceChannelId,
  shardId: 0,
});
    queue.lavalinkPlayer = player;
    await player.playTrack({ track: { encoded: track.encoded } });
  } catch (error) {
    console.error("Playback error:", error);
    queue.songs.shift();
    playNext(guildId);
  }
}
