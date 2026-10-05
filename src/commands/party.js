const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const ALLOWED_ROLES = [
  "Server Owner",
  "LS Party Ambassador",
  "LS Party Host",
  "LS co-Host",
  "B-Day party planner",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("party")
    .setDescription("Create a Lit Sessions party RSVP")
    .addStringOption(option =>
      option
        .setName("title")
        .setDescription("Name of the party")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("details")
        .setDescription("Party details or description")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("time")
        .setDescription("Party date and time")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("gems")
        .setDescription("Gem entry amount")
        .setMinValue(0)
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("spots")
        .setDescription("Maximum number of party spots")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option
        .setName("flyer")
        .setDescription("Party flyer/image")
        .setRequired(false)
    ),

  async execute(interaction) {

    // Only approved LS roles can create parties
    const hasPermission = interaction.member.roles.cache.some(role =>
      ALLOWED_ROLES.includes(role.name)
    );

    if (!hasPermission) {
      return interaction.reply({
        content:
          "💎 Sorry babe! Only LS party staff can create a party RSVP.",
        ephemeral: true,
      });
    }

    const title = interaction.options.getString("title");
    const details = interaction.options.getString("details");
    const time = interaction.options.getString("time");
    const gems = interaction.options.getInteger("gems");
    const spots = interaction.options.getInteger("spots");
    const flyer = interaction.options.getAttachment("flyer");

    const partyEmbed = new EmbedBuilder()
      .setTitle(`<:LS:1544525450574041088>🔥 ${title} 🔥🎉`)
      .setDescription(details)
      .addFields(
        {
      name: "⏰ Date & Time",
          value: time,
          inline: false,
        },
        
          {
  name: "<:Gem:1544534918103695380> Gems",
  value: `${gems}`,
  inline: true,
},
        {
          name: "👥 Headcount",
          value: `0/${spots}`,
          inline: true,
        },
        {
          name: "✅ Yes",
          value: "Nobody yet — who's first? 👀",
          inline: false,
        },
        {
          name: "❓ Maybe",
          value: "Nobody yet",
          inline: false,
        },
        {
          name: "⏳ Waitlist",
          value: "Nobody yet",
          inline: false,
        },
    
{
  name: "❌ Can't Go",
  value: "Nobody yet",
  inline: false,
}
      )
      .setFooter({
        text: `Hosted by ${interaction.user.username} • Lit Sessions`,
      })
      .setTimestamp();

    if (flyer && flyer.contentType?.startsWith("image/")) {
      partyEmbed.setImage(flyer.url);
    }
const buttons = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("party_going")
    .setLabel("Yes")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success),

  new ButtonBuilder()
    .setCustomId("party_decline")
    .setLabel("Can't Go")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger),

  new ButtonBuilder()
    .setCustomId("party_maybe")
    .setLabel("Maybe")
    .setEmoji("❓")
    .setStyle(ButtonStyle.Primary)
);
    await interaction.reply({
  embeds: [partyEmbed],
  components: [buttons],
});
  },
};
