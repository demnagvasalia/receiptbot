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
const {writeFile} = require("fs");
const math = require("../../utils/randomUtil");
const log = require("../../utils/logUtil");

module.exports = {
    data: new SlashCommandBuilder().setName('mediaexpert').setDescription('(polish) Generates a mediaexpert receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of mediaexpert product (eg https://www.mediaexpert.pl/telewizory-i-rtv/)')
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
            option.setName('deliverydate')
                .setDescription('day of delivery, format: YYYY-MM-DD')
                .setRequired(true)
        ).addIntegerOption(option =>
                option.setName('phonenumber')
                    .setDescription('3 last digits of your phone number')
                    .setRequired(true)
        ).addStringOption(option =>
            option.setName('paczkomat')
                .setDescription('id of the inpost "paczkomat"')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        )
    ,
    run: async ({interaction}) => {
        if(await log.logCheckUser(interaction, authUtil, "mediaexpert.pl")) {
            log.sendWait(interaction);
            const url = interaction.options.getString("url");
            const email = interaction.options.getString("email");
            log.logCommand(interaction, url, email, "mediaexpert");
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

                const productName = $('h1.name.is-title').text();
                const numberValue = $('span.whole:first').text().trim().replace(/\s+/g, "").replace("zł", "");
                const smallNumberValue = $('span.rest:first').text().trim();
                const productPrice = `${numberValue},${smallNumberValue}`.replaceAll("zł", "");
                const floatNum = productPrice.replace(/\s+/g, "").replace("zł", "").replace(",", ".").trim();
                const totalPrice = (parseFloat(floatNum) + 12.99).toFixed(2);
                const imageSrc = $('div[data-v-5f3772b2] img.is-loaded').attr('src');
                const productId = $('span[class="id is-regular"]:first').text().trim();

                const subject = "Twoje zamówienie zostało opłacone";
                const replacedHtmlContent = readHtmlContent("mediaexpert.html")
                    .replaceAll("@imglink", imageSrc)
                    .replaceAll("@productname", productName)
                    .replaceAll("@totalprice", totalPrice)
                    .replaceAll("@packboxid", interaction.options.getString("paczkomat"))
                    .replaceAll("@city", interaction.options.getString("city"))
                    .replaceAll("@postcode", interaction.options.getString("postcode"))
                    .replaceAll("@phonenumber", interaction.options.getInteger("phonenumber"))
                    .replaceAll("@productprice", productPrice)
                    .replaceAll("@orderid", math.generateRandomDigits(10))
                    .replaceAll("@productid", productId)
                await sendEmail(subject, replacedHtmlContent, email, "MediaExpert");
                log.sendConfirm(interaction);
            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }
    }
};



