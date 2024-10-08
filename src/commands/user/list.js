const { SlashCommandBuilder } = require('discord.js');
const { addTokens, getUserTokens} = require('../../utils/dbUtil'); // Adjust the path as needed
const authUtil = require('../../utils/authUtil.js')
const embed = require("../../utils/embedUtil");
const discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Shows all available gens'),
    run: async ({ interaction }) => {
        const polishgens = ["\n`grailpoint`", "\n`mediaexpert`", "\n`dorawa`", "\n`plzalando`", "\n`plnike`"];
        const englishgens = ["\n`stockx`", "\n`apple`", "\n`grailed`", "\n`trapstar`", "\n`nike`"];
        const description = "    **english:**\n " + englishgens + "\n\n**polish:**\n " + polishgens
        interaction.reply({ embeds: [embed.createEmbed("Available gens: `" + (polishgens.length + englishgens.length) + "`", description.replaceAll(",", ""),discord.Colors.LuminousVividPink)]});
    },
};
