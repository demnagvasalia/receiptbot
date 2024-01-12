// displayTokens command
const ms = require('ms'); // You may need to install this library using: npm install ms

const { SlashCommandBuilder } = require('discord.js');
const { getUserTokens, getUserLifetime, isUserLicensed} = require('../../utils/dbUtil');
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
        let license = "";
        try {
            const userTokens = await getUserTokens(user.id);
            const userLifetime = await getUserLifetime(user.id);

            if (userLifetime) {
                // Calculate remaining time
                const remainingTime = userLifetime - Date.now();

                if (remainingTime > 0) {
                    // Calculate each unit individually
                    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                    let formattedRemainingTime = "";
                    if(days > 365) {
                        // Format the remaining time
                        formattedRemainingTime = "lifetime";
                    }else {
                        formattedRemainingTime = `(expires in: ${days} days ${hours} hours ${minutes} minutes)`;
                    }
                    license = `${formattedRemainingTime}`;
                } else {
                    license = "";
                }
            }
            if(license === "")
                license = "none"
            const sign = "`"
            interaction.reply({ embeds: [embed.createEmbed(`${user.tag}`, `balance: ${sign}${userTokens}${sign}\nlicense: ${sign}${license}${sign}`, discord.Colors.Aqua)] });
        } catch (error) {
            console.error(`Error fetching user tokens: ${error}`);
            interaction.reply({ embeds: [embed.createEmbed("Error", "error.", discord.Colors.DarkRed)] });
        }
    },
};
