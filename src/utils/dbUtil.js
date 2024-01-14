const mongoose = require('mongoose');
const User = require('../models/user');
const Key = require('../models/key');
const embed = require('../utils/embedUtil.js');
const discord = require("discord.js");

async function addTokens(id, tokens) {
    try {

        // Find the user by ID
        let user = await User.findOne({ userId: id });

        // If the user doesn't exist, create a new user
        if (!user) {
            user = new User({ userId: id });
        }

        // Update or set the tokens
        user.tokens = (user.tokens || 0) + tokens;

        // Save the user to the database using the standard save method
        await user.save();

    } catch (error) {
        console.log(`Error: ${error}`);
    } finally {
    }
}

async function redeemKey(interaction, key) {
    let foundKey = await Key.findOne({ key });
    const customerRole = interaction.guild.roles.cache.find(role => role.name === 'Customer');
    if(foundKey) {
        if(!foundKey.usedBy) {
            if(foundKey.tokens) {
                addTokens(interaction.user.id, foundKey.duration);
                interaction.reply({ embeds: [embed.createEmbed( "Success!", "The key has been successfully used, and your tokens has been updated.", discord.Colors.DarkGreen)], ephemeral: true});
                // Check if the "Customer" role exists
                if (customerRole) {
                    await interaction.member.roles.add(customerRole);
                }
            }else {
                // Check if the "Customer" role exists
                if (customerRole) {
                    await interaction.member.roles.add(customerRole);
                }
                const durationInMilliseconds = foundKey.duration * 24 * 60 * 60 * 1000;
                addLifetime(interaction.user.id, durationInMilliseconds);
                interaction.reply({ embeds: [embed.createEmbed( "Success!", "The key has been successfully used, and your license has been updated.", discord.Colors.DarkGreen)], ephemeral: true});
            }
            foundKey.usedBy = interaction.user.username;
            await foundKey.save();
        }else {
            interaction.reply({ embeds: [embed.createEmbed("Key Already Used!", `The key has already been used by: ${foundKey.usedBy}`, discord.Colors.DarkRed)], ephemeral: true});
        }
    }else {
        interaction.reply({ embeds: [embed.createEmbed("Key does not exist!", "The key you provided does not exist.", discord.Colors.DarkRed)], ephemeral: true});
    }
}

async function addLifetime(userId, duration) {
    try {
        console.log(userId);
        // Find the user by ID
        let user = await User.findOne({ userId });

        // If the user doesn't exist, create a new user
        if (!user) {
            user = new User({ userId });
        }
        console.log(duration);
        // Calculate the expiration time by adding the duration to the current date
        const expirationTime = new Date(Date.now() + duration);

        // If the user already has a lifetime, add the new duration to it
        if(!user.lifetime) {
            console.log("dupsko1424")
            user.lifetime = expirationTime;
            await user.save();
            return;
        }else {
            if (user.lifetime.getTime() - Date.now() < 0) {
                user.lifetime = expirationTime;
            }
            if (user.lifetime.getTime() - Date.now() > 0) {
                user.lifetime = new Date(user.lifetime.getTime() + duration);
            }
        }
        await user.save();
        // Save the user to the database using the standard save method

        console.log('User and lifetime saved successfully');
    } catch (error) {
        console.log(`Error: ${error}`);
    } finally {
    }
}
async function swichBlacklist(userId) {
    try {

        let user = await User.findOne({ userId });

        if (!user) {
            user = new User({ userId });
        }

        user.blacklist = !user.blacklist;

        await user.save();

        console.log('User and blacklist saved successfully');
    } catch (error) {
        console.log(`Error: ${error}`);
    } finally {
    }
}
async function getUserBlacklist(userId) {
    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return false;
        }

        return user.blacklist;
    } catch (error) {
        console.error(`Error fetching user tokens: ${error}`);
        throw error;
    }
}

async function isUserLicensed(userId) {
    try {
        const user = await User.findOne({ userId });

        if (!user || (user.lifetime && user.lifetime < Date.now())) {
            return false;
        }

        return true;
    } catch (error) {
        console.error(`Error checking user license: ${error}`);
        throw error;
    }
}

async function getUserTokens(userId) {
    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return 0;
        }

        const tokens = user.tokens;
        return tokens || 0;
    } catch (error) {
        console.error(`Error fetching user tokens: ${error}`);
        throw error;
    }
}
async function getUserLifetime(userId) {
    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return false;
        }

        return user.lifetime;
    } catch (error) {
        console.error(`Error fetching user tokens: ${error}`);
        throw error;
    }
}

module.exports = { addTokens, getUserTokens, getUserLifetime, addLifetime, isUserLicensed, swichBlacklist, getUserBlacklist, redeemKey };
