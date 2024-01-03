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

async function getUserTokens(userId) {
    try {
        // Find the user by ID
        const user = await User.findOne({ userId });

        // If the user doesn't exist, return 0 tokens
        if (!user) {
            return 0;
        }

        // Return the user's tokens
        const tokens = user.tokens;
        return tokens || 0;
    } catch (error) {
        console.error(`Error fetching user tokens: ${error}`);
        throw error; // Propagate the error to handle it in the calling function
    }
}

module.exports = { addTokens, getUserTokens };
