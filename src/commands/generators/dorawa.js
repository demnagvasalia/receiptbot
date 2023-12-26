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

module.exports = {
    data: new SlashCommandBuilder().setName('dorawa').setDescription('(polish) Generates a dorawa receipt and sends it directly to your email')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('url of dorawa product (eg https://dorawastore.pl/pl/p/Nike-SB-Dunk-Low-White-Gum/1715)')
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
        if(!interaction.channel) {
            interaction.reply({ embeds: [embed.createEmbed("Can not use on dms", "please use #cmd",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(!authUtil.checkChannelId(interaction.channel.id)) {
            interaction.reply({ embeds: [embed.createEmbed("Wrong channel", "please use #cmd",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(!interaction.options.getString("url").toString().startsWith("https://dorawastore.pl/")) {
            interaction.reply({ embeds: [embed.createEmbed("Wrong url", "please use dorawa url",discord.Colors.DarkRed)], ephemeral: true});
            return;
        }
        if(await authUtil.checkTokens(interaction.user.id)) {
            interaction.reply({ embeds: [embed.createEmbed("Please wait", "we are generating your receipt. You will be notified on dms. It should take up to 30 seconds",discord.Colors.Aqua)], ephemeral: true});
            console.log(interaction.user.id + " has used command dorawa")
            const url = interaction.options.getString("url");
            const firstname = interaction.options.getString('firstname');
            const lastname = interaction.options.getString("lastname");
            const address = interaction.options.getString("address");
            const city = interaction.options.getString("city");
            const postcode = interaction.options.getString("postcode");
            const orderid = interaction.options.getInteger("orderid");
            const email = interaction.options.getString("email");
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
                const productName = $('h1[class="name"]:first').text().trim();
                const productPrice = $('em[class="main-price"]:first').text();
                const productPriceConverted = parseFloat(productPrice.replaceAll(",", ".").replaceAll(" ", "").replaceAll("zł", ""));
                let shippingPrice = 0;
                if (productPriceConverted < 500)
                    shippingPrice = 16.99;

                const totalPrice = productPriceConverted + shippingPrice;
                const roundedTotalPrice = totalPrice.toFixed(2);

                const splitUrl = url.split("/");
                const id = splitUrl[splitUrl.length - 1];
                const shippingPriceStr = String(shippingPrice.toFixed(2)).replaceAll(".", ",");
                const productPriceStr = String(productPriceConverted.toFixed(2)).replaceAll(".", ",");
                const totalPriceStr = String(roundedTotalPrice).replaceAll(".", ",");

                const subject = "Potwierdzenie zamówienia nr: " + orderid;
                const replacedHtmlContent = readHtmlContent("dorawa.html")
                    .replaceAll("@id", id)
                    .replaceAll("@product", productName)
                    .replaceAll("@postalcode", postcode)
                    .replaceAll("@firstname", firstname)
                    .replaceAll("@lastname", lastname)
                    .replaceAll("@address", address)
                    .replaceAll("@price", productPriceStr)
                    .replaceAll("@shippingprice", shippingPriceStr)
                    .replaceAll("@city", city)
                    .replaceAll("@totalprice", totalPriceStr);
                await db.addTokens(interaction.user.id, -1);
                await sendEmail(subject, replacedHtmlContent, email, "dorawastore");

                interaction.user.send({ embeds: [embed.createEmbed("Email sent", `Your balance has been reduced to: ${await getUserTokens(interaction.user.id)}`,discord.Colors.DarkGreen)]});

            }).catch((error) => {
                console.error('Error fetching data:', error.message);
            });
        }else
            interaction.reply({ embeds: [embed.createEmbed("Balance", "You dont have enough balance to use that command.",discord.Colors.DarkRed)], ephemeral: true});
    }
};



