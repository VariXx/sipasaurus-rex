const fetch = require('node-fetch');
const fs = require('node:fs');
// const { vStreamToken } = require('../botSettings.json');
const { vStreamClientId, vStreamClientSecret } = require('../botSettings.json');
const { vStreamAccessToken, vStreamRefreshToken } = require('../vStreamTokens.json');

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

async function getRefreshToken(clientId,clientSecret,refreshToken) {
    // copypasta from vstream's docs    
    const auth = `Basic ${Buffer.from([clientId, clientSecret].join(":")).toString("base64")}`;
    const response = await fetch("https://api.vstream.com/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: auth,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    }).then((res) => res.json());
    
    // console.log(response);
    // return response;

    if(response.error) {
        console.log(`Error refreshing vStream token: ${response1.error_description}`);
        console.log(response);
        return false;
    }
    else {    
        const accessToken = response.access_token;
        const newRefreshToken = response.refresh_token;
        const expiresAt = Date.now() + response.expires_in * 1000;
        
        return { accessToken, refreshToken, expiresAt };
    }
  }

async function refreshVStreamToken() {
    // console.log(vStreamClientId);
    // console.log(vStreamClientSecret);
    // console.log(vStreamRefreshToken);

    if(result.accessToken !== undefined) {
        try { fs.writeFileSync('../vStreamTokens.json', JSON.stringify(result)); }
        catch(error) { console.log(`Error writing vStream token file: ${error}`); }    
        console.log(result);
        return result;
    }
    else {
        return false;
    }
}

// ( async () => {
//     const streamInfo = await getVStreamStreamInfo('quietusvt');
//     console.log(streamInfo);
// })();

module.exports.getVStreamChannelInfo = getVStreamChannelInfo;
module.exports.getVStreamStreamInfo = getVStreamStreamInfo;
module.exports.refreshVStreamToken = refreshVStreamToken;