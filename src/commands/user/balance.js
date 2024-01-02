// displayTokens command

const { SlashCommandBuilder } = require('discord.js');
const { getUserTokens } = require('../../utils/dbUtil');
const embed = require("../../utils/embedUtil");
const discord = require("discord.js"); // Adjust the path as needed

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Displays the user balance')
        .addUserOption(option => option.setName('user').setDescription('Select the user').setRequired(false)),
    run: async ({ interaction }) => {
        const userOption = interaction.options.getUser('user');
        const user = userOption || interaction.user;

        try {
            // Call the getUserTokens function from the databaseUtils
            const userTokens = await getUserTokens(user.id);
            interaction.reply({ embeds: [embed.createEmbed(`${user.tag}`, `balance: infinite`,discord.Colors.DarkGreen)]});
            //interaction.reply({ embeds: [embed.createEmbed(`${user.tag}`, `balance: ${await getUserTokens(user.id)}`,discord.Colors.DarkGreen)]});
        } catch (error) {
            console.error(`Error fetching user tokens: ${error}`);
            interaction.reply({ embeds: [embed.createEmbed("Error", "error.",discord.Colors.DarkRed)]});

        }
    },
};
