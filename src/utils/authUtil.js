const db = require('../utils/dbUtil');
function checkId(id) {
    const list = ["719905507871162428", "1209604121108414595", "1021452764246716416", "818035541450686485", "520903087074836483", "1176593922328367155", "868450807530537000", "569437615896526859", "593355521730412555", "927279251227549786", "942474230841348136"]
    return list.includes(id);
}
async function checkTokens(id) {
    const tokens = await db.getUserTokens(id);
    const license = await db.isUserLicensed(id);
    return (license === true);
}
async function checkBlacklist(id) {
    return await db.getUserBlacklist(id);
}
function checkChannelId(id) {
    return id === "1189301429819670700" || id === "1214602044770484286" || id === "1206366421198573661" || id === "1205274021365551145" || id === "1195411194794741834" || id === "1193237087261048842" || id === "1187185389526589480" || id === "1188141184451870733" || id === "942386042751840337";
}
module.exports = { checkId, checkTokens, checkChannelId, checkBlacklist };