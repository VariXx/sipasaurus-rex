const fetch = require('node-fetch');
const botSettings = require('../botSettings.json');

// async function twitchAPI(url, clientId, token) {
async function twitchAPI(url) {
    let result = await fetch(url, {method: 'get', headers: {'Client-ID': botSettings.twitchClientId, 'Authorization': `Bearer ${botSettings.twitchToken}`}});
    result = await result.json();
    return result;
}

// async function getStreamInfo(channelName, clientId, token) {
async function getStreamInfo(channelName) {
    let url = `https://api.twitch.tv/helix/streams?user_login=${channelName}`;
    // const result = await twitchAPI(url, clientId, token);
    const result = await twitchAPI(url);
    return result.data[0];
}

// async function getTwitchUserInfo(twitchUsername, clientId, token) {
async function getTwitchUserInfo(twitchUsername) {
    let url = `https://api.twitch.tv/helix/users?login=${twitchUsername}`;
    // const result = await twitchAPI(url, clientId, token);
    const result = await twitchAPI(url);
    return result.data[0];
}

// async function getTwichClips(twitchUsername, clientId, token) {
async function getTwichClips(twitchUsername) {
    let clipStartTime = new Date();
    clipStartTime.setDate(clipStartTime.getDate() - 30);
    let clipStartTimeISO = clipStartTime.toISOString();
    let clipEndTime = new Date();
    let clipEndTimeISO = clipEndTime.toISOString();

    // const twitchUserInfo = await getTwitchUserInfo(twitchUsername, clientId, token);
    const twitchUserInfo = await getTwitchUserInfo(twitchUsername);
    let url = `https://api.twitch.tv/helix/clips?broadcaster_id=${twitchUserInfo.id}&started_at=${clipStartTimeISO}&ended_at=${clipEndTimeISO}`;
    // const result = await twitchAPI(url, clientId, token);
    const result = await twitchAPI(url);
    return result.data;
}

// async function getTwitchVideos(twitchUsername, clientId, token) {
async function getTwitchVideos(twitchUsername) {
    // const twitchUserInfo = await getTwitchUserInfo(twitchUsername, clientId, token);
    const twitchUserInfo = await getTwitchUserInfo(twitchUsername);
    let url = `https://api.twitch.tv/helix/videos?user_id=${twitchUserInfo.id}&sort=time&type=archive&first=1`;
    // const result = await twitchAPI(url, clientId, token);
    const result = await twitchAPI(url);
    return result.data;
}

// async function getStreamMarkers(videoId, clientId, token) {
async function getStreamMarkers(videoId) {
    let url = `https://api.twitch.tv/helix/streams/markers?video_id=${videoId}`;
    // const result = await twitchAPI(url, clientId, token);
    const result = await twitchAPI(url);
    console.log(result);
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
module.exports.getStreamMarkers = getStreamMarkers;
module.exports.getTwitchVideos = getTwitchVideos;