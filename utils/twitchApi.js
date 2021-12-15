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

async function getTwichClips(twitchUsername, clientId, token) {
    let clipStartTime = new Date();
    clipStartTime.setDate(clipStartTime.getDate() - 30);
    let clipStartTimeISO = clipStartTime.toISOString();
    let clipEndTime = new Date();
    let clipEndTimeISO = clipEndTime.toISOString();

    const twitchUserInfo = await getTwitchUserInfo(twitchUsername, clientId, token);
    let url = `https://api.twitch.tv/helix/clips?broadcaster_id=${twitchUserInfo.id}&started_at=${clipStartTimeISO}&ended_at=${clipEndTimeISO}`;
    console.log(url);
    const result = await twitchAPI(url, clientId, token);
    return result.data;
}

module.exports.getStreamInfo = getStreamInfo;
module.exports.getTwitchUserInfo = getTwitchUserInfo;
module.exports.getTwichClips = getTwichClips;