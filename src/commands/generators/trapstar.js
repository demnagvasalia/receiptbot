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
const math = require("../../utils/randomUtil")
const log = require("../../utils/logUtil");

module.exports = {
    data: new SlashCommandBuilder().setName('trapstar').setDescription('Generates a trapstar receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of trapstar product (eg https://uk.trapstarlondon.com/collections/new-drop/products)')
                .setRequired(true)
        ).addIntegerOption(option =>
            option.setName('price')
                .setDescription('price of trapstar product')
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
            option.setName('size')
                .setDescription('size of trapstar product')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('color')
                .setDescription('color of trapstar product')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('name')
                .setDescription('your first name')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('lastname')
                .setDescription('your first last name')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('address')
                .setDescription('your address')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('city')
                .setDescription('city you live in')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('country')
                .setDescription('country you live in')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('postcode')
                .setDescription('postcode of area where you live in')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        ),
    run: async ({interaction}) => {
        if(await log.logCheckUser(interaction, authUtil, "uk.trapstarlondon.com")) {
            log.sendWait(interaction);
            const url = interaction.options.getString("url");
            const apiKey = process.env.API_KEY;
            log.logCommand(interaction, url, interaction.options.getString("email"), "trapstar")
            axios.post(
                "https://api.zyte.com/v1/extract",
                {
                    "url": url,
                    "httpResponseBody": true,
                },
                {
                    auth: { username: apiKey }
                }
            ).then(async (response) => {
                const httpResponseBody = Buffer.from(
                    response.data.httpResponseBody,
                    "base64"
                );
                const $ = cheerio.load(httpResponseBody.toString());
                const productName = $('h1[class="product-single__title"]:first').text();
                const productImage = $(`img[alt="${productName}"]:first`).attr("src").replaceAll("//", "https://");
                const orderId = "#TS" + math.generateRandomDigits(8);
                const subject = `Order ${orderId} confirmed`;
                const price = parseFloat(interaction.options.getInteger("price").toFixed(2));
                const totalPrice = parseFloat(price + 5);
                const replacedHtmlContent = readHtmlContent("trapstar.html")
                    .replaceAll("@orderid", orderId)
                    .replaceAll("@currency", interaction.options.getString("currency"))
                    .replaceAll("@lastname", interaction.options.getString("lastname"))
                    .replaceAll("@firstname", interaction.options.getString("name"))
                    .replaceAll("@address", interaction.options.getString("address"))
                    .replaceAll("@size", interaction.options.getString("size"))
                    .replaceAll("@color", interaction.options.getString("color"))
                    .replaceAll("@productname", productName)
                    .replaceAll("@imglink", productImage)
                    .replaceAll("@city", interaction.options.getString("city"))
                    .replaceAll("@postcode", interaction.options.getString("postcode"))
                    .replaceAll("@country", interaction.options.getString("country"))
                    .replaceAll("@productprice", price.toFixed(2))
                    .replaceAll("@totalprice",  totalPrice.toFixed(2))
                await sendEmail(subject, replacedHtmlContent, interaction.options.getString("email"), "Trapstar London");
                log.sendConfirm(interaction);

            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }
    }
};