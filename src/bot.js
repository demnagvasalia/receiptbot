require('dotenv').config()
const readline = require('readline');
const { CommandHandler } = require('djs-commander');
const { Client, GatewayIntentBits} = require('discord.js')
const path = require('path');
const client     = new Client({intents: [GatewayIntentBits.Guilds,]})
const mongoose = require('mongoose')

new CommandHandler({
    client,
    commandsPath: path.join(__dirname, 'commands')
});

mongodb_uri = "mongodb+srv://w2c:vTxRJIUXT3UjBRxw@discord-bot.kigwubo.mongodb.net/?retryWrites=true&w=majority";
bot_token = "MTIyMjY0MjE1MTM5ODA0Nzc3NA.GHvFXL.0S6mma8KI3C9G_RefA9gdghng5zdKtpgJyw2yU";
(async () => {
    try {
        mongoose.set('strictQuery', false)
        await mongoose.connect(mongodb_uri, {});
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();
console.log(bot_token);
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(bot_token);