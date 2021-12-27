const { MessageEmbed, Util } = require('discord.js');
const twitchApi = require('./twitchApi');
const botSettings = require('../botSettings.json');

async function streamingEmbed(twitchUsername, msgAuthor) {
    try {
        const twitchInfo = await twitchApi.getTwitchUserInfo(twitchUsername, botSettings.twitchClientId, botSettings.twitchToken);
        const streamInfo = await twitchApi.getStreamInfo(twitchUsername, botSettings.twitchClientId, botSettings.twitchToken);
        let urlTimestamp = Date.now();
        const thumbnailUrl = streamInfo.thumbnail_url.replace(`{width}x{height}.jpg`, `1920x1080.jpg?${urlTimestamp}`);
        let streamTitle = Util.escapeMarkdown(streamInfo.title);
        let channelUrl = `https://twitch.tv/${twitchInfo.display_name}`;

        const returnEmbed = new MessageEmbed()
        .setColor('#1EA8D7') // change this to use event color from channel info
        .setTitle(streamTitle)
        .setURL(channelUrl) // change this to get from chnanel info
        .setAuthor(`${msgAuthor} is live`, twitchInfo.profile_image_url, channelUrl)
        .setDescription(streamInfo.game_name)
        .setThumbnail(twitchInfo.profile_image_url)
        .setImage(thumbnailUrl) // change this to stream preview
        .setTimestamp()
        .setFooter(`Last updated`);
    
        return returnEmbed;
    }
    catch(error) { 
        console.log(error); 
        return undefined;
    }
}

async function doneStreamingEmbed(twitchUsername, msgAuthor) {
    try {
        const twitchInfo = await twitchApi.getTwitchUserInfo(twitchUsername, botSettings.twitchClientId, botSettings.twitchToken);
        let channelUrl = `https://twitch.tv/${twitchInfo.display_name}`;
        const twitchVideos = await twitchApi.getTwitchVideos(twitchUsername, botSettings.twitchClientId, botSettings.twitchToken);
        const vodUrl = twitchVideos[0].url;
        // console.log(twitchVideos);
        // const streamMarkers = await twitchApi.getStreamMakers(twitchVideos[0].id, botSettings.twitchClientId, botSettings.twitchToken);
        // console.log(streamMarkers);

        const returnEmbed = new MessageEmbed() 
        .setColor('#1EA8D7') // change this to use event color from channel info
        // .setTitle(`${msgAuthor} was live`, twitchInfo.profile_image_url, channelUrl)
        .setTitle(`Click here to view VOD`, twitchInfo.profile_image_url, vodUrl)
        .setURL(vodUrl) // change this to get from chnanel info
        .setAuthor(`${msgAuthor} was live`, twitchInfo.profile_image_url, channelUrl)
        // .setDescription(`Put stream markers here`)
        .setThumbnail(twitchInfo.profile_image_url)
        .setImage(twitchInfo.offline_image_url)
        .setTimestamp()
        .setFooter(`Last updated`);
    
        return returnEmbed;
    }
    catch(error) {
        console.log(`Error updating embed: ${error}`);
        return undefined;
    }
}

module.exports.streamingEmbed = streamingEmbed;
module.exports.doneStreamingEmbed = doneStreamingEmbed;