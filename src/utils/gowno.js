const axios = require('axios');
const http = require('http');
const https = require('https');

// Create an Axios instance with a custom configuration
const axiosInstance = axios.create();

// Add an interceptor to set the Authorization header
axiosInstance.interceptors.request.use(config => {
    // Modify the config to add the Authorization header
    config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

function sendMessage(token, channel_id, message, proxy) {
    const url = `https://discord.com/api/v8/channels/${channel_id}/messages`;
    const data = { content: message };

    // Use proxy if provided
    const proxyConfig = proxy ? { httpAgent: new http.Agent({ proxy: proxy }), httpsAgent: new https.Agent({ proxy: proxy }) } : {};

    // Set the token as a custom property for the interceptor to use
    axiosInstance.token = token;

    axiosInstance.post(url, data, {
        ...proxyConfig
    })
        .then(response => {
            console.log(`${response.status}   ${token}`);
        })
        .catch(error => {
            if (error.response) {
                console.error(`HTTP Error: ${error.response.status}`);
                console.error(`Response content: ${JSON.stringify(error.response.data)}`);
            } else if (error.code === 'ENOTFOUND') {
                console.error('Proxy Error: Unable to connect to the proxy');
                process.exit(1);  // Exit the script if unable to connect to the proxy
            } else {
                console.error(`Error sending message with token ${token}: ${error.message}`);
            }
        });
}
function sendBatch(tokens, channel_id, message, proxies) {
    tokens.forEach((token, index) => {
        sendMessage(token, channel_id, message, proxies[index]);
    });
}

function readProxies(filename = 'proxies.txt') {
    const fs = require('fs');
    const proxiesList = fs.readFileSync(filename, 'utf-8').split('\n').filter(Boolean);
    return proxiesList;
}

const fs = require('fs');
const tokensList = fs.readFileSync('tokens.txt', 'utf-8').split('\n').filter(Boolean);

// Read proxies from proxies.txt
const proxiesList = readProxies();

// Create a cyclic iterator for tokens
let tokenIterator = 0;

setInterval(() => {

    // Choose the next token in sequence
    const token = tokensList[tokenIterator % tokensList.length];

    // Choose a random proxy from the list
    const proxy = proxiesList[Math.floor(Math.random() * proxiesList.length)];

    // Check if a proxy is available
    const proxyConfig = proxy ? proxy.split(':') : null;
    const proxyString = `http://${proxyConfig[2]}:${proxyConfig[3]}@${proxyConfig[0]}:${proxyConfig[1]}`;

    sendMessage(token, '1110139975024001114', 'darmowe potwierdzenia -> discord.gg/where2cop', proxyString);

    tokenIterator++;

    // Sleep for a short time between batches (adjust the delay if needed)
    setTimeout(() => {}, 1000);

}, 1000); // Execute the loop every 5 seconds
