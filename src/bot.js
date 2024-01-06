require('dotenv').config()
const { CommandHandler } = require('djs-commander');
const { Client, GatewayIntentBits} = require('discord.js')
const path = require('path');
const client     = new Client({intents: [GatewayIntentBits.Guilds,]})
const mongoose = require('mongoose')

new CommandHandler({
    client,
    commandsPath: path.join(__dirname, 'commands')
});

(async () => {
    try {
        mongoose.set('strictQuery', false)
        await mongoose.connect(process.env.MONGODB_URI, { });
            console.log("Connected to database");
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.BOT_TEST);