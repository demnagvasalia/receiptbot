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
const fs = require("fs");
const math = require("../../utils/randomUtil");
const log = require("../../utils/logUtil");

module.exports = {
    data: new SlashCommandBuilder().setName('apple').setDescription('Generates a apple receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of apple product (eg https://www.apple.com/shop/buy-iphone/iphone-15-pro/details')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('country')
                .setDescription('your country')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('address')
                .setDescription('your address')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('city')
                .setDescription('your city')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('postcode')
                .setDescription('your postcode')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('orderdate')
                .setDescription('day when your order was placed (format: MM/DD/YYYY)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        ),
    run: async ({interaction}) => {
        if(await log.logCheckUser(interaction, authUtil, "apple.com")) {
            const email = interaction.options.getString("email");
            log.sendWait(interaction);
            const url = interaction.options.getString("url");
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

                const scriptContent = $('script[type="application/ld+json"]').html();
                const jsonData = JSON.parse(scriptContent);
                const productName = jsonData.name;
                const imglink = jsonData.image;
                const price = jsonData.offers[0].price;
                const productPrice = parseFloat(price).toFixed(2);
                const orderid = "W" + math.generateRandomDigits(10);
                const totalPrice = (price + 8).toFixed(2);
                const subject = "Dispatch Notification " + orderid;

                const replacedHtmlContent = readHtmlContent("apple.html")
                    .replaceAll("@orderday", interaction.options.getString("orderdate"))
                    .replaceAll("@productname", productName)
                    .replaceAll("@postcode",  interaction.options.getString("postcode"))
                    .replaceAll("@orderid", orderid)
                    .replaceAll("@city",  interaction.options.getString("city"))
                    .replaceAll("@address",  interaction.options.getString("address"))
                    .replaceAll("@productprice", productPrice)
                    .replaceAll("@country",  interaction.options.getString("country"))
                    .replaceAll("@imglink", imglink)
                    .replaceAll("@email", email)
                    .replaceAll("@totalprice", totalPrice);

                await sendEmail(subject, replacedHtmlContent, email, "Apple Store");
                log.sendConfirm(interaction);
            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }
    }
};



