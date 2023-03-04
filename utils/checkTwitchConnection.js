const { getStreamInfo } = require('./twitchApi');
const botSettings = require('../botSettings.json');

async function checkTwitchConnection() {
    // let twitchConnectionFailed = false;
    let twitchConnectionCheck = false; 
    console.log(`Testing twitch connection...`);
    try {
        const twitchConnection = await getStreamInfo('varixx');
        if(twitchConnection === false) { 
            // twitchConnectionFailed = true;
            twitchConnectionCheck = false; 
        }
        else {
            twitchConnectionCheck = true; 
        }
    }
    catch(error) {
        console.log(`Error testing twitch connection.`);
        // twitchConnectionFailed = true;
        twitchConnectionCheck = false; 
    }
    // if(twitchConnectionFailed) {
    if(!twitchConnectionCheck) {
        const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
        console.error(`Twitch token invalid. Renew with URL below.`);
        console.log(tokenUrl);
    }
    else { console.log(`Success!`); }
    return twitchConnectionCheck;
}

module.exports.checkTwitchConnection = checkTwitchConnection;
