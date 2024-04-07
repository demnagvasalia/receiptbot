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
    data: new SlashCommandBuilder().setName('grailpoint').setDescription('(polish) Generates a grailpoint receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of grailpoint product (eg https://grailpoint.com/product/dunk-low-sb-powerpuff-girls/)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('productsize')
                .setDescription('size of your product')
                .setRequired(true)
        ).addNumberOption(option =>
            option.setName('productprice')
                .setDescription('price of your product')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('firstname')
                .setDescription('your first name')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('lastname')
                .setDescription('your last name')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('phonenumber')
                .setDescription('your phone number')
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
                .setDescription('date when your order was placed format example: 1 GRUDNIA 2023')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        ),
    run: async ({interaction}) => {
        if(await log.logCheckUser(interaction, authUtil, "grailpoint.com")) {
            log.sendWait(interaction);
            const url = interaction.options.getString("url");
            const email = interaction.options.getString("email");
            log.logCommand(interaction, url, email, "grailpoint");
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
                const productName = $('h1[class="single-product__title"]:first').text().trim();
                // Select the script element containing JSON-LD
                const scriptContent = $('script[type="application/ld+json"]').html();

                const jsonData = JSON.parse(scriptContent);
                const productImage = jsonData['@graph'][0].thumbnailUrl;
                const productPrice = parseFloat(interaction.options.getNumber('productprice')).toFixed(2);
                const totalPrice = (parseFloat(productPrice) + 15).toFixed(2);
                const orderid = math.generateRandomDigits(6);

                const subject = "[Grail Point] Otrzymaliśmy twoje zamówienie!";
                const replacedHtmlContent = readHtmlContent("grailpoint.html")
                    .replaceAll("@orderid", orderid)
                    .replaceAll("@productname", productName)
                    .replaceAll("@orderdate", interaction.options.getString("orderdate"))
                    .replaceAll("@productname", productName)
                    .replaceAll("@productprice", productPrice)
                    .replaceAll("@totalprice", totalPrice)
                    .replaceAll("@firstname", interaction.options.getString("firstname"))
                    .replaceAll("@lastname", interaction.options.getString("lastname"))
                    .replaceAll("@city", interaction.options.getString("city"))
                    .replaceAll("@postcode", interaction.options.getString("postcode"))
                    .replaceAll("@phonenumber", interaction.options.getString("phonenumber"))
                    .replaceAll("@imglink", productImage)
                    .replaceAll("@productsize", interaction.options.getString("productsize"))
                    .replaceAll("@address", interaction.options.getString("address"));
                await sendEmail(subject, replacedHtmlContent, email, "Grail Point");
                log.sendConfirm(interaction);
            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }
    }
};



