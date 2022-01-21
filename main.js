const { Client, Intents } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed, offlineStreamingEmbed } = require('./utils/streamingEmbed');
const { getGuildSetting, getAllGuildSettings } = require('./utils/getGuildSettings');
const { setGuildSetting } = require('./utils/setGuildSetting');
const { log } = require('./utils/log');
const version = require('./package.json').version;
const { getClipList, addClip } = require('./utils/clipList');
const { getTwichClips, getStreamInfo } = require('./utils/twitchApi');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });

var sentStreamMessages = {};
var cleanupStreamEmbedsTimer;
var logChannel = null;
var discordClipsChannel = null;
var clipsCheckTime = 60*60000; // default to 1 hour
var clipsChecker; 
var sentTestMessages = {}; 

async function cleanupStreamEmbeds() {
    // console.log(sentStreamMessages);
    for(let x in sentStreamMessages) {
        try {
            if(sentStreamMessages[x].twitchUsername !== undefined) {
                const isChannelLive = await getStreamInfo(sentStreamMessages[x].twitchUsername);
                if(isChannelLive === undefined) { // twitch API doesn't send a message if stream is offline. this is messy. 
                    log('info', logChannel, `Stream ${sentStreamMessages[x].twitchUsername} is offline. Changing message to offline embed.`);            
                    const offlineStreamingEmbedMsg = await offlineStreamingEmbed(sentStreamMessages[x].twitchUsername, sentStreamMessages[x].discordUsername);
                    sentStreamMessages[x].msgId.edit({embeds: [offlineStreamingEmbedMsg]});
                    log('info', logChannel, `Message changed to offline embed. Removing from list.`);
                    delete sentStreamMessages[x];
                }
                else {
                    log('info', logChannel, `Channel ${sentStreamMessages[x].twitchUsername} is still live. Moving to next object in list.`);
                }
            }
        }
        catch(error) {
            console.log(error);
        }
    }   
}

async function checkTwitchClips() {
    try {
        let clipsResult = await getTwichClips(botSettings.twitchClipsChannel);
        const clipList = await getClipList();
        clipsResult.forEach(async (clip) => {
            let foundClip = false;
            if(clipList !== undefined) {
                if(clipList.includes(clip.id)) {
                    console.log(`Found clip ${clip.id} in list, skipping.`);
                    log('info', logChannel, `Found clip ${clip.id} in list, skipping.`);
                    foundClip = true;
                }
            }
            if(!foundClip) {
                await addClip(clip.id);
                discordClipsChannel.send(`${clip.url}`);
            }
        });
    }
    catch(error) {
        console.log(error);
    }    
}

client.once('ready', () => {
    console.log(`${client.user.username} connected`);
    client.user.setActivity({name: `your streaming status | ${version}`, type: 'WATCHING'});
    // client.user.setActivity({name: `I am error | ${version}`, type: 'PLAYING'});
    if(botSettings.logChannel.length > 1) {
        logChannel = client.channels.resolve(botSettings.logChannel);    
        console.log(`Found log channel ${logChannel}`);
    }
    else { console.log(`Log channel not set, skipping lookup`); }    
    if(botSettings.checkTwitchClips) {
        if(botSettings.discordClipsChannel.length > 1) {
            discordClipsChannel = client.channels.resolve(botSettings.discordClipsChannel);
            console.log(`Found clips channel ${discordClipsChannel}`);
            clipsCheckTime = botSettings.clipsCheckTime*60000;
            // clipsCheckTime = 60000;
            clipsChecker = setInterval(checkTwitchClips,clipsCheckTime);
        }
        else { console.log(`Twitch clips channel not set, skipping lookup`); }    
    }
    else { console.log(`checkTwitchClips not enabled, skipping.`); }    
    cleanupStreamEmbedsTimer = setInterval(cleanupStreamEmbeds,15*60000); // 15 minutes (15*60000)
});

async function processCommand(msg) {
    let checkMsg = msg.content.split(' ');
    let command = ``;
    if(checkMsg[0].includes(client.user.id)) {
        checkMsg.shift();
    }
    if(checkMsg[0] !== undefined) {
        command = checkMsg[0].toLowerCase();
    }
    else {
        log('info', logChannel, `Empty command (${msg}), ignoring.`);
        return;
    }
    if(command == 'hey') {
        msg.channel.send(`Hi :t_rex:`);
        return;
    }
    if(command == 'twitchtoken') {
        const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
        msg.channel.send(`Don't click this unless you asked for it: <${tokenUrl}>`);        
        return;
    }
    if(command == 'invite') {
        const inviteUrl = `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=2147994688`; 
        msg.channel.send(`Add me to your server: ${inviteUrl}`);   
        return; 
    }
    if(command == 'help') {
        if(msg.author.id == botSettings.botOwnerID || msg.author.id == msg.channel.guild.onwerID) {
            let helpMsg = `
Mention me with one of the commands below.
**General**
**help**: Displays this message.
**invite**: Send URL to add me to your Discord server. Please get the server owner's permission first.

**Stream Notifications**
**set live channel #<channel>**: Sets the channel to send notifications when users go live on twitch.
**set live role @<role>**: Role to mention in stream notification messages.
**set live role off**: Disable role mentions in stream notification messages.
**set live user @<user>**: The discord user to watch for streaming activity. This user will need to have twitch linked with their discord account.
**set live user all**: Send stream notification messages for all users in this server. 
**set live user off**: Disable stream notification messages.

**Clips**
**set clips channel**: Discord channel to send notification messages when a new clip is created on twitch. 
**set clips user**: Twitch channel name to watch for new clips. 
**set clips off**: Disable twitch clip notification messages.
            `;
            msg.channel.send(helpMsg);
        }
    }
    if(command == 'set') {
        if(msg.author.id == botSettings.botOwnerID || msg.author.id == msg.channel.guild.onwerID) {
            if(checkMsg[1] !== undefined && checkMsg[1].toLowerCase() == 'live') {
                if(checkMsg[2] !== undefined && checkMsg[2].toLowerCase() == 'channel') {
                    if(checkMsg[3] !== undefined) {
                        let findChan = checkMsg[3].slice(2,-1);
                        try {
                            let foundChan = await client.channels.fetch(findChan);
                            let foundChanId = await client.channels.resolveId(foundChan);                  
                            await setGuildSetting(msg.guild.id, 'notificationChannelId', foundChanId);
                            console.log(`Set live announcement channel for guild ${msg.guild.id} to ${foundChanId}`);
                            msg.channel.send(`Set live announcement channel to ${foundChan}`);
                        }
                        catch(error) {
                            msg.channel.send(`Error adding channel`);
                            log('error', logChannel, `Error adding channel. ${error}`);
                            console.log(error);
                        }
                    }
                    else {
                        msg.channel.send(`Couldn't read channel name. (Format: set live channel #channel)`);
                    }
                }
                if(checkMsg[2] !== undefined && checkMsg[2].toLowerCase() == 'role') {
                    if(checkMsg[3] !== undefined) {
                        if(checkMsg[3] == 'off') {
                            await setGuildSetting(msg.guild.id, 'roleToPing', 'none');
                            msg.channel.send(`Disabled role mentions`);
                            return;
                        }
                        if(msg.mentions.roles.size > 0) {
                            let foundRoleId = checkMsg[3].slice(3,-1);
                            try {
                                await setGuildSetting(msg.guild.id, 'roleToPing', foundRoleId);
                                let foundRoleMention = await msg.guild.roles.fetch(foundRoleId);
                                msg.channel.send({
                                    content: `Set live notification role to ${foundRoleMention}`,
                                    allowedMentions: {roles: [foundRoleMention.id]}
                                });                                
                            }
                            catch(error) {
                                msg.channel.send(`Error setting role.`);
                                log('error', logChannel, `Error setting role for guild ${msg.guild.id}`);
                                console.log(error);
                            }
                        }
                        else {
                            console.log(`no role mentions`);
                            msg.channel.send(`Couldn't find role. (Format: set live role @<role>)`);
                        }
                    }
                }
                if(checkMsg[2].toLowerCase() == 'user') {
                    if(checkMsg[3] !== undefined) {
                        if(checkMsg[3] == 'all') {
                            await setGuildSetting(msg.guild.id, 'watchedUserId', 'all');
                            msg.channel.send(`Set stream notifications to all users.`);
                            return;                            
                        }
                        if(checkMsg[3] == 'off') {
                            await setGuildSetting(msg.guild.id, 'watchedUserId', '');
                            msg.channel.send(`Disabled stream notifications. Now I'm bored.`);
                            return;                            
                        }
                        if(msg.mentions.users.size < 2) {
                            msg.channel.send(`Error: No user mentioned. (Format: set live user @<user>)`);
                            return; 
                        }   
                        if(msg.mentions.users.size > 2) {
                            msg.channel.send(`Error: More than one user mentioned. (Format: set live user @<user>)`);                            
                            return;
                        }
                        if(msg.mentions.users.size == 2) { // good, bot + user
                            // console.log(msg.mentions.users);
                            msg.mentions.users.forEach(async (user) => {
                                if(user.id == client.user.id) {
                                    console.log(`Found client (bot) user id, skipping.`);
                                }
                                else {
                                    console.log(user.id);
                                    await setGuildSetting(msg.guild.id, 'watchedUserId', user.id);
                                    msg.channel.send(`Set stream notifications user to ${user.username}`);
                                }
                            });
                        }
                    }
                }
            }
            if(checkMsg[1] !== undefined && checkMsg[1].toLowerCase() == 'clips') {
                if(checkMsg[2] !== undefined && checkMsg[2].toLowerCase() == 'channel') {
                    if(checkMsg[3] !== undefined) {
                        let findChan = checkMsg[3].slice(2,-1);
                        try {
                            let foundChan = await client.channels.fetch(findChan);
                            let foundChanId = await client.channels.resolveId(foundChan);                 
                            await setGuildSetting(msg.guild.id, 'checkTwitchClips', true);
                            await setGuildSetting(msg.guild.id, 'discordClipsChannel', foundChanId);
                            console.log(`Set clips channel for guild ${msg.guild.id} to ${foundChanId}`);
                            msg.channel.send(`Set clips channel to ${foundChan}`);
                        }
                        catch(error) {
                            msg.channel.send(`Error adding channel`);
                            log('error', logChannel, `Error adding channel. ${error}`);
                            console.log(error);
                        }
                    }
                    else {
                        msg.channel.send(`Couldn't read channel name. (Format: set live channel #channel)`);
                    }
                }
                if(checkMsg[2] !== undefined && checkMsg[2].toLowerCase() == 'off') {
                    try {
                        await setGuildSetting(msg.guild.id, 'checkTwitchClips', false);
                        await setGuildSetting(msg.guild.id, 'discordClipsChannel', '');
                        console.log(`Disabled clips channel for guild ${msg.guild.id}`);
                        msg.channel.send(`Disabled clips notification`);
                    }
                    catch {
                        msg.channel.send(`Error disabling clips channel`);
                        log('error', logChannel, `Error disabling clips channel ${error}`);
                        console.log(error);
                    }
                }
                if(checkMsg[2] !== undefined) {
                    if(checkMsg[2].toLowerCase() == 'for' || checkMsg[2].toLowerCase() == 'user') { // command aliases! 
                        if(checkMsg[3] !== undefined) {
                            try {
                                await setGuildSetting(msg.guild.id, 'twitchClipsChannel', checkMsg[3]);
                                console.log(`Set clips user for guild ${msg.guild.id} to ${checkMsg[3]}`);
                                msg.channel.send(`Set clips user to ${checkMsg[3]} <https://twitch.tv/${checkMsg[3]}>`);
                            }
                            catch {
                                msg.channel.send(`Error setting clips user`);
                                log('error', logChannel, `Error setting clips user ${error}`);
                                console.log(error);
                            }
                        }
                        else {
                            msg.channel.send(`Couldn't read twitch user. (Format: set clips user <twitch usename>)`);
                        }
                    }
                }
            }
        }
    }
}

client.login(botSettings.discordToken);

client.on('messageCreate', async (msg) => {
    if(msg.author == client.user) { return; } // ignore messages sent by bot
    if(msg.mentions.users.hasAny(client.user.id)) {
        processCommand(msg);
    }
});

client.on('presenceUpdate', async (oldStatus, newStatus) => {   
    newStatus.activities.forEach(async(act) => {
        // if(act.type == "LISTENING") {
            // let listenString = `listening to ${act.state} - ${act.details}`;
            // console.log(listenString);
            // msgChannel.send(listenString);
        // }
        // console.log(newStatus);
        if(act.type == "STREAMING") {
            if(act.name == 'Twitch') { // check if this is twitch or anoter service
                // start old settings - check for all
                // if(botSettings.watchedUserId !== 'all') { // if watchedUser is not set to all 
                //     if(newStatus.userId !== botSettings.watchedUserId) { // check if it's the watched user id
                //         console.log(`Activity did not come from watched user`);
                //         log('info', logChannel, `Activity did not come from watched user`);
                //         return; 
                //     }
                // }
                // end old settings - check for all
                // start per guild settings
                try {
                    const guildSettings = await getAllGuildSettings(newStatus.guild.id);
                    if(guildSettings.watchedUserId !== 'all') { // if watchedUser is not set to all 
                        if(newStatus.userId !== guildSettings.watchedUserId) { // check if it's the watched user id
                            console.log(`Activity did not come from watched user`);
                            log('info', logChannel, `Activity did not come from watched user`);
                            return; 
                        }
                    }
                    // send or update embed
                    let twitchUsername = act.url.replace('https://www.twitch.tv/', '');
                    try { 
                        if(botSettings.twitchToken == undefined || botSettings.twitchToken === null || botSettings.twitchToken.length < 5) {
                            throw "Twitch token in bot settings invalid";
                        }
                        const actChannelManager = newStatus.guild.channels;
                        const msgChannel = actChannelManager.resolve(guildSettings.notificationChannelId);
                        const twitchEmbedMsg = await streamingEmbed(twitchUsername, newStatus.user.username);
                        if(twitchEmbedMsg !== undefined && msgChannel !== undefined) {
                            if(msgChannel !== null) {
                                let foundMessage = false;
                                for(const key in sentStreamMessages) {
                                    if(sentStreamMessages[key].activityId == act.id) {
                                        let embedMsgContent = ``;
                                        let roleMention = ``;
                                        if(guildSettings.roleToPing !== undefined || guildSettings.roleToPing !== 'none') {
                                            roleMention = await newStatus.guild.roles.fetch(guildSettings.roleToPing);
                                            embedMsgContent = `${roleMention}`;
                                            sentStreamMessages[key].msgId.edit({
                                                content: `${roleMention}`,
                                                embeds: [twitchEmbedMsg],
                                                allowedMentions: {roles: [roleMention.id]}
                                            });                                    
                                        }
                                        else {
                                            sentStreamMessages[key].msgId.edit({embeds: [twitchEmbedMsg]});
                                        }                                
                                        let updatedMsgLog = `Updated activity (${act.id}) message`;
                                        console.log(updatedMsgLog);
                                        log('info', logChannel, updatedMsgLog);
                                        foundMessage = true;
                                    }
                                }
                                if(!foundMessage){
                                    let embedMsgContent = ``;
                                    let roleMention = ``;
                                    if(guildSettings.roleToPing !== undefined && guildSettings.roleToPing !== 'none') {
                                        roleMention = await newStatus.guild.roles.fetch(guildSettings.roleToPing);
                                        embedMsgContent = `${roleMention}`;
                                        const streamingMsgId = await msgChannel.send({
                                            content: `${roleMention}`,
                                            embeds: [twitchEmbedMsg],
                                            allowedMentions: {roles: [roleMention.id]}
                                        });                                    
                                        sentStreamMessages[act.id] = {
                                            activityId: act.id,
                                            msgId: streamingMsgId,
                                            twitchUsername: twitchUsername,
                                            discordUsername: newStatus.user.username
                                        };                                
                                    }
                                    else {
                                        const streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
                                        sentStreamMessages[act.id] = {
                                            activityId: act.id,
                                            msgId: streamingMsgId,
                                            twitchUsername: twitchUsername,
                                            discordUsername: newStatus.user.username
                                        };
                                    }                                                      
                                    let addedMsgLog = `Added activity (${act.id}) message to list`;
                                    console.log(addedMsgLog);
                                    log('info', logChannel, addedMsgLog);
                                }
                            }
                        }                
                    }
                    catch(error) {
                        console.log(`Error creating streaming embed message: ${error}`);
                        log('error', logChannel, `Error creating streaming embed message: ${error}`);
                    }                    
                }
                catch(error) {
                    console.log(`Error checking guild settings for activity ${act.id}. This could mean the bot hasn't been setup yet.`);
                }
                // end per guild settings
                // start old settings - send embed
                // let twitchUsername = act.url.replace('https://www.twitch.tv/', '');
                // try { 
                //     if(botSettings.twitchToken == undefined || botSettings.twitchToken === null || botSettings.twitchToken.length < 5) {
                //         throw "Twitch token in bot settings invalid";
                //     }
                //     const actChannelManager = newStatus.guild.channels;
                //     const msgChannel = actChannelManager.resolve(botSettings.notificationChannelId);
                //     const twitchEmbedMsg = await streamingEmbed(twitchUsername, newStatus.user.username);
                //     if(twitchEmbedMsg !== undefined && msgChannel !== undefined) {
                //         if(msgChannel !== null) {
                //             let foundMessage = false;
                //             for(const key in sentStreamMessages) {
                //                 if(sentStreamMessages[key].activityId == act.id) {
                //                     let embedMsgContent = ``;
                //                     let roleMention = ``;
                //                     if(botSettings.roleToPing !== 'none') {
                //                         roleMention = await newStatus.guild.roles.fetch(botSettings.roleToPing);
                //                         embedMsgContent = `${roleMention}`;
                //                         sentStreamMessages[key].msgId.edit({
                //                             content: `${roleMention}`,
                //                             embeds: [twitchEmbedMsg],
                //                             allowedMentions: {roles: [roleMention.id]}
                //                         });                                    
                //                     }
                //                     else {
                //                         sentStreamMessages[key].msgId.edit({embeds: [twitchEmbedMsg]});
                //                     }                                
                //                     let updatedMsgLog = `Updated activity (${act.id}) message`;
                //                     console.log(updatedMsgLog);
                //                     log('info', logChannel, updatedMsgLog);
                //                     foundMessage = true;
                //                 }
                //             }
                //             if(!foundMessage){
                //                 let embedMsgContent = ``;
                //                 let roleMention = ``;
                //                 if(botSettings.roleToPing !== 'none') {
                //                     roleMention = await newStatus.guild.roles.fetch(botSettings.roleToPing);
                //                     embedMsgContent = `${roleMention}`;
                //                     const streamingMsgId = await msgChannel.send({
                //                         content: `${roleMention}`,
                //                         embeds: [twitchEmbedMsg],
                //                         allowedMentions: {roles: [roleMention.id]}
                //                     });                                    
                //                     sentStreamMessages[act.id] = {
                //                         activityId: act.id,
                //                         msgId: streamingMsgId,
                //                         twitchUsername: twitchUsername,
                //                         discordUsername: newStatus.user.username
                //                     };                                
                //                 }
                //                 else {
                //                     const streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
                //                     sentStreamMessages[act.id] = {
                //                         activityId: act.id,
                //                         msgId: streamingMsgId,
                //                         twitchUsername: twitchUsername,
                //                         discordUsername: newStatus.user.username
                //                     };
                //                 }                                                      
                //                 let addedMsgLog = `Added activity (${act.id}) message to list`;
                //                 console.log(addedMsgLog);
                //                 log('info', logChannel, addedMsgLog);
                //             }
                //         }
                //     }                
                // }
                // catch(error) {
                //     console.log(`Error creating streaming embed message: ${error}`);
                //     log('error', logChannel, `Error creating streaming embed message: ${error}`);
                // }
                // end old settings - send embed               
            }
            else {
                console.log(`Streaming activity name ${act.name} is not twitch, ignoring.`);
                console.log(act);
            }
        }
    });
});
