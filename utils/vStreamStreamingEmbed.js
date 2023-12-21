const { EmbedBuilder, escapeMarkdown } = require('discord.js');
// const twitchApi = require('./twitchApi');
const vStreamAPI = require('./vStreamAPI');

async function vStreamStreamEmbedMsg(vStreamUsername) {
    try {
        const channelInfo = await vStreamAPI.getVStreamChannelInfo(vStreamUsername);
        const streamInfo = await vStreamAPI.getVStreamStreamInfo(vStreamUsername);
        // console.log(streamInfo);
        const channelImage = await vStreamAPI.getVStreamProfileImage(vStreamUsername);
        let channelBanner = await vStreamAPI.getVStreamBannerImage(vStreamUsername);
        if(channelBanner.status === 'MISSING_BANNER') { channelBanner = channelImage } 
        let urlTimestamp = Date.now();
        // const thumbnailUrl = streamInfo.thumbnail_url.replace(`{width}x{height}.jpg`, `1920x1080.jpg?${urlTimestamp}`);
        let streamTitle = escapeMarkdown(streamInfo.title);
        let channelUrl = `https://vstream.com/c/@${vStreamUsername}`;
        let streamDescription = ' ';
        if(streamInfo.description) { streamDescription = streamInfo.description; } // description value is null if not set

        const returnEmbed = new EmbedBuilder()
        .setColor('#1EA8D7') // change this to use event color from channel info
        .setTitle(streamTitle)
        .setURL(channelUrl) 
        .setAuthor({
            name: `${channelInfo.displayName} is live`,
            icon_url: channelImage,
            url: channelUrl
        })
        .setDescription(streamDescription)
        .setThumbnail(channelImage)
        .setImage(channelBanner) // change this to stream preview
        .setTimestamp();
        // .setFooter(`Last updated`);
    
        return returnEmbed;
    }
    catch(error) { 
        console.log(error); 
        return undefined;
    }
}

async function vStreamOfflineEmbedMsg(vStreamUsername) {
    try {
        const channelInfo = await vStreamAPI.getVStreamChannelInfo(vStreamUsername);        
        let channelUrl = `https://vstream.com/c/@${vStreamUsername}`;
        const channelImage = await vStreamAPI.getVStreamProfileImage(vStreamUsername);
        let channelBanner = await vStreamAPI.getVStreamBannerImage(vStreamUsername);
        if(channelBanner.status === 'MISSING_BANNER') { channelBanner = channelImage } 

        let vodTitle = 'Stream offline';        
        let vodUrl = channelUrl;
        let vodThumbnail = channelBanner;
        
        // if(twitchVideos[0] !== undefined) { // archives not disabled
        //     vodUrl = twitchVideos[0].url;
        //     vodThumbnail = twitchVideos[0].thumbnail_url.replace('%{width}x%{height}', '1920x1080');
        //     vodTitle = twitchVideos[0].title;
        //     // const streamMarkers = await twitchApi.getStreamMarkers(twitchVideos[0].id, botSettings.twitchClientId, botSettings.twitchToken);
        //     // console.log(streamMarkers);
        // }

        const returnEmbed = new EmbedBuilder() 
        .setColor('#3d3d3f') 
        .setTitle(vodTitle, channelImage, vodUrl)
        .setURL(vodUrl) // change this to get from twitchInfo 
        // .setAuthor(`${msgAuthor} was live`, twitchInfo.profile_image_url, channelUrl)
        .setAuthor({
            name: `${channelInfo.displayName} was live`,
            icon_url: channelImage,
            url: channelUrl
        })
        .setDescription(`${channelInfo.displayName} is offline`)
        .setThumbnail(channelImage)
        .setImage(vodThumbnail)
        .setTimestamp();
        // .setFooter(`Last updated`);
    
        return returnEmbed;
    }
    catch(error) {
        console.log(error);
        return undefined;
    }
}

module.exports.vStreamStreamEmbedMsg = vStreamStreamEmbedMsg;
module.exports.vStreamOfflineEmbedMsg = vStreamOfflineEmbedMsg;