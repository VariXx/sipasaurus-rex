const { EmbedBuilder } = require('discord.js');
const version = require('../package.json').version;

async function helpEmbed(requestedBy){
    try {
        const helpEmbed = new EmbedBuilder()
        .setColor('#ffff00')
        // .setTitle('Help')
        .setDescription('Help')
        .addFields([
            { name: 'invite', value: 'Invite URL to send this bot to your Discord server.'},
            // clips
            { name: '\u200B', value: '\u200B' },
            { name: 'clips', value: '\u200B'},
            { name: 'enabled <true/false>', value: 'Enable/disable messsages when a new Twitch clip is created'},
            { name: 'channel <#discord-channel-name>', value: 'Discord channel for clips'},
            { name: 'twitchchannel <twitch channel name>', value: 'Twitch channel to monitor for clips'},
            // twitch
            { name: '\u200B', value: '\u200B' },
            { name: 'twitch', value: '\u200B'},
            { name: 'enabled <true/false>', value: 'Enable/disable messages when channels go live on Twitch'},
            { name: 'discordchannel <#discord-channel-name>', value: 'Discord channel for live notificaions'},
            { name: 'user <@user>', value: 'Discord user (mention them) to monitor for Twitch live notifications'},
            { name: 'mention <true/false>', value: 'Enable/disable mentioning a role in live notifications'},
            { name: 'role <@role>', value: 'Role to mention in live notifications'}       
        ])
        .setTimestamp()
        .setFooter({ text: `Sipasaurus Rex v${version}`});
        return helpEmbed;
    }
    catch(error) {
        console.log(`Error creating help embed: ${error})`);
    }
}

module.exports.helpEmbed = helpEmbed;