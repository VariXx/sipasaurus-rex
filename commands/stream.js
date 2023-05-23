const { SlashCommandBuilder } = require('discord.js');
const { setGuildSetting } = require('../utils/setGuildSetting');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stream')
        .setDescription('change stream notification settings')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('enable stream notifications'))
        .addChannelOption(option =>
            option.setName('discordchannel')
                .setDescription('Discord channel to send stream notifications'))
        .addStringOption(option =>
            option.setName('user')
                .setDescription('Discord user to monitor for twitch live notifications. Use "all" for all users.'))
        .addBooleanOption(option =>
            option.setName('mention')
                .setDescription('Enable or disable mentioning role in live notifications'))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to mention'))
        ,
    async execute(interaction) {
        if(interaction.user.id != botSettings.botOwnerID) { // TODO - include guild owner and admins
            await interaction.reply({content: `Command restricted to bot owner.`, ephemeral: true});
            return;
        }
        // console.log(interaction);
        const guildId = interaction.guild.id;
        const liveEnabled = interaction.options.getBoolean('enabled');
        const discordChannel = interaction.options.getChannel('discordchannel');
        const twitchUser = interaction.options.getString('user');
        const mentionEnabled = interaction.options.getBoolean('mention');
        const mentionRole = interaction.options.getRole('role');

        if(liveEnabled !== undefined && liveEnabled !== null) {
            if(liveEnabled) {
                await setGuildSetting(guildId, 'checkTwitchClips', true);
                await interaction.reply({ content: `Enabled stream notifications.`, ephemeral: true});
                console.log(`Enabled stream notifcations for guild ${guildId}`);
            }
            else {
                await setGuildSetting(guildId, 'checkTwitchClips', false);
                await interaction.reply({ content: `Disbaled stream notifications. Now I'm bored.`, ephemeral: true});
                console.log(`Disbaled stream notifcations for guild ${guildId}`);
            }
        }

        if(discordChannel !== undefined && discordChannel !== null) {
            await setGuildSetting(guildId, 'notificationChannelId', interaction.channelId); 
            await interaction.reply({ content: `Set stream live notifications channel to ${discordChannel} (ID: ${discordChannel.id})`, ephemeral: true});
            console.log(`Set stream notifications channel for guild ${guildId} to ${discordChannel.id}`);
        }       

        if(twitchUser !== undefined && twitchUser !== null) {
            if(twitchUser == "all") {
                await setGuildSetting(guildId, 'watchedUserId', 'all');
                await interaction.reply({ content: `Set twitch live notifications for all users`, ephemeral: true});
                console.log(`Set stream notifications for guild ${guildId} for all users`);
            }
            else {
                await setGuildSetting(guildId, 'watchedUserId', twitchUser);
                await interaction.reply({ content: `Set twitch live notifications for ${twitchUser}`, ephemeral: true});
                console.log(`Set stream notifications for guild ${guildId} for ${twitchUser}`);                
            }   
        }

        if(mentionEnabled !== undefined && mentionEnabled !== null) {
            if(!mentionEnabled) {
                await setGuildSetting(guildId, 'roleToPing', 'none');
                await interaction.reply({ content: `Disbaled role mentions for stream notifications`, ephemeral: true});
                console.log(`Disbaled role mentions for stream notifications for guild ${guildId}`);
            }
            else {
                await interaction.reply({ content: `Please set a role to enable role mentions`, ephemeral: true});
            }
        }

        if(mentionRole !== undefined && mentionRole !== null) {
            await setGuildSetting(guildId, 'roleToPing', mentionRole);
            await interaction.reply({ content: `Set ${mentionRole} to live notifications mention role`, ephemeral: true});
            console.log(`Set ${mentionRole} to live notifications mention role for guild ${guildId}`);
        }
    },
};
