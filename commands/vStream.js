const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuildSetting } = require('../utils/setGuildSetting');
const { getGuildSetting } = require('../utils/getGuildSettings');
const { getVStreamChannelInfo } = require('../utils/vStreamAPI');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vstream')
        .setDescription('change vstream notification settings')
        .addChannelOption(option =>
            option.setName('discordchannel')
                .setDescription('Discord channel to send stream notifications'))
        .addStringOption(option =>
            option.setName('add')
                .setDescription('Add vStream stream to watch list for live notifications.'))                
        .addStringOption(option =>
            option.setName('remove')
                .setDescription('Remove vStream stream to watch list for live notifications.'))                
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
        const vStreamStream = interaction.options.getString('add');
        const removeVStreamStream = interaction.options.getString('remove');
        const mentionEnabled = interaction.options.getBoolean('mentions');
        const mentionRole = interaction.options.getRole('role');

        // TODO - multiple settings at once throws an error. reply at the end of all if statements. 

        if(discordChannel) {
            await setGuildSetting(guildId, 'notificationChannelId', discordChannel.id); 
            await interaction.reply({ content: `:white_check_mark: Set stream live notifications channel to ${discordChannel} (ID: ${discordChannel.id}) \nTest message sent to channel.`, ephemeral: true});
            console.log(`Set stream notifications channel for guild ${guildId} to ${discordChannel.id}`);
            testMsg = `:white_check_mark: Test`;
            if(botSettings.botIcon) { testMsg = `${botSettings.botIcon}`; }
            await discordChannel.send(testMsg);
        }       

        if(vStreamStream) { 
            if(vStreamStream.length > 3) {
                // check if it's a valid vStream user 
                const vStreamUserCheck = await getVStreamChannelInfo(vStreamStream); // TODO - this errors out, technically works but doesn't tell the user what happened
                if(vStreamUserCheck) {
                    // get existing arry from guild setting and add value
                    let vStreamStreamsList = await getGuildSetting(guildId, 'vStreamStreams');
                    if(vStreamStreamsList) {
                        if(vStreamStreamsList.includes(vStreamStream)) {
                            let returnMsg = `:warning: ${vStreamStream} already exists in streams list`;
                            console.log(returnMsg);
                            await interaction.reply({ content: returnMsg, ephemeral: true});
                        }
                        else {
                            vStreamStreamsList.push(vStreamStream);
                            let returnMsg = `:white_check_mark: ${vStreamUserCheck.username} added to list \nhttps://vstream.com/c/${vStreamUserCheck.username}`;
                            console.log(returnMsg);
                            const streamNotificationChannel = await getGuildSetting(guildId,'notificationChannelId');
                            if(streamNotificationChannel) {
                                await interaction.reply({ content: returnMsg, ephemeral: true});     
                            }
                            else {
                                await interaction.reply({ content: `${returnMsg} \nHint: Use /vstream discordchannel to set a channel for live notifications.`, ephemeral: true});     
                            }
                        }
                    }
                    else { 
                        console.log(`vStreamStream does not exist in guild settings for ${guildId}`);
                        vStreamStreamsList = [vStreamStream];
                        await interaction.reply({ content: `:white_check_mark: ${vStreamUserCheck.username} added to list \nHint: Use /vstream discordchannel to set a channel for live notifications. \nhttps://vstream.com/c/${vStreamUserCheck.username}`, ephemeral: true});                                                                           
                    }
                    await setGuildSetting(guildId, 'vStreamStreams', vStreamStreamsList);
                    console.log(`Updated vStreamStreams for guild ${guildId} to ${vStreamStreamsList}`);
                }
                else { 
                    let returnMsg = `:no_entry_sign: ${vStreamStream} is not a valid vStream user`;
                    console.log(returnMsg);
                    await interaction.reply({ content: returnMsg, ephemeral: true});
                }                                        
            }
            else { 
                let returnMsg = ':warning: vStream username must be at least 4 characters';
                console.log(returnMsg);
                await interaction.reply({ content: returnMsg, ephemeral: true});                
            }
        }

        if(removeVStreamStream) {
            if(removeVStreamStream.length > 3) {            
                // get existing arry from guild setting and add value
                let vStreamStreamsList = await getGuildSetting(guildId, 'vStreamStreams');
                if(vStreamStreamsList) {
                    if(vStreamStreamsList.includes(removeVStreamStream)) {
                        // remove from array
                        const index = vStreamStreamsList.indexOf(removeVStreamStream);
                        vStreamStreamsList.splice(index, 1);

                        let returnMsg = `:white_check_mark: ${removeVStreamStream} removed from list`;
                        console.log(returnMsg);
                        await interaction.reply({ content: returnMsg, ephemeral: true});
                        await setGuildSetting(guildId, 'vStreamStreams', vStreamStreamsList);
                        console.log(`Updated vStreamStreams for guild ${guildId} to ${vStreamStreamsList}`);                                                                                    
                    }
                    else {            
                        let returnMsg = `:warning: ${removeVStreamStream} is not in list`;
                        console.log(returnMsg);
                        await interaction.reply({ content: returnMsg, ephemeral: true}); 
                    }
                }
            }
            else { 
                let returnMsg = ':warning: vStream username must be at least 4 characters';
                console.log(returnMsg);
                await interaction.reply({ content: returnMsg, ephemeral: true});                
            }
        }

        if(mentionEnabled !== undefined && mentionEnabled !== null) { 
            // TODO - this doesn't unset if set to false
            if(mentionEnabled) { // this doesn't actually do anything. setting a role enables the mentions. 
                // await setGuildSetting(guildId, 'roleToPing');
                // console.log(`Enabled mentions for guild ${guildId}.`);
                await interaction.reply({ content: `Hint: use /vStream role <@role> to set a role`, ephemeral: true});
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
