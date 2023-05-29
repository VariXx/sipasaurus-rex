const { EmbedBuilder, escapeMarkdown } = require('discord.js');
const twitchApi = require('./twitchApi');

async function streamingEmbed(twitchUsername, msgAuthor) {
    try {
        const twitchInfo = await twitchApi.getTwitchUserInfo(twitchUsername);
        const streamInfo = await twitchApi.getStreamInfo(twitchUsername);
        let urlTimestamp = Date.now();
        const thumbnailUrl = streamInfo.thumbnail_url.replace(`{width}x{height}.jpg`, `1920x1080.jpg?${urlTimestamp}`);
        let streamTitle = escapeMarkdown(streamInfo.title);
        let channelUrl = `https://twitch.tv/${twitchInfo.display_name}`;

        const returnEmbed = new EmbedBuilder()
        .setColor('#1EA8D7') // change this to use event color from channel info
        .setTitle(streamTitle)
        .setURL(channelUrl) // change this to get from twitchInfo 
        .setAuthor({
            name: `${msgAuthor} is live`,
            icon_url: twitchInfo.profile_image_url,
            url: channelUrl
        })
        .setDescription(streamInfo.game_name)
        .setThumbnail(twitchInfo.profile_image_url)
        .setImage(thumbnailUrl) // change this to stream preview
        .setTimestamp();
        // .setFooter(`Last updated`);
    
        return returnEmbed;
    }
    catch(error) { 
        console.log(error); 
        return undefined;
    }
}

async function offlineStreamingEmbed(twitchUsername, msgAuthor) {
    try {
        const twitchInfo = await twitchApi.getTwitchUserInfo(twitchUsername);
        let channelUrl = `https://twitch.tv/${twitchInfo.display_name}`;
        const twitchVideos = await twitchApi.getTwitchVideos(twitchUsername); 
        let vodTitle = 'Stream offline';        
        let vodUrl = channelUrl;
        let vodThumbnail = twitchInfo.profile_image_url;        
        
        if(twitchVideos[0] !== undefined) { // archives not disabled
            vodUrl = twitchVideos[0].url;
            vodThumbnail = twitchVideos[0].thumbnail_url.replace('%{width}x%{height}', '1920x1080');
            vodTitle = twitchVideos[0].title;
            // const streamMarkers = await twitchApi.getStreamMarkers(twitchVideos[0].id, botSettings.twitchClientId, botSettings.twitchToken);
            // console.log(streamMarkers);
        }

        const returnEmbed = new EmbedBuilder() 
        .setColor('#3d3d3f') 
        .setTitle(vodTitle, twitchInfo.profile_image_url, vodUrl)
        .setURL(vodUrl) // change this to get from twitchInfo 
        // .setAuthor(`${msgAuthor} was live`, twitchInfo.profile_image_url, channelUrl)
        .setAuthor({
            name: `${msgAuthor} was live`,
            icon_url: twitchInfo.profile_image_url,
            url: channelUrl
        })
        .setDescription(`${msgAuthor} is offline`)
        .setThumbnail(twitchInfo.profile_image_url)
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

module.exports.streamingEmbed = streamingEmbed;
module.exports.offlineStreamingEmbed = offlineStreamingEmbed;