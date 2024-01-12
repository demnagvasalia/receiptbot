const Discord = require('discord.js');

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