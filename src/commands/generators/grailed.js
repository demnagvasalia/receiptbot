const { SlashCommandBuilder } = require('discord.js');
const { sendEmail } = require('../../utils/emailUtil');
const { readHtmlContent } = require('../../utils/htmlUtil');
const cheerio = require('cheerio');
const authUtil = require('../../utils/authUtil');
const axios = require("axios");
const db = require('../../utils/dbUtil');
const {getUserTokens} = require("../../utils/dbUtil");
const embed = require("../../utils/embedUtil");
const discord = require('discord.js');
const fs = require("fs");
const log = require("../../utils/logUtil");

module.exports = {
    data: new SlashCommandBuilder().setName('grailed').setDescription('Generates a grailed receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of grailed product (eg https://www.grailed.com/listings/product)')
                .setRequired(true)
        ).addNumberOption(option =>
            option.setName('taxprice')
                .setDescription('input tax number')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('address')
                .setDescription('your home address')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('city')
                .setDescription('city you live in')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('postcode')
                .setDescription('postcode of area where you live')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('sellercountry')
                .setDescription('country where your seller is located in')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('country')
                .setDescription('country where you live in')
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
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        ),
    run: async ({interaction}) => {

        if(await log.logCheckUser(interaction, authUtil, "grailed.com")) {
            log.sendWait(interaction);
            const url = interaction.options.getString("url");
            const name = interaction.options.getString("firstname");
            const lastname = interaction.options.getString("lastname");
            const address = interaction.options.getString("address");
            const city = interaction.options.getString("city");
            const postcode = interaction.options.getString("postcode");
            const country= interaction.options.getString("country");
            const email = interaction.options.getString("email");
            log.logCommand(interaction, url, email, "grailed")
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
                const productImage = $('img.Photo_picture__g7Lsj').attr('src');
                const productTitle = $('h1[class="Body_body__dIg1V Text Details_title__PpX5v"]:first').text();
                const productBrand = $('a[class="Designers_designer__quaYl"]:first').text();
                const productPrice = $('span[data-testid="Current"]:first').text();
                const productSize = $('span[class="Details_value__S1aVR"]:first').text();
                const productSellerCountry = $('span[class="Body_body__dIg1V Text Shipping_cost__EkgVa"]').text().split("—");
                const afterDash = interaction.options.getString("sellercountry");
                const productSellerCountryReplaced = String(afterDash).replaceAll("to", "").replaceAll(" ", "");
                const totalPrice = parseInt(productPrice.replace("$", "")) + interaction.options.getNumber("taxprice");
                const subject = "Congrats on your purchase!";
                const username = $('div[class="UserBar_username__32RJi"]').text().trim();
                const avatarUrl = $('div[class="UserBar_avatar__3WofK"] img').attr('src');

                const replacedHtmlContent = readHtmlContent("grailed.html")
                    .replaceAll("@brand", productBrand)
                    .replaceAll("@image", productImage)
                    .replaceAll("@tax", interaction.options.getNumber("taxprice"))
                    .replaceAll("@product", productTitle)
                    .replaceAll("@country", country)
                    .replaceAll("@address", address)
                    .replaceAll("@postal", postcode)
                    .replaceAll("@city", city)
                    .replaceAll("@size", productSize)
                    .replaceAll("@price", productPrice)
                    .replaceAll("@totalprice", "$" + String(totalPrice))
                    .replaceAll("@sellercountry", interaction.options.getString("sellercountry"))
                    .replaceAll("@country", country);
                await sendEmail(subject, replacedHtmlContent, email, "grailed");
                log.sendConfirm(interaction);
            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }
    }
};



