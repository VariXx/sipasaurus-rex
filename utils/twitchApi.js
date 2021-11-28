const fetch = require('node-fetch');

async function twitchAPI(url, clientId, token) {
    let result = await fetch(url, {method: 'get', headers: {'Client-ID': clientId, 'Authorization': `Bearer ${token}`}});
    result = await result.json();
    return result;
}

async function getStreamInfo(channelName, clientId, token) {
    let url = `https://api.twitch.tv/helix/streams?user_login=${channelName}`;
    const result = await twitchAPI(url, clientId, token)
    return result.data[0];
}

async function getTwitchUserInfo(twitchUsername, clientId, token) {
    let url = `https://api.twitch.tv/helix/users?login=${twitchUsername}`;
    const result = await twitchAPI(url, clientId, token);
    return result.data[0];
}

module.exports.getStreamInfo = getStreamInfo;
module.exports.getTwitchUserInfo = getTwitchUserInfo;