const fs = require('fs');
const path = require('path');

function readHtmlContent(fileName) {
    try {
        const filePath = path.join(__dirname, `../emails/${fileName}`);
        const htmlContent = fs.readFileSync(filePath, 'utf-8');
        return htmlContent;
    } catch (error) {
        console.error(`Error reading HTML file (${fileName}): ${error.message}`);
        return null;
    }
}
module.exports = { readHtmlContent };