const mongoose = require('mongoose');
const User = require('../models/user');

async function addTokens(id, tokens) {
    try {
        console.log('Connected to the database');

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

        console.log('User and tokens saved successfully');
    } catch (error) {
        console.log(`Error: ${error}`);
    } finally {
        console.log('Connection closed');
    }
}

async function addLifetime(userId, duration) {
    try {
        console.log('Connected to the database');

        // Find the user by ID
        let user = await User.findOne({ userId });

        // If the user doesn't exist, create a new user
        if (!user) {
            user = new User({ userId });
        }

        // Calculate the expiration time by adding the duration to the current date
        const expirationTime = new Date(Date.now() + duration);

        // If the user already has a lifetime, add the new duration to it
        if (user.lifetime) {
            user.lifetime = new Date(user.lifetime.getTime() + duration);
        } else {
            // If the user doesn't have a lifetime, set it to the new expiration time
            user.lifetime = expirationTime;
        }

        // Save the user to the database using the standard save method
        await user.save();

        console.log('User and lifetime saved successfully');
    } catch (error) {
        console.log(`Error: ${error}`);
    } finally {
        console.log('Connection closed');
    }
}
async function swichBlacklist(userId) {
    try {
        console.log('Connected to the database');

        // Find the user by ID
        let user = await User.findOne({ userId });

        // If the user doesn't exist, create a new user
        if (!user) {
            user = new User({ userId });
        }

        // Calculate the expiration time by adding the duration to the current date
        user.blacklist = !user.blacklist;

        // Save the user to the database using the standard save method
        await user.save();

        console.log('User and blacklist saved successfully');
    } catch (error) {
        console.log(`Error: ${error}`);
    } finally {
        console.log('Connection closed');
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

        // If the user doesn't exist or has an expired license, return false
        if (!user || (user.lifetime && user.lifetime < Date.now())) {
            return false;
        }

        // If the user has an active license, return true
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

module.exports = { addTokens, getUserTokens, getUserLifetime, addLifetime, isUserLicensed, swichBlacklist, getUserBlacklist };
