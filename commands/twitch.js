const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuildSetting } = require('../utils/setGuildSetting');
const { getGuildSetting } = require('../utils/getGuildSettings');
const { getTwitchUserInfo } = require('../utils/twitchApi');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('twitch')
        .setDescription('change twitch stream notification settings')
        .addChannelOption(option =>
            option.setName('discordchannel')
                .setDescription('Discord channel to send stream notifications'))
        .addStringOption(option =>
            option.setName('add')
                .setDescription('Add Twitch stream to watch list for live notifications.'))                
        .addStringOption(option =>
            option.setName('remove')
                .setDescription('Remove Twitch stream to watch list for live notifications.'))                
        .addBooleanOption(option =>
            option.setName('mentions')
                .setDescription('Enable or disable mentioning role in live notifications'))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to mention'))
        .setDefaultMemberPermissions(PermissionFlagsBits.MANAGE_GUILD)
        ,
    async execute(interaction) {
        if(interaction.user.id != interaction.guild.ownerId) {
            if(interaction.user.id != botSettings.botOwnerID) {
                await interaction.reply({content: `Command restricted to guild or bot owner.`, ephemeral: true});
                return;
            }
        }
        // console.log(interaction);
        const guildId = interaction.guild.id;
        const discordChannel = interaction.options.getChannel('discordchannel');
        const twitchStream = interaction.options.getString('add');
        const removeTwitchStream = interaction.options.getString('remove');
        const mentionEnabled = interaction.options.getBoolean('mentions');
        const mentionRole = interaction.options.getRole('role');

// TODO - multiple settings at once throws an error. reply at the end of all if statements. 

        if(discordChannel) {
            testMsg = `:white_check_mark: Test`;
            if(botSettings.botIcon) { testMsg = `${botSettings.botIcon}`; }
            try {          
                await discordChannel.send(testMsg);  
                await setGuildSetting(guildId, 'notificationChannelId', discordChannel.id); 
                await interaction.reply({ content: `:white_check_mark: Set stream live notifications channel to ${discordChannel} (ID: ${discordChannel.id}) \nTest message sent to channel.`, ephemeral: true});
                console.log(`Set stream notifications channel for guild ${guildId} to ${discordChannel.id}`);                    
            }
            catch(error) {
                let testMsgError = `Error setting stream notification channel to ${$discordChannel} (${$discordChannel.id}) in guild ${guildId}. \n${error}`;
                console.log(testMsgError);
                await interaction.reply({ content: testMsgError, ephemeral: true});                
            }
        }       

        if(twitchStream) { 
            if(twitchStream.length > 4) {
                // check if it's a valid twitch user 
                const twitchUserCheck = await getTwitchUserInfo(twitchStream);
                if(twitchUserCheck !== undefined) { 
                    // get existing arry from guild setting and add value
                    let twitchStreamsList = await getGuildSetting(guildId, 'twitchStreams');
                    if(twitchStreamsList) {
                        if(twitchStreamsList.includes(twitchStream)) {
                            let returnMsg = `:warning: ${twitchUserCheck.display_name} already exists in streams list`;
                            console.log(returnMsg);
                            await interaction.reply({ content: returnMsg, ephemeral: true});
                        }
                        else {
                            twitchStreamsList.push(twitchStream);
                            let returnMsg = `:white_check_mark: ${twitchUserCheck.display_name} added to list \nhttps://twitch.tv/${twitchUserCheck.display_name}`;
                            console.log(returnMsg);
                            const streamNotificationChannel = await getGuildSetting(guildId,'notificationChannelId');
                            if(streamNotificationChannel) {
                                await interaction.reply({ content: returnMsg, ephemeral: true});     
                            }
                            else {
                                await interaction.reply({ content: `${returnMsg} \nHint: Use /twitch discordchannel to set a channel for live notifications.`, ephemeral: true});     
                            }
                        }
                    }
                    else { 
                        console.log(`twitchStreams does not exist in guild settings for ${guildId}`);
                        twitchStreamsList = [twitchStream];
                        await interaction.reply({ content: `:white_check_mark: ${twitchUserCheck.display_name} added to list \nHint: Use /twitch discordchannel to set a channel for live notifications. \nhttps://twitch.tv/${twitchUserCheck.display_name}`, ephemeral: true});                                                                           
                    }
                    await setGuildSetting(guildId, 'twitchStreams', twitchStreamsList);
                    console.log(`Updated twitchStreams for guild ${guildId} to ${twitchStreamsList}`);
                }
                else { 
                    let returnMsg = `:no_entry_sign: ${twitchStream} is not a valid twitch user`;
                    console.log(returnMsg);
                    await interaction.reply({ content: returnMsg, ephemeral: true});
                }                                        
            }
            else { 
                let returnMsg = ':warning: twitch username must be at least 5 characters';
                console.log(returnMsg);
                await interaction.reply({ content: returnMsg, ephemeral: true});                
            }
        }

        if(removeTwitchStream) {
            if(removeTwitchStream.length > 4) {            
                // get existing arry from guild setting and add value
                let twitchStreamsList = await getGuildSetting(guildId, 'twitchStreams');
                if(twitchStreamsList) {
                    if(twitchStreamsList.includes(removeTwitchStream)) {
                        // remove from array
                        const index = twitchStreamsList.indexOf(removeTwitchStream);
                        twitchStreamsList.splice(index, 1);

                        let returnMsg = `:white_check_mark: ${removeTwitchStream} removed from list`;
                        console.log(returnMsg);
                        await interaction.reply({ content: returnMsg, ephemeral: true});
                        await setGuildSetting(guildId, 'twitchStreams', twitchStreamsList);
                        console.log(`Updated twitchStreams for guild ${guildId} to ${twitchStreamsList}`);                                                                                    
                    }
                    else {            
                        let returnMsg = `:warning: ${removeTwitchStream} is not in list`;
                        console.log(returnMsg);
                        await interaction.reply({ content: returnMsg, ephemeral: true}); 
                    }
                }
            }
            else { 
                let returnMsg = ':warning: twitch username must be at least 5 characters';
                console.log(returnMsg);
                await interaction.reply({ content: returnMsg, ephemeral: true});                
            }
        }

        if(mentionEnabled !== undefined && mentionEnabled !== null) { 
            // TODO - this doesn't unset if set to false
            if(mentionEnabled) { // this doesn't actually do anything. setting a role enables the mentions. 
                // await setGuildSetting(guildId, 'roleToPing');
                // console.log(`Enabled mentions for guild ${guildId}.`);
                await interaction.reply({ content: `:white_check_mark: Hint: use /twitch role <@role> to set a role`, ephemeral: true});
            }
            else {
                await setGuildSetting(guildId, 'roleToPing', 'none');
                console.log(`Disabled mentions for guild ${guildId}.`);
                await interaction.reply({ content: ':white_check_mark: Disabled role mentions', ephemeral: true});
            }
        }

        if(mentionRole) {
            await setGuildSetting(guildId, 'roleToPing', mentionRole.id);
            await interaction.reply({ content: `:white_check_mark: Set ${mentionRole} to live notifications mention role`, ephemeral: true});
            console.log(`Set ${mentionRole} to live notifications mention role for guild ${guildId}`);
        }
    },
};
