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

async function getTwitchVideos(twitchUsername, clientId, token) {
    const twitchUserInfo = await getTwitchUserInfo(twitchUsername, clientId, token);
    let url = `https://api.twitch.tv/helix/videos?user_id=${twitchUserInfo.id}&sort=time&type=archive&first=1`;
    const result = await twitchAPI(url, clientId, token);
    return result.data;
}

async function getStreamMakers(videoId, clientId, token) {
    let url = `https://api.twitch.tv/helix/streams/markers?video_id=${videoId}`;
    const result = await twitchAPI(url, clientId, token);
    if(result.error !== undefined && result.error == 'Unauthorized') {
        console.log(`Error getting stream markers: ${result.message}`);
    }
    // console.log(result);
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
module.exports.getTwitchVideos = getTwitchVideos;