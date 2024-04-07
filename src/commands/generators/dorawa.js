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
    data: new SlashCommandBuilder().setName('dorawa').setDescription('(polish) Generates a dorawa receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of dorawa product (eg https://dorawastore.pl/pl/p/Nike-SB-Dunk-Low-White-Gum/1715)')
                .setRequired(true)
        ).addNumberOption(option =>
            option.setName('price')
                .setDescription('price of dorawa product')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('productname')
                .setDescription('name of the product')
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
        ).addIntegerOption(option =>
            option.setName('orderid')
                .setDescription('order id (eg 12502)')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('email')
                .setDescription('email address where receipt will be sent')
                .setRequired(true)
        ),
    run: async ({interaction}) => {
        if(await log.logCheckUser(interaction, authUtil, "dorawastore.pl")) {
            log.sendWait(interaction);
            const email = interaction.options.getString("email");
            const url = interaction.options.getString("url");
            const firstname = interaction.options.getString('firstname');
            const lastname = interaction.options.getString("lastname");
            const address = interaction.options.getString("address");
            const city = interaction.options.getString("city");
            const postcode = interaction.options.getString("postcode");
            const orderid = interaction.options.getInteger("orderid");
            log.logCommand(interaction, email, url, "dorawa");

            const productPriceText = String(interaction.options.getNumber("price")).replaceAll(',', '.');
            const productPriceConverted = parseFloat(productPriceText);
            let shippingPrice = 0;
            if (productPriceConverted < 500)
                shippingPrice = 16.99;

            const totalPrice = productPriceConverted + shippingPrice;
            const roundedTotalPrice = totalPrice.toFixed(2);

            const splitUrl = url.split("/");
            const id = splitUrl[splitUrl.length - 1];
            const shippingPriceStr = shippingPrice.toFixed(2).replace(".", ",");
            const productPriceStr = productPriceConverted.toFixed(2).replace(".", ",");
            const totalPriceStr = roundedTotalPrice.replace(".", ",");
            const subject = "Potwierdzenie zamówienia nr: " + orderid;
            const replacedHtmlContent = readHtmlContent("dorawa.html")
                .replaceAll("@id", id)
                .replaceAll("@product", interaction.options.getString("productname"))
                .replaceAll("@postalcode", postcode)
                .replaceAll("@firstname", firstname)
                .replaceAll("@lastname", lastname)
                .replaceAll("@address", address)
                .replaceAll("@price", productPriceStr)
                .replaceAll("@shippingprice", shippingPriceStr)
                .replaceAll("@city", city)
                .replaceAll("@totalprice", totalPriceStr);
            await sendEmail(subject, replacedHtmlContent, email, "dorawastore");
            log.sendConfirm(interaction);
        }
    }
};



