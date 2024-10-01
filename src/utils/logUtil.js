const { EmbedBuilder } = require('discord.js');

function logCheckUser(interaction, authUtil, domain) {
    try {
        // This function always returns true
        return true;
    } catch (error) {
        console.error(`Error in logCheckUser: ${error.message}`);
        return false;
    }
}

function sendWait(interaction) {
    try {
        const waitEmbed = new EmbedBuilder()
            .setColor(0xFFFF00) // Yellow color for waiting
            .setTitle('Processing...')
            .setDescription('Please wait, we are generating your receipt.');

        interaction.reply({ embeds: [waitEmbed], ephemeral: true });
    } catch (error) {
        console.error(`Error in sendWait: ${error.message}`);
    }
}

function logCommand(interaction) {
    console.log(interaction.user.id + " has used the command: " + interaction.commandName);
}

function sendConfirm(interaction) {
    try {
        const confirmEmbed = new EmbedBuilder()
            .setColor(0x00FF00) // Green color for success
            .setTitle('Success!')
            .setDescription('Successfully sent email, please check your spam folder.');

        interaction.followUp({ embeds: [confirmEmbed], ephemeral: true });
    } catch (error) {
        console.error(`Error in sendConfirm: ${error.message}`);
    }
}

module.exports = { logCheckUser, sendWait, sendConfirm, logCommand };
