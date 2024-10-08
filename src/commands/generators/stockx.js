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
const log = require("../../utils/logUtil");

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
            option.setName('currency')
                .setDescription('your currency')
                .setRequired(true)
                .addChoices(
                    { name: "$", value: "$" },
                    { name: "£", value: "£" },
                    { name: "€", value: "€" },
                )
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
            option.setName('styleid')
                .setDescription('Style id of your product')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        ),
    run: async ({interaction}) => {
        const userid = interaction.user.id;
        if(await log.logCheckUser(interaction, authUtil, "stockx.com")) {
            log.sendWait(interaction);
            const url = interaction.options.getString("url");
            const price = interaction.options.getInteger('price');
            const sizemode = interaction.options.getString('conversions');
            const currency = interaction.options.getString('currency');
            const size = interaction.options.getString("size");
            const delivery = interaction.options.getString("delivery");
            const email = interaction.options.getString("email");
            log.logCommand(interaction, url, email, "stockx")
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
                const productStyle = interaction.options.getString("styleid");
                const productImage = $('img[draggable=false]').attr('src');
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
                    .replaceAll("$$STOCKX_PRICE$$", `${currency}${price}.00`)
                    .replaceAll("$$STOCKX_SIZE$$", size)
                    .replaceAll("$$CURRENCY$$", currency)
                    .replaceAll("$$STOCKX_FULL_PRICE$$", `${currency}${fullPrice}.50`);
                await sendEmail(subject, replacedHtmlContent, email, "StockX");
                log.sendConfirm(interaction);
            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }
    }
};



