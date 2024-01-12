const { SlashCommandBuilder } = require('discord.js');
const { addTokens, getUserTokens} = require('../../utils/dbUtil'); // Adjust the path as needed
const db = require("../../utils/dbUtil");
const discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeems key')
        .addStringOption(option => option.setName('key').setDescription('Your key').setRequired(true)),
    run: async ({ interaction }) => {
        const key = interaction.options.getString("key");
        db.redeemKey(interaction, key);
    },
};
