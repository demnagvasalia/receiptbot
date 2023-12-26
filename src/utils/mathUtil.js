function getRandomDigit() {
    return Math.floor(Math.random() * 10);
}

// Generate 10 random digits
function generateRandomDigits(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += getRandomDigit();
    }
    return result;
}

module.exports = {generateRandomDigits};