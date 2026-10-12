const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const file = path.join(process.cwd(), "birthdays.json");

function getBirthdays() {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveBirthdays(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Manage Lit Sessions birthdays")
    .addSubcommand(sub =>
      sub.setName("add")
        .setDescription("Add or update a birthday")
        .addUserOption(opt =>
          opt.setName("member").setDescription("Birthday member").setRequired(true))
        .addIntegerOption(opt =>
          opt.setName("month").setDescription("Birth month (1-12)").setMinValue(1).setMaxValue(12).setRequired(true))
        .addIntegerOption(opt =>
          opt.setName("day").setDescription("Birth day").setMinValue(1).setMaxValue(31).setRequired(true)))
    .addSubcommand(sub =>
      sub.setName("remove")
        .setDescription("Remove a birthday")
        .addUserOption(opt =>
          opt.setName("member").setDescription("Member").setRequired(true)))
    .addSubcommand(sub =>
      sub.setName("list").setDescription("Show saved birthdays")),

  async execute(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
const isServerOwnerRole = interaction.member.roles.cache.has("1536227795246645299");
const isHost = interaction.member.roles.cache.has("1536050723542794351");

if (!isOwner && !isServerOwnerRole && !isHost) {
      return interaction.reply({ content: "💖 Only the server owner can manage birthdays!", flags: MessageFlags.Ephemeral });
    }

    const birthdays = getBirthdays();
    const action = interaction.options.getSubcommand();

    if (action === "add") {
      const member = interaction.options.getUser("member");
      const month = interaction.options.getInteger("month");
      const day = interaction.options.getInteger("day");
      const date = new Date(Date.UTC(2024, month - 1, day));
      if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        return interaction.reply({ content: "❌ That date is not valid.", flags: MessageFlags.Ephemeral });
      }
      birthdays[member.id] = { month, day };
      saveBirthdays(birthdays);
      return interaction.reply({ content: `🎂 Saved <@${member.id}>'s birthday: ${month}/${day}!`, flags: MessageFlags.Ephemeral });
    }

    if (action === "remove") {
      const member = interaction.options.getUser("member");
      delete birthdays[member.id];
      saveBirthdays(birthdays);
      return interaction.reply({ content: `💖 Removed <@${member.id}>'s birthday.`, flags: MessageFlags.Ephemeral });
    }

    const entries = Object.entries(birthdays);
    const message = entries.length
      ? entries.map(([id, b]) => `🎂 <@${id}> — ${b.month}/${b.day}`).join("\n")
      : "No birthdays saved yet! 🎂";
    return interaction.reply({ content: message.slice(0, 1900), flags: MessageFlags.Ephemeral });
  }
};
