const { SlashCommandBuilder } = require('discord.js');
const { swichBlacklist, getUserLifetime, getUserBlacklist } = require('../../utils/dbUtil');
const authUtil = require('../../utils/authUtil.js');
const embed = require("../../utils/embedUtil");
const discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('disallows person to use the bot.')
        .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true)),
    run: async ({interaction}) => {
        const user = interaction.options.getUser('user');
        if (!authUtil.checkId(interaction.user.id)) {
            interaction.reply({embeds: [embed.createEmbed("No permissions", `You are not allowed to use that command`, discord.Colors.DarkRed)]});
        } else {
            const days = interaction.options.getInteger('days');
            const durationInMilliseconds = days * 24 * 60 * 60 * 1000;
            await swichBlacklist(user.id);
            let bl = "";
            let color = "";
            if(await getUserBlacklist(user.id)) {
                color = discord.Colors.DarkRed;
                bl = "blacklisted";
            }else {
                color = discord.Colors.DarkGreen;
                bl = "unblacklisted";
            }
            interaction.reply({embeds: [embed.createEmbed(`${user.tag} is now: ${bl}`, ``, color)]});
        }
    }
}