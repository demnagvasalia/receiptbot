const { SlashCommandBuilder } = require('discord.js');
const { sendEmail } = require('../../utils/emailUtil');
const { readHtmlContent } = require('../../utils/htmlUtil');
const cheerio = require('cheerio');
const axios = require("axios");
const authUtil = require('../../utils/authUtil');
const db = require('../../utils/dbUtil');
const {getUserTokens} = require("../../utils/dbUtil");
const embed = require("../../utils/embedUtil");
const discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('stockx').setDescription('Generates a StockX receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of stockx product (eg https://stockx.com/stussy-basic-t-shirt-white)')
                .setRequired(true)
        ).addIntegerOption(option =>
            option.setName('price')
                .setDescription('price of stockx product')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('conversions')
                .setDescription('conversions of the size')
                .setRequired(true)
                .addChoices(
                    { name: "US", value: "US" },
                    { name: "US M", value: "US M" },
                    { name: "US W", value: "US W" },
                    { name: "EU", value: "EU" },
                    { name: "UK", value: "UK" },
                    { name: "Other", value: "One size" },
                )
        ).addStringOption(option =>
            option.setName('size')
                .setDescription('size of stockx product')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('delivery')
                .setDescription('date of delivery. (eg 10/10/2023)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        ),
    run: async ({interaction}) => {
        if(await authUtil.checkBlacklist(interaction.user.id)) {
            interaction.reply({ embeds: [embed.createEmbed("You are blacklisted", "you are not allowed to use generators.",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(!interaction.channel) {
            interaction.reply({ embeds: [embed.createEmbed("Can not use on dms", "please use #cmd",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(!authUtil.checkChannelId(interaction.channel.id)) {
            interaction.reply({ embeds: [embed.createEmbed("Wrong channel", "please use #cmd",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(!interaction.options.getString("url").toString().startsWith("https://stockx.com/")) {
            interaction.reply({ embeds: [embed.createEmbed("Wrong url", "please use stockx url",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(await authUtil.checkTokens(interaction.user.id)) {
            interaction.reply({ embeds: [embed.createEmbed("Please wait", "we are generating your receipt. You will be notified on dms. It should take up to 30 seconds",discord.Colors.Aqua)], ephemeral: true});
            console.log(interaction.user.id + " has used command stockx")
            const url = interaction.options.getString("url");
            const price = interaction.options.getInteger('price');
            const sizemode = interaction.options.getString('conversions');
            const size = interaction.options.getString("size");
            const delivery = interaction.options.getString("delivery");
            const email = interaction.options.getString("email");
            axios.post(
                "https://api.zyte.com/v1/extract",
                {
                    "url": url,
                    "httpResponseBody": true
                },
                {
                    auth: { username: process.env.API_KEY }
                }
            ).then(async (response) => {
                const httpResponseBody = Buffer.from(
                    response.data.httpResponseBody,
                    "base64"
                );

                const $ = cheerio.load(httpResponseBody.toString());
                const secondProductName = $('span[data-component="secondary-product-title"]:first').text();
                const productName = $('h1[data-component="primary-product-title"]:first').text();
                const finalProductName = productName.replaceAll(secondProductName, "");
                const fullProductName = finalProductName + " " + secondProductName;
                const productStyle = $('p.chakra-text.css-wgsjnl:first').text();
                const productImage = $('img.chakra-image.css-g98gbd').attr('src');
                const orderNumber1 = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
                const orderNumber2 = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
                const orderNumber = orderNumber1.toString() + "-" + orderNumber2.toString();

                const subject = "🎉Order Delivered: " + fullProductName + "‎ (Size " + sizemode + " " + size + ")";
                const fullPrice = parseInt(price) + 13 + 12;
                const replacedHtmlContent = readHtmlContent("stockx.html")
                    .replaceAll("$$STOCKX_DATE$$", delivery)
                    .replaceAll("$$STOCKX_STYLE$$", productStyle)
                    .replaceAll("$$ORDER_NUMBER$$", orderNumber)
                    .replaceAll("$$STOCKX_SIZEMODE$$", sizemode.replace("EMPTY", ""))
                    .replaceAll("$$STOCKX_IMAGE$$", productImage)
                    .replaceAll("$$STOCKX_URL$$", url)
                    .replaceAll("$$STOCKX_TITLE$$", fullProductName)
                    .replaceAll("$$STOCKX_PRICE$$", `$${price}.00`)
                    .replaceAll("$$STOCKX_SIZE$$", size)
                    .replaceAll("$$STOCKX_FULL_PRICE$$", `$${fullPrice}.50`);
                await sendEmail(subject, replacedHtmlContent, email, "StockX");
                if(!await db.isUserLicensed(interaction.user.id)) await db.addTokens(interaction.user.id, -1);
                interaction.user.send({ embeds: [embed.createEmbed("Email sent", `Your balance has been reduced to: ${await getUserTokens(interaction.user.id)}`,discord.Colors.DarkGreen)]});
            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }else
            interaction.reply({ embeds: [embed.createEmbed("Balance", "You dont have enough balance to use that command.",discord.Colors.DarkRed)], ephemeral: true});
    }
};



