const { SlashCommandBuilder } = require('discord.js');
const { addTokens, getUserTokens, getUserLifetime, addLifetime } = require('../../utils/dbUtil');
const authUtil = require('../../utils/authUtil.js');
const embed = require("../../utils/embedUtil");
const discord = require("discord.js");
const keyGen = require('../../keys/keyGenerator.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('adds to user balance / license.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('license')
                .setDescription('Adds license to a user.')
                .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true))
                .addIntegerOption(option => option.setName('days').setDescription('Days of license.').setRequired(true))
        ),
    run: async ({ interaction }) => {
        const user = interaction.options.getUser('user');
        if (!authUtil.checkId(interaction.user.id)) {
            interaction.reply({embeds: [embed.createEmbed("No permissions", `You are not allowed to use that command`, discord.Colors.DarkRed)]});
        } else {
            try {
                const days = interaction.options.getInteger('days');
                const durationInMilliseconds = days * 24 * 60 * 60 * 1000;
                await addLifetime(user.id, durationInMilliseconds);
                interaction.reply({embeds: [embed.createEmbed(`${user.tag} license`, `has been updated. It will expire on: ${await getUserLifetime(user.id)}.`, discord.Colors.DarkGreen)]});
            } catch (error) {
                interaction.reply({embeds: [embed.createEmbed(`Error`, `Could not update: ${error}`, discord.Colors.DarkRed)]});
            }
        }
    }
}
