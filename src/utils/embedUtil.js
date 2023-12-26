const Discord = require('discord.js');

// Function to create a Discord embed
function createEmbed(title, description, color) {
    return {
        color: color,
        title: title,
        description: description
    };
}

module.exports = {
    createEmbed
}