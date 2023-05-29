const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Events, Collection, ActivityType } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed, offlineStreamingEmbed } = require('./utils/streamingEmbed');
const { getGuildSetting, getAllGuildSettings } = require('./utils/getGuildSettings');
const { setGuildSetting } = require('./utils/setGuildSetting');
// const { helpEmbed } = require('./utils/helpEmbed');
const { getStreamMessages, writeStreamMessages } = require('./utils/streamMessages');
const { log } = require('./utils/log');
const version = require('./package.json').version;
const { getClipList, addClip } = require('./utils/clipList');
const { getTwichClips, getStreamInfo } = require('./utils/twitchApi');
const { checkTwitchConnection } = require('./utils/checkTwitchConnection');

// const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences]});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// var sentStreamMessages = {};
var cleanupStreamEmbedsTimer;
var logChannel = null;
// var discordClipsChannel = null;
var clipsCheckTime = 60*60000; // default to 1 hour
var clipsChecker; 
var checkTwitchConnectionInterval;
var sentTestMessages = {}; 
var testMsg = "Can you read this?";
var streamMessages = {};

async function cleanupStreamEmbeds() {
    streamMessages = await getStreamMessages();
    for(let x in streamMessages) {
        try {
            if(streamMessages[x].twitchUsername !== undefined) {
                const isChannelLive = await getStreamInfo(streamMessages[x].twitchUsername);
                if(isChannelLive === undefined) { // twitch API doesn't send a message if stream is offline. this is messy. 
                    log('info', logChannel, `Stream ${streamMessages[x].twitchUsername} is offline. Changing message to offline embed.`);            
                    const offlineStreamingEmbedMsg = await offlineStreamingEmbed(streamMessages[x].twitchUsername, streamMessages[x].discordUsername);
                    
                    const cleanupGuild = client.guilds.resolve(streamMessages[x].guildId);                   
                    const cleanupChannelManager = cleanupGuild.channels;
                    const cleanupMsgChannel = cleanupChannelManager.resolve(streamMessages[x].msgId.channelId);
                    cleanupMsgChannel.messages.edit(streamMessages[x].msgId.id, {embeds: [offlineStreamingEmbedMsg]});
                    log('info', logChannel, `Message changed to offline embed. Removing from list.`);
                    delete streamMessages[x];
                }
                else {
                    log('info', logChannel, `Channel ${streamMessages[x].twitchUsername} is still live. Moving to next object in list.`);
                }
            }
        }
        catch(error) {
            console.log(error);
        }
    }   
    await writeStreamMessages(streamMessages);
    streamMessages = await getStreamMessages();
}

async function checkTwitchClips() {
    try {
        client.guilds.cache.forEach(async(g) => {
            const guildSettings = await getAllGuildSettings(g.id);
            if(guildSettings.twitchClipsChannel !== undefined && guildSettings.discordClipsChannel !== undefined) {
                let clipsResult = await getTwichClips(guildSettings.twitchClipsChannel);
                let clipsListFilename = `clipList-${g.id}`;
                const clipList = await getClipList(clipsListFilename);
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
                        await addClip(clipsListFilename, clip.id);
                        const discordClipsChannel = client.channels.resolve(guildSettings.discordClipsChannel);                        
                        discordClipsChannel.send(`${clip.url}`);
                    }
                });
            }
            else { 
                console.log(`No clips settings found for guild ${g.id}, skipping.`);
            }
        });
    }
    catch(error) {
        console.log(error);
    }    
}

// run node deployCommands.js if adding any commands

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
    else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once('ready', async () => {
    console.log(`${client.user.username} connected`);
    if(botSettings.activity !== undefined) {
        client.user.setActivity( `${botSettings.activity} | ${version}`, {type: ActivityType.Watching});
    }
    if(botSettings.logChannel.length > 1) {
        logChannel = client.channels.resolve(botSettings.logChannel);    
        console.log(`Found log channel ${logChannel}`);
        let startMsg = ':robot: Bot started';
        if(botSettings.botIcon !== undefined) { startMsg = `${botSettings.botIcon} Bot started`; }
        await logChannel.send(startMsg);
        let twitchCheck = await twitchTokenHeartbeat();
        if(twitchCheck) { await logChannel.send(`:ballot_box_with_check: Twitch connected`); }
    }
    else { console.log(`Log channel not set, skipping lookup`); }    
    if(botSettings.checkTwitchClips) {
        clipsCheckTime = botSettings.clipsCheckTime*60000;
        clipsChecker = setInterval(checkTwitchClips,clipsCheckTime);        
        // if(botSettings.discordClipsChannel.length > 1) {
            // discordClipsChannel = client.channels.resolve(botSettings.discordClipsChannel);
            // console.log(`Found clips channel ${discordClipsChannel}`);
            // clipsCheckTime = botSettings.clipsCheckTime*60000;
            // clipsChecker = setInterval(checkTwitchClips,clipsCheckTime);
        // }
        // else { console.log(`Twitch clips channel not set, skipping lookup`); }    
    }
    else { console.log(`checkTwitchClips not enabled, skipping.`); }    
    streamMessages = await getStreamMessages();    
    checkTwitchConnectionInterval = setInterval(twitchTokenHeartbeat,60*60000); // 1 hour 
    // checkTwitchConnectionInterval = setInterval(twitchTokenHeartbeat,15000); // 15 seconds
    cleanupStreamEmbedsTimer = setInterval(cleanupStreamEmbeds,15*60000); // 15 minutes (15*60000)
    // cleanupStreamEmbedsTimer = setInterval(cleanupStreamEmbeds,1*30000); // 30 seconds
});

async function twitchTokenHeartbeat() {
    const twitchStatus = await checkTwitchConnection();
    if(!twitchStatus) {
        const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
        await log(`error`, logChannel, `Twitch connection failed. Exiting.`);
        await logChannel.send(`<${tokenUrl}>`);        
        process.exit();
    }
    return true;
}

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
    // if(command == 'hey') {
    //     if(msg.author.id == botSettings.botOwnerID) {
    //         if(client.user.username == "Buzzyflop") { msg.channel.send(`:rabbit:`); }
    //         else { msg.channel.send(`:t_rex:`); }
    //         return;
    //     }
    // }
    // if(command == 'purpose') {
    //     if(msg.author.id == botSettings.botOwnerID) {
    //         msg.channel.send(`:butter:`);
    //         return;
    //     }
    // }
    // if(command == 'twitchtoken') {
    //     if(msg.author.id == botSettings.botOwnerID) {        
    //         const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
    //         msg.channel.send(`Don't click this unless you asked for it: <${tokenUrl}>`);        
    //         return;
    //     }
    // }
    // if(command == 'tokentest') {
    //     if(msg.author.id == botSettings.botOwnerID) {        
    //         const twitchTokenTest = await checkTwitchConnection();
    //         if(twitchTokenTest) {
    //             msg.channel.send(`Twitch test connection successful.`);
    //         }
    //         else {
    //             msg.channel.send(`Twitch test connection failed.`);
    //         }
    //     }
    // }
    // if(command == 'stats' || command == 'status') {
    //     if(msg.author.id == botSettings.botOwnerID) {        
    //         let botEmote = `:t_rex:`;
    //         if(client.user.username == "Buzzyflop") { botEmote = `:rabbit:`; }
    //         let sentStreamMessagesCount = Object.keys(sentStreamMessages).length;
    //         let statsString = `${version}\nUptime: ${client.uptime}ms\nGuilds: ${client.guilds.cache.size}\nChannels: ${client.channels.cache.size}\nUsers: ${client.users.cache.size}\nLog channel: ${logChannel}\nActive messages: ${sentStreamMessagesCount}\n`;
    //         console.log(statsString);
    //         msg.channel.send(`${botEmote} ${client.user.username} (\`${client.user.id}\`)\n${statsString}`);
    //         return;
    //     }
    // }
    // if(command == 'invite') {
    //     const inviteUrl = `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=2147994688`; 
    //     msg.channel.send(`Add me to your server: ${inviteUrl}`);   
    //     return; 
    // }
    // if(command == 'help' || command == '?') {
    //     if(msg.author.id == botSettings.botOwnerID || msg.author.id == msg.channel.guild.onwerID) {
    //         const helpMsg = await helpEmbed(msg.author.username);
    //         msg.channel.send({embeds: [helpMsg]});
    //     }
    // }
    if(command == 'set') {
        if(msg.author.id == botSettings.botOwnerID || msg.author.id == msg.channel.guild.onwerID) {
            if(checkMsg[1] !== undefined && checkMsg[1].toLowerCase() == 'live') {
                if(checkMsg[2] !== undefined) {
                    if(checkMsg[2].toLowerCase() == 'channel') {
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
                            msg.channel.send("Couldn't read channel name. (Syntax: `set live channel #channel`)");
                        }
                    }
                    if(checkMsg[2].toLowerCase() == 'role') {
                        if(checkMsg[3] !== undefined) {
                            if(checkMsg[3].toLowerCase() == 'off') {
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
                                msg.channel.send("Couldn't find role. (Syntax: `set live role @<role>`)");
                            }
                        }
                    }
                    if(checkMsg[2].toLowerCase() == 'user') {
                        if(checkMsg[3] !== undefined) {
                            if(checkMsg[3].toLowerCase() == 'all') {
                                await setGuildSetting(msg.guild.id, 'watchedUserId', 'all');
                                msg.channel.send(`Set stream notifications to all users.`);
                                return;                            
                            }
                            if(checkMsg[3].toLowerCase() == 'off') {
                                await setGuildSetting(msg.guild.id, 'watchedUserId', '');
                                msg.channel.send(`Disabled stream notifications. Now I'm bored.`);
                                return;                            
                            }
                            if(msg.mentions.users.size < 2) {
                                msg.channel.send("Error: No user mentioned. (Syntax: `set live user @<user>`)");
                                return; 
                            }   
                            if(msg.mentions.users.size > 2) {
                                msg.channel.send("Error: More than one user mentioned. (Syntax: `set live user @<user>`)");
                                return;
                            }
                            if(msg.mentions.users.size == 2) { // good, bot + user
                                // console.log(msg.mentions.users);
                                msg.mentions.users.forEach(async (user) => {
                                    if(user.id != client.user.id) {
                                        await setGuildSetting(msg.guild.id, 'watchedUserId', user.id);
                                        msg.channel.send(`Set stream notifications user to ${user.username}`);
                                    }
                                    // else {
                                    //     console.log(`Found client (bot) user id, skipping.`);
                                    // }
                                });
                            }
                        }
                    }
                }
            }
            // if(checkMsg[1] !== undefined && checkMsg[1].toLowerCase() == 'clips') {
            //     if(checkMsg[2] !== undefined) {
            //         if(checkMsg[2].toLowerCase() == 'channel') {
            //             if(checkMsg[3] !== undefined) {
            //                 let findChan = checkMsg[3].slice(2,-1);
            //                 try {
            //                     let foundChan = await client.channels.fetch(findChan);
            //                     let foundChanId = await client.channels.resolveId(foundChan);                 
            //                     await setGuildSetting(msg.guild.id, 'checkTwitchClips', true);
            //                     await setGuildSetting(msg.guild.id, 'discordClipsChannel', foundChanId);
            //                     console.log(`Set clips channel for guild ${msg.guild.id} to ${foundChanId}`);
            //                     msg.channel.send(`Set clips channel to ${foundChan}`);
            //                 }
            //                 catch(error) {
            //                     msg.channel.send(`Error adding channel`);
            //                     log('error', logChannel, `Error adding channel. ${error}`);
            //                     console.log(error);
            //                 }
            //             }
            //             else {
            //                 msg.channel.send("Couldn't read channel name. (Syntax: `set live channel #channel`)");
            //             }
            //         }
            //         if(checkMsg[2].toLowerCase() == 'off') {
            //             try {
            //                 await setGuildSetting(msg.guild.id, 'checkTwitchClips', false);
            //                 await setGuildSetting(msg.guild.id, 'discordClipsChannel', '');
            //                 console.log(`Disabled clips channel for guild ${msg.guild.id}`);
            //                 msg.channel.send(`Disabled clips notification`);
            //             }
            //             catch {
            //                 msg.channel.send(`Error disabling clips channel`);
            //                 log('error', logChannel, `Error disabling clips channel ${error}`);
            //                 console.log(error);
            //             }
            //         }
            //         if(checkMsg[2].toLowerCase() == 'for' || checkMsg[2].toLowerCase() == 'user') { // command aliases! 
            //             if(checkMsg[3] !== undefined) {
            //                 try {
            //                     await setGuildSetting(msg.guild.id, 'twitchClipsChannel', checkMsg[3]);
            //                     console.log(`Set clips user for guild ${msg.guild.id} to ${checkMsg[3]}`);
            //                     msg.channel.send(`Set clips user to ${checkMsg[3]} <https://twitch.tv/${checkMsg[3]}>`);
            //                 }
            //                 catch {
            //                     msg.channel.send(`Error setting clips user`);
            //                     log('error', logChannel, `Error setting clips user ${error}`);
            //                     console.log(error);
            //                 }
            //             }
            //             else {
            //                 msg.channel.send("Couldn't read twitch user. (Syntax: `set clips user <twitch usename>`)");
            //             }
            //         }
            //     }
            // }
        }
    }
}

client.login(botSettings.discordToken);

client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;
    // console.log(interaction);
    
    const command = interaction.client.commands.get(interaction.commandName);

    if(!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    }
    catch(error) {
        console.error(error);
        if(interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

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
        if(act.name == 'Twitch') { // check if this is twitch or anoter service
            console.log(`New twitch activity\n${act}`);
            // console.log(newStatus);
            try {
                const guildSettings = await getAllGuildSettings(newStatus.guild.id);
                if(guildSettings.watchedUserId !== 'all') { // if watchedUser is not set to all 
                    if(newStatus.userId !== guildSettings.watchedUserId) { // check if it's the watched user id
                        console.log(`Activity did not come from watched user`);
                        log('info', logChannel, `Activity did not come from watched user`);
                        return; 
                    }
                }
                console.log(newStatus);
                // send or update embed
                let twitchUsername = act.url.replace('https://www.twitch.tv/', '');
                try { 
                    if(botSettings.twitchToken == undefined || botSettings.twitchToken === null || botSettings.twitchToken.length < 5) {
                        throw "Twitch token in bot settings invalid";
                    }
                    const actChannelManager = newStatus.guild.channels;
                    const msgChannel = actChannelManager.resolve(guildSettings.notificationChannelId);
                    let activityUsername = newStatus.userId; // TODO - change this to look up the user's name by ID
                    const twitchEmbedMsg = await streamingEmbed(twitchUsername, activityUsername);
                    if(twitchEmbedMsg !== undefined && msgChannel !== undefined) {
                        if(msgChannel !== null) {
                            let foundMessage = false;
                            let searchMessageId = `${newStatus.guild.id}-${newStatus.userId}`;
                            for(const key in streamMessages) {
                                if(key == searchMessageId) {
                                    let embedMsgContent = ``;
                                    let roleMention = ``;
                                    if(guildSettings.roleToPing !== undefined && guildSettings.roleToPing !== 'none') {
                                        roleMention = await newStatus.guild.roles.fetch(guildSettings.roleToPing);
                                        embedMsgContent = `${roleMention}`;
                                        msgChannel.messages.edit(streamMessages[key].msgId.id, {
                                            content: `${roleMention}`,
                                            embeds: [twitchEmbedMsg],
                                            allowedMentions: {roles: [roleMention.id]}
                                        });                                    
                                    }
                                    else { msgChannel.messages.edit(streamMessages[key].msgId.id, {embeds: [twitchEmbedMsg]}); }                                
                                    let updatedMsgLog = `Updated activity (${newStatus.guild.id}-${newStatus.userId}) message`;
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
                                    let activityId = `${newStatus.guild.id}-${newStatus.userId}`;
                                    streamMessages[activityId] = {
                                        activityId: activityId,
                                        guildId: newStatus.guild.id,
                                        msgId: streamingMsgId,
                                        twitchUsername: twitchUsername,
                                        discordUsername: newStatus.user.username
                                    };                                
                                }
                                else {
                                    const streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
                                    let activityId = `${newStatus.guild.id}-${newStatus.userId}`;
                                    streamMessages[activityId] = {
                                        activityId: activityId,
                                        guildId: newStatus.guild.id,
                                        msgId: streamingMsgId,
                                        twitchUsername: twitchUsername,
                                        discordUsername: newStatus.user.username
                                    };
                                }                                                                                                 
                                let addedMsgLog = `Added activity (${newStatus.guild.id}-${newStatus.userId}) message to list`;
                                console.log(addedMsgLog);
                                log('info', logChannel, addedMsgLog);                                   
                            }
                        }
                        await writeStreamMessages(streamMessages);
                        streamMessages = await getStreamMessages();
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
        }
        else {
            // console.log(`Activity name ${act.name} is not twitch, ignoring.`);
            // console.log(act);
        }
    });
});
