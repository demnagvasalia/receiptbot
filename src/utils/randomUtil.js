function getRandomDigit() {
    return Math.floor(Math.random() * 10);
}

function generateRandomDigits(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += getRandomDigit();
    }
    return result;
}
function generateRandomChars(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }

    return result;
}
function generateRandomKey() {
    let result = `${generateRandomChars(5)}-${generateRandomChars(5)}-${generateRandomChars(5)}-${generateRandomChars(5)}-${generateRandomChars(5)}`;
    return result;
}


module.exports = {generateRandomDigits, generateRandomChars, generateRandomKey };