const { SlashCommandBuilder } = require('discord.js');
const { addTokens, getUserTokens, getUserLifetime, addLifetime } = require('../../utils/dbUtil');
const authUtil = require('../../utils/authUtil.js');
const embed = require("../../utils/embedUtil");
const discord = require("discord.js");
const keyGen = require('../../keys/keyGenerator.js');
const {generateKey} = require("../../keys/keyGenerator");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generate')
        .setDescription('generates balance / license key.')
        .addSubcommand(subcommand => subcommand
            .setName('balance')
            .setDescription('Generates balance key.')
            .addIntegerOption(option => option.setName('value').setDescription('Number to add to the balance').setRequired(true)
                .addChoices(
                    { name: "1 token", value: 1 },
                    { name: "3 tokens", value: 3 },
                    { name: "10 tokens", value: 10 },
                )
            )
            .addIntegerOption(option => option.setName('amount').setDescription('Amount of keys').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('license')
                .setDescription('Generates license key.')
                .addIntegerOption(option => option.setName('days').setDescription('Days of license.').setRequired(true).addChoices(
                    { name: "1 week", value: 7 },
                    { name: "1 month", value: 31 },
                    { name: "lifetime", value: 999 },
                ))
                .addIntegerOption(option => option.setName('amount').setDescription('Amount of keys').setRequired(true))
        ),
    run: async ({interaction}) => {
        const subcommand = interaction.options.getSubcommand();
        if (!authUtil.checkId(interaction.user.id)) {
            interaction.reply({embeds: [embed.createEmbed("No permissions", `You are not allowed to use that command`, discord.Colors.DarkRed)]});
        } else {
            try {
                if (subcommand === 'balance') {
                    const value = interaction.options.getInteger('value');
                    const amount = interaction.options.getInteger('amount');
                    let stringHolder = "";
                    const char = '`';
                    for (let i = 0; i < amount; i++) {
                        stringHolder += `${char}${await generateKey(value, true)}${char}\n`
                    }
                    interaction.user.send({embeds: [embed.createEmbed(`Keys x${amount} (${value} tokens each):`, stringHolder, discord.Colors.Grey)]});
                } else if (subcommand === 'license') {
                    const days = interaction.options.getInteger('days');
                    const amount = interaction.options.getInteger('amount');
                    let stringHolder = "";
                    const char = '`';
                    for (let i = 0; i < amount; i++) {
                        stringHolder += `${char}${await generateKey(days, false)}${char}\n`
                    }
                    interaction.user.send({embeds: [embed.createEmbed(`Keys x${amount} (${days} days each):`, stringHolder, discord.Colors.Grey)]});
                }
            } catch (error) {
                interaction.reply({embeds: [embed.createEmbed(`Error`, `Could not update: ${error}`, discord.Colors.DarkRed)]});
            }
        }
    }
}