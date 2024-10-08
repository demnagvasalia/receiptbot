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
const fs = require("fs");
const log = require("../../utils/logUtil");

module.exports = {
    data: new SlashCommandBuilder().setName('plzalando').setDescription('(polish) Generates a zalando receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of plzalando product (eg https://www.zalando.pl/tommy-hilfiger-twist-beanie-czapka/)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('color')
                .setDescription('product color')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('size')
                .setDescription('product size')
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
            option.setName('paczkomat')
                .setDescription('id of the inpost "paczkomat"')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('orderdate')
                .setDescription('day of order, example: pon., 25 wrz 2023 - wt., 26 wrz 2023')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('deliverydate')
                .setDescription('day of delivery, format: pon., 25 wrz 2023 - wt., 26 wrz 2023')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        )
    ,
    run: async ({interaction}) => {
        if(await log.logCheckUser(interaction, authUtil, "zalando.pl")) {
            log.sendWait(interaction);
            const url = interaction.options.getString("url");
            const email = interaction.options.getString("email");
            log.logCommand(interaction, url, email, "plzalando")
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
                //sDq_FX lystZ1 FxZV-M _2Pvyxl JT3_zV EKabf7 mo6ZnF _1RurXL mo6ZnF _7ZONEy
                const productBrand = $('h3[class="FtrEr_ QdlUSH FxZV-M HlZ_Tf _5Yd-hZ"]:first').text();
                const productName = $('span[class="EKabf7 R_QwOV"]:first').text();
                const productImage = $('meta[property="og:image"]').attr('content').replace(/\?imwidth=103/, '').replace(/&filter=packshot/, '');
                const priceElement = $('meta[name="twitter:data1"]');
                const price = priceElement.attr('content').replaceAll("zł", "").replaceAll(" ", "").replaceAll(",",".").trim();
                const priceFloat = parseFloat(price);
                let shippingPrice = 0;
                if(priceFloat < 60)
                    shippingPrice = 4.99;

                const totalPrice = priceFloat + shippingPrice
                const productPriceStr = String(priceFloat.toFixed(2)).replaceAll(".", ",")
                const shippingPriceStr = String(shippingPrice.toFixed(2)).replaceAll(".", ",")
                const totalPriceStr = String(totalPrice.toFixed(2)).replaceAll(".", ",")

                const subject = "Otrzymaliśmy Twoje zamówienie";
                const replacedHtmlContent = readHtmlContent("plzalando.html")
                    .replaceAll("@orderdate", interaction.options.getString("orderdate"))
                    .replaceAll("@avgdelivery", interaction.options.getString("deliverydate"))
                    .replaceAll("@imglink", productImage)
                    .replaceAll("@productname", productName)
                    .replaceAll("@delivery", shippingPriceStr)
                    .replaceAll("@totalprice", totalPriceStr)
                    .replaceAll("@paczkomat", interaction.options.getString("paczkomat"))
                    .replaceAll("@city", interaction.options.getString("city"))
                    .replaceAll("@postcode", interaction.options.getString("postcode"))
                    .replaceAll("@color", interaction.options.getString("color"))
                    .replaceAll("@address", interaction.options.getString("address"))
                    .replaceAll("@productprice", productPriceStr)
                    .replaceAll("@brand", productBrand)
                    .replaceAll("@orderid", math.generateRandomDigits(12))
                    .replaceAll("@size", interaction.options.getString("size"))
                await sendEmail(subject, replacedHtmlContent, email, "Zalando Team");
                log.sendConfirm(interaction);

            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }
    }
};



