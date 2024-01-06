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
const math = require("../../utils/mathUtil");

module.exports = {
    data: new SlashCommandBuilder().setName('plnike').setDescription('(polish) Generates a polish nike receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of mediaexpert product (eg https://www.nike.com/pl/t/buty-dla-duzych-dunk-low-MpPs6m/CW1590-100)')
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
        if(!interaction.options.getString("url").toString().startsWith("https://nike.com/pl/") && !interaction.options.getString("url").toString().startsWith("https://www.nike.com/pl/")) {
            interaction.reply({ embeds: [embed.createEmbed("Wrong url", "please use polish nike url",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(await authUtil.checkTokens(interaction.user.id)) {
            const url = interaction.options.getString("url");
            interaction.reply({ embeds: [embed.createEmbed("Please wait", "we are generating your receipt. You will be notified on dms. It should take up to 30 seconds",discord.Colors.Aqua)], ephemeral: true});
            const email = interaction.options.getString("email");
            console.log(interaction.user.id + " has used command plnike")
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
                const productPrice = $('div[class="product-price is--current-price css-s56yt7 css-xq7tty"]:first').text();
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
                if(!await db.isUserLicensed(interaction.user.id)) await db.addTokens(interaction.user.id, -1);


                interaction.user.send({ embeds: [embed.createEmbed("Email sent", `Your balance has been reduced to: ${await getUserTokens(interaction.user.id)}`,discord.Colors.DarkGreen)]});

            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }else
            interaction.reply({ embeds: [embed.createEmbed("Balance", "You dont have enough balance to use that command.",discord.Colors.DarkRed)], ephemeral: true});
    }
};



