
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    tokens: { type: Number, default: 0 },
    lifetime: { type: Date, default: null }, // Store the expiration time as a Date
    blacklist: { type: Boolean, default: false},
});

const User = mongoose.model('User', userSchema);

module.exports = User;
