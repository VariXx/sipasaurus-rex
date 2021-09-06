const fetch = require('node-fetch');

async function twitchAPI(url, clientId, token) {
    let result = await fetch(url, {method: 'get', headers: {'Client-ID': clientId, 'Authorization': `Bearer ${token}`}});
    result = await result.json();
    return result;
}

async function getChannelID(channelName, clientId, token) {
    let url = `https://api.twitch.tv/helix/users?login=${channelName}`;
    result = await twitchAPI(url, clientId, token)
    .catch(error => {console.log(`Twitch API erorr: ${error}`);});
    if(result.data.length > 0 && 'id' in result.data[0]) {
        return result.data[0].id;
    }
    else {
        return false;
    }
}

async function getCurrentGame(channelID, clientId, token) {
    // this uses API v5 because helix does not show game when stream is offline
    let url = `https://api.twitch.tv/kraken/channels/${channelID}`;
    let result = await fetch(url, {method: 'get', headers: {'Accept': 'application/vnd.twitchtv.v5+json', 'Client-ID': clientId, 'Authorization': `OAuth ${token}`}});
    result = await result.json();
    if('game' in result) {
        return result.game;
    }
    else {
        return false;
    }
}

async function getStreamTitle(channelID, clientId, token) {
    // this uses API v5 because helix does not show game when stream is offline
    let url = `https://api.twitch.tv/kraken/channels/${channelID}`;
    let result = await fetch(url, {method: 'get', headers: {'Accept': 'application/vnd.twitchtv.v5+json', 'Client-ID': clientId, 'Authorization': `OAuth ${token}`}});
    result = await result.json();
    if('status' in result) {
        return result.status;
    }
    else {
        return false;
    }
}

async function getGameName(findGameID) {
    // you'll eventually need this for helix because it gives the game ID and not the game name 
    let url = `https://api.twitch.tv/helix/games?id=${findGameID}`;
    result = await twitchAPI(url)
    .catch(error => {console.log(`Twitch API erorr: ${error}`);});
    if(result.data.length > 0 && 'name' in result.data[0]) {
        return result.data[0].name;
    }
    else {
        return false;
    }
}

async function getTwitchUserInfo(userId, clientId, token) {
    let url = `https://api.twitch.tv/helix/users?id=${userId}`;
    const result = await twitchAPI(url, clientId, token);
    return result.data[0];
}

module.exports.getChannelID = getChannelID;
module.exports.getCurrentGame = getCurrentGame;
module.exports.getStreamTitle = getStreamTitle;
module.exports.getTwitchUserInfo = getTwitchUserInfo;