const { SlashCommandBuilder } = require('discord.js');
const { addLifetime, getUserTokens, getUserLifetime, addTokens } = require('../../utils/dbUtil');
const authUtil = require('../../utils/authUtil.js');
const embed = require("../../utils/embedUtil");
const discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('removes from user balance / license.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('Removes balance from a user.')
                .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true))
                .addIntegerOption(option => option.setName('value').setDescription('Number to remove from the balance').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('license')
                .setDescription('Removes license from a user.')
                .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true))
                .addIntegerOption(option => option.setName('days').setDescription('Days of license to remove.').setRequired(true))
        ),
    run: async ({ interaction }) => {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        if (!authUtil.checkId(interaction.user.id)) {
            interaction.reply({ embeds: [embed.createEmbed("No permissions", `You are not allowed to use that command`, discord.Colors.DarkRed)] });
        } else {
            try {
                if (subcommand === 'balance') {
                    const tokensToRemove = interaction.options.getInteger('value');
                    await addTokens(user.id, -tokensToRemove);
                    interaction.reply({ embeds: [embed.createEmbed(`${user.tag} balance`, `has been updated to: ${await getUserTokens(user.id)}.`, discord.Colors.DarkGreen)] });
                } else if (subcommand === 'license') {
                    const daysToRemove = interaction.options.getInteger('days');
                    const durationInMilliseconds = daysToRemove * 24 * 60 * 60 * 1000;
                    await addLifetime(user.id, -durationInMilliseconds);
                    interaction.reply({ embeds: [embed.createEmbed(`${user.tag} license`, `has been updated. It will expire on: ${await getUserLifetime(user.id)}.`, discord.Colors.DarkGreen)] });
                }
            } catch (error) {
                interaction.reply({ embeds: [embed.createEmbed(`Error`, `Could not update: ${error}`, discord.Colors.DarkRed)] });
            }
        }
    }
}
