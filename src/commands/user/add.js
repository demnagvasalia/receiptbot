const { SlashCommandBuilder } = require('discord.js');
const { addTokens, getUserTokens} = require('../../utils/dbUtil'); // Adjust the path as needed
const authUtil = require('../../utils/authUtil.js')
const embed = require("../../utils/embedUtil");
const discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Adds balance to a user')
        .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(true))
        .addIntegerOption(option => option.setName('value').setDescription('Number to add to the balance').setRequired(true)),
    run: async ({ interaction }) => {
        const user = interaction.options.getUser('user');
        const tokensToAdd = interaction.options.getInteger('value');
        if(!authUtil.checkId(interaction.user.id)) {
            interaction.reply({ embeds: [embed.createEmbed("No permissions", `You are not allowed to use that command`,discord.Colors.DarkRed)]});
        }else {
            try {
                await addTokens(user.id, tokensToAdd);
                interaction.reply({ embeds: [embed.createEmbed(`${user.tag} balance`, `has been updated to: ${await getUserTokens(user.id)}.`,discord.Colors.DarkGreen)]});
            } catch (error) {
                interaction.reply({ embeds: [embed.createEmbed(`Error`, `Could not top up balance: `,discord.Colors.DarkRed)]});
            }
        }
    },
};
