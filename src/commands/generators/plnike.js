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
    data: new SlashCommandBuilder().setName('plnike').setDescription('(polish) Generates a polish nike receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of nike product (eg https://www.nike.com/pl/t/buty-dla-duzych-dunk-low-MpPs6m/CW1590-100)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('size')
                .setDescription('product size eg (EU 44)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('address')
                .setDescription('your home address')
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
                .setDescription('day of order, (eg 22.12.2023)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('deliverydate')
                .setDescription('day of order, (eg 24.12.2023)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('name')
                .setDescription('your name')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('lastname')
                .setDescription('your last name')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        )
    ,
    run: async ({interaction}) => {
        if(await log.logCheckUser(interaction, authUtil, "nike.com/pl")) {
            log.sendWait(interaction);
            const url = interaction.options.getString("url");
            const email = interaction.options.getString("email");
            log.logCommand(interaction, url, email, "plnike");
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

                const productName = $('h1[id="pdp_product_title"]:first').text();
                const productCategory = $('h2[class="headline-5 pb1-sm d-sm-ib"]:first').text();
                let productPrice;

// Check if the element with 'data-test' set to 'product-price-reduced' exists
                const productPriceReduced = $('div[data-test="product-price-reduced"]:first');
                if (productPriceReduced.length > 0) {
                    // If it exists, use its text content
                    productPrice = productPriceReduced.text();
                } else {
                    // If not, use the text content of the element with 'data-test' set to 'product-price'
                    productPrice = $('div[data-test="product-price"]:first').text();
                }

// Now, productPrice contains the appropriate text content
                const productPriceReplaced = parseFloat(productPrice.replaceAll(",", ".").replaceAll(" ", "").replaceAll("zł", ""));
                const productCatAndName = productCategory + " " + productName;
                const image = $(`img[alt="${productCatAndName}"]:first`).attr("src");
                let shippingPrice = 0;
                if(productPriceReplaced < 435) {
                    shippingPrice = 20;
                }
                const totalPrice = productPriceReplaced + shippingPrice;

                const productPriceStr = String(productPriceReplaced.toFixed(2)).replaceAll(".", ",");
                const shippingPriceStr = String(shippingPrice.toFixed(2)).replaceAll(".", ",");
                const totalPriceStr = String(totalPrice.toFixed(2)).replaceAll(".", ",");
                const orderid = "C" + math.generateRandomDigits(10);
                const subject = "Właśnie dotarło do nas Twoje zamówienie";

                const replacedHtmlContent = readHtmlContent("plnike.html")
                    .replaceAll("@imglink", image)
                    .replaceAll("@productname", productName)
                    .replaceAll("@productcategory", productCategory)
                    .replaceAll("@firstname", interaction.options.getString("name"))
                    .replaceAll("@lastname", interaction.options.getString("lastname"))
                    .replaceAll("@address", interaction.options.getString("address"))
                    .replaceAll("@postcode", interaction.options.getString("postcode"))
                    .replaceAll("@size", interaction.options.getString("size"))
                    .replaceAll("@city", interaction.options.getString("city"))
                    .replaceAll("@orderdate", interaction.options.getString("orderdate"))
                    .replaceAll("@deliverydate", interaction.options.getString("deliverydate"))
                    .replaceAll("@productprice", productPriceStr)
                    .replaceAll("@deliveryprice", shippingPriceStr)
                    .replaceAll("@totalprice", totalPriceStr)
                    .replaceAll("@orderid", orderid)
                await sendEmail(subject, replacedHtmlContent, email, "Nike");
                log.sendConfirm(interaction);
            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }
    }
};



