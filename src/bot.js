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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter instance number (1 or 2): ', (instanceNumber) => {
    rl.close();
    let mongodb_uri = ""
    let bot_token = ""
    switch(instanceNumber) {
        case "1": {
            mongodb_uri = process.env.DB_FIRST
            bot_token = process.env.BOT_FIRST
            break;
        }
        case "2": {
            mongodb_uri = process.env.DB_SECOND
            bot_token = process.env.BOT_SECOND
            break;
        }
    }
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
});