const { SlashCommandBuilder } = require('discord.js');
const { setGuildSetting } = require('../utils/setGuildSetting');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clips')
        .setDescription('Twitch clips settings')
        .addBooleanOption(option => // should these be subcommands?
            option.setName('enabled')
                .setDescription('Enable new clip posts'))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The Discord channel to post new clips'))
        .addStringOption(option => 
            option.setName('twitchchannel')
                .setDescription('Twitch channel to monitor for new clips'))
        ,
    async execute(interaction) {
        if(interaction.user.id != botSettings.botOwnerID) { // TODO - include guild owner and admins
            await interaction.reply({content: `Command restricted to bot owner.`, ephemeral: true});
            return;
        }        
        const clipsEnabled = interaction.options.getBoolean('enabled');
        const clipsDiscordChannel = interaction.options.getChannel('channel');
        const clipsTwitchChannel = interaction.options.getString('twitchchannel');
        const guildId = interaction.guildId;

        if(clipsEnabled !== undefined && clipsEnabled !== null) {
            if(clipsEnabled) {
                await setGuildSetting(guildId, 'checkTwitchClips', true);
                await interaction.reply({ content: `Clip messages enabled`, ephemeral: true});
                console.log(`Enabled clips for guild ${guildId}`);
            }
            else {
                await setGuildSetting(guildId, 'checkTwitchClips', false);
                await interaction.reply({ content: `Clip messages disabled`, ephemeral: true});
                console.log(`Disbaled clips for guild ${guildId}`);
            }
        }
        if(clipsDiscordChannel !== undefined && clipsDiscordChannel !== null) {
            // enable clips setting for guild
            await setGuildSetting(guildId, 'checkTwitchClips', true);            
            // set clips message channel
            await setGuildSetting(guildId, 'discordClipsChannel', interaction.channelId);
            interaction.reply({ content: `Set clips channel to ${clipsDiscordChannel}`, ephemeral: true});
            console.log(`Set clips channel for guild ${guildId} to ${clipsDiscordChannel}`);
            clipsDiscordChannel.send("I'll start posting clips in this channel.");
        }
        if(clipsTwitchChannel !== undefined && clipsTwitchChannel !== null) {
            
            await setGuildSetting(guildId, 'twitchClipsChannel', clipsTwitchChannel);
            console.log(`Set clips user for guild ${guildId} to ${clipsTwitchChannel}`);
            await interaction.reply({ content: `Set twitch channel to https://twitch.tv/${clipsTwitchChannel}`, ephemeral: true});
        }
    },
};
