const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    duration: { type: Number, required: true },
    tokens: { type: Boolean, required: true },
    usedBy: { type: String, required: false }
});

const Key = mongoose.model('Key', keySchema);

module.exports = Key;