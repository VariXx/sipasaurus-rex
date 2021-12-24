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
    const result = await twitchAPI(url, clientId, token);
    return result.data;
}

async function getStreamMakers(twitchUsername, clientId, token) {
    const twitchUserInfo = await getTwitchUserInfo(twitchUsername, clientId, token);
    // let url = `https://api.twitch.tv/helix/streams/markers?user_id=${twitchUserInfo.id}`;
    // https://www.twitch.tv/videos/1237325584
    let url = `https://api.twitch.tv/helix/streams/markers?video_id=1237325584`;
    const result = await twitchAPI(url, clientId, token);
    if(result.error !== undefined && result.error == 'Unauthorized') {
        console.log(`Error getting stream markers: ${result.message}`);
    }
    // token url from varibot. sipa does not need all of these scopes. this should be cleaned up and should have it's own client id. 
    // https://id.twitch.tv/oauth2/authorize?client_id=rq2a841j8f63fndu5lnbwzwmbzamoy&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=bits:read+channel:read:redemptions+channel:manage:redemptions+channel:moderate+chat:edit+chat:read+user:edit:broadcast+channel:edit:commercial+user:read:broadcast
    // console.log(result);
    console.log(result.data);
    if(result.data.videos !== undefined && result.data.videos.markers !== undefined) {
        console.log(result.data.videos.markers);
    }
    else {
        console.log(`No marker data`);
    }
    // return result.data;
}

module.exports.getStreamInfo = getStreamInfo;
module.exports.getTwitchUserInfo = getTwitchUserInfo;
module.exports.getTwichClips = getTwichClips;
module.exports.getStreamMakers = getStreamMakers;