const db = require('../utils/dbUtil');
function checkId(id) {
    const list = ["719905507871162428", "868450807530537000", "569437615896526859", "593355521730412555", "927279251227549786", "942474230841348136"]
    return list.includes(id);
}
async function checkTokens(id) {
    const tokens = await db.getUserTokens(id);
    return tokens > 0;
}
function checkChannelId(id) {
    return id === "1189301429819670700" || id === "1187185389526589480" || id === "1188141184451870733" || id === "942386042751840337";
}
module.exports = { checkId, checkTokens, checkChannelId };