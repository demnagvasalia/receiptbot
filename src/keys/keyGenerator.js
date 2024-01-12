const Key = require('../models/key'); // Check the path to the Key model
const random = require('../utils/randomUtil'); // Check the path to the Key model

async function generateKey(duration, tokens) {
    try {
        const key = random.generateRandomKey();

        const newKey = new Key({
            key,
            duration,
            tokens,
        });

        await newKey.save();
        return key;
    } catch (error) {
        throw error;
    }
}
module.exports = { generateKey };