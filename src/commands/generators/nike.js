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

module.exports = {
    data: new SlashCommandBuilder().setName('nike').setDescription('Generates a nike receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of nike product (eg https://www.nike.com/t/ja-1-basketball-shoes-bCx2W3/FV1290-100)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('size')
                .setDescription('product size eg (11.5)')
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
            option.setName('orderid')
                .setDescription('your order id')
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
        if(!interaction.options.getString("url").toString().startsWith("https://nike.com/") && !interaction.options.getString("url").toString().startsWith("https://www.nike.com/")) {
            interaction.reply({ embeds: [embed.createEmbed("Wrong url", "please use nike url",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(await authUtil.checkTokens(interaction.user.id)) {
            const url = interaction.options.getString("url");
            interaction.reply({ embeds: [embed.createEmbed("Please wait", "we are generating your receipt. You will be notified on dms. It should take up to 30 seconds",discord.Colors.Aqua)], ephemeral: true});
            const email = interaction.options.getString("email");
            console.log(interaction.user.id + " has used command nike")
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
                console.log(productPrice);
                const productPriceReplaced = parseFloat(productPrice.replaceAll(",", ".").replaceAll(" ", "").replaceAll("$", "").replaceAll("€", "").replaceAll("£", ""));
                const productCatAndName =  productName + " " + productCategory;
                const image = $(`img[alt="${productCatAndName}"]:first`).attr("src");
                let shippingPrice = 0;
                if(productPriceReplaced < 50) {
                    shippingPrice = 5;
                }
                const totalPrice = productPriceReplaced + shippingPrice;

                const productPriceStr = String(productPriceReplaced.toFixed(2)).replaceAll(".", ",");
                const shippingPriceStr = String(shippingPrice.toFixed(2)).replaceAll(".", ",");
                const totalPriceStr = String(totalPrice.toFixed(2)).replaceAll(".", ",");
                const orderid = interaction.options.getString("orderid");
                const subject = `Order Received (Nike.com #${orderid})`;
                const currency = interaction.options.getString('currency');
                const replacedHtmlContent = readHtmlContent("nike.html")
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
                    .replaceAll("@price", productPriceStr)
                    .replaceAll("@deliveryprice", shippingPriceStr)
                    .replaceAll("@totalprice", totalPriceStr)
                    .replaceAll("@orderid", orderid)
                    .replaceAll("@currency", currency)
                await sendEmail(subject, replacedHtmlContent, email, "Nike");
                if(!await db.isUserLicensed(interaction.user.id)) await db.addTokens(interaction.user.id, -1);


                interaction.user.send({ embeds: [embed.createEmbed("Email sent", `Your balance has been reduced to: ${await getUserTokens(interaction.user.id)}`,discord.Colors.DarkGreen)]});

            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }else
            interaction.reply({ embeds: [embed.createEmbed("Balance", "You dont have enough balance to use that command.",discord.Colors.DarkRed)], ephemeral: true});
    }
};



