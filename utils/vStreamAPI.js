const fetch = require('node-fetch');
const { vStreamToken } = require('../botSettings.json');

async function vStreamAPI(url) {
    try {
        const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${vStreamToken}`,
        },
        });
        let result = await response.json();
        if(result) { return result.data; }
        else { console.log(`vStream API error`); }
    }
    catch(error) { console.log(error); }
}

async function getVStreamChannelId(username) {
    let url = `https://api.vstream.com/channels/lookup?username=${username}`;
    const result = await vStreamAPI(url);
    return result.id;
}

async function getVStreamChannelInfo(username) {
    const channelId = await getVStreamChannelId(username);
    let url = `https://api.vstream.com/channels/${channelId}/info`;
    const result = await vStreamAPI(url);
    return result;
}

async function getVStreamStreamInfo(username) {
    const channelId = await getVStreamChannelId(username);
    const url = `https://api.vstream.com/channels/${channelId}/live`;
    const result = await vStreamAPI(url);
    return result; // returns null if not live
}

async function getVStreamVideos(username) {
    const channelId = await getVStreamChannelId(username);
    let url = `https://api.vstream.com/channels/${channelId}/videos`;
    const result = await vStreamAPI(url);
    return result;
}

async function getVStreamVideoInfo(videoId) {
    let url = `https://api.vstream.com/videos/${videoId}`;
    const result = await vStreamAPI(url);
    return result;
}

// ( async () => {
//     const streamInfo = await getVStreamStreamInfo('quietusvt');
//     console.log(streamInfo);
// })();

module.exports.getVStreamChannelInfo = getVStreamChannelInfo;
module.exports.getVStreamStreamInfo = getVStreamStreamInfo;
