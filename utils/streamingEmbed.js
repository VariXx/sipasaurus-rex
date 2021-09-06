const { MessageEmbed } = require('discord.js');
const twitchApi = require('./twitchAPI');
const botSettings = require('../botSettings.json');

async function streamingEmbed(twitchUsername, msgAuthor, botName, botAvatar) {
    try {
        const twitchId = await twitchApi.getChannelID(twitchUsername, botSettings.twitchClientId, botSettings.twitchToken);
        const twitchInfo = await twitchApi.getTwitchUserInfo(twitchId, botSettings.twitchClientId, botSettings.twitchToken);
        const streamTitle = await twitchApi.getStreamTitle(twitchId, botSettings.twitchClientId, botSettings.twitchToken);
        const streamGame = await twitchApi.getCurrentGame(twitchId, botSettings.twitchClientId, botSettings.twitchToken);
        // https://discordjs.guide/popular-topics/embeds.html#embed-preview 

        const returnEmbed = new MessageEmbed()
        .setColor('#1EA8D7') // change this to use event color from channel info
        .setTitle(streamTitle)
        .setURL(`https://twitch.tv/${twitchInfo.display_name}`) // change this to get from chnanel info
        .setAuthor(msgAuthor)
        .setDescription(streamGame)
        .setThumbnail(twitchInfo.profile_image_url)
        .setImage(twitchInfo.offline_image_url) // change this to stream preview
        .setTimestamp()
        .setFooter(`Sent from ${botName}`, botAvatar);
    
        return returnEmbed;
    }
    catch(error) { 
        console.log(error); 
        return undefined;
    }
}

module.exports.streamingEmbed = streamingEmbed;