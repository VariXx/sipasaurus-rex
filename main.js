const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Events, Collection, ActivityType } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed, offlineStreamingEmbed } = require('./utils/streamingEmbed');
const { getGuildSetting, getAllGuildSettings } = require('./utils/getGuildSettings');
const { setGuildSetting } = require('./utils/setGuildSetting');
const { getStreamMessages, writeStreamMessages } = require('./utils/streamMessages');
const { log } = require('./utils/log');
const version = require('./package.json').version;
const { getClipList, addClip } = require('./utils/clipList');
const { getTwichClips, getStreamInfo } = require('./utils/twitchApi');
const { checkTwitchConnection } = require('./utils/checkTwitchConnection');

// const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences]});
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

var cleanupStreamEmbedsTimer;
var logChannel = null;
var clipsCheckTime = 60*60000; // default to 1 hour
var clipsChecker; 
var checkTwitchConnectionInterval;
var checkStreamsTimer;
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
                    try {
                        const cleanupGuild = client.guilds.resolve(streamMessages[x].guildId);
                        const cleanupGuildChannelId = client.channels.resolveId(streamMessages[x].msgId.channelId); // not needed. prevents crash if the channel is deleted. 
                        const cleanupChannelManager = cleanupGuild.channels;
                        const cleanupMsgChannel = cleanupChannelManager.resolve(streamMessages[x].msgId.channelId);
                        const cleanupMsgId = await cleanupMsgChannel.fetch(streamMessages[x].msgId.id); // not needed. prevents crash if the message is deleted.                         
                        await cleanupMsgChannel.messages.edit(streamMessages[x].msgId.id, {embeds: [offlineStreamingEmbedMsg]});
                    }
                    catch(error) { log('error', logChannel, `Error cleaning up streaming message. ${error}`); }
                    delete streamMessages[x];
                }
                else { log('info', logChannel, `Channel ${streamMessages[x].twitchUsername} is still live. Moving to next object in list.`); }
            }
        }
        catch(error) { console.log(error); }
    }   
    await writeStreamMessages(streamMessages);
    streamMessages = await getStreamMessages();
}

async function checkStreams() {
    try {
        // twitch
        client.guilds.cache.forEach(async(g) => {
            const guildSettings = await getAllGuildSettings(g.id);
            if(guildSettings.twitchStreams !== undefined && guildSettings.notificationChannelId !== undefined) { // TODO - change to truthy?
                for(let i = 0; i < guildSettings.twitchStreams.length; i++) {
                    console.log(`Checking stream ${guildSettings.twitchStreams[i]}`);
                    const twitchStreamOnline = await getStreamInfo(guildSettings.twitchStreams[i]);
                    if(twitchStreamOnline !== undefined) {
                        try { 
                            if(botSettings.twitchToken == undefined || botSettings.twitchToken === null || botSettings.twitchToken.length < 5) {
                                throw "Twitch token in bot settings invalid";
                            }
                            const actChannelManager = g.channels;
                            const msgChannel = actChannelManager.resolve(guildSettings.notificationChannelId);
                            let activityUsername = guildSettings.twitchStreams[i]; // TODO - remove this now that it's not using activity 
                            const twitchEmbedMsg = await streamingEmbed(guildSettings.twitchStreams[i], activityUsername);
                            if(twitchEmbedMsg !== undefined && msgChannel !== undefined) {
                                if(msgChannel !== null) {
                                    let foundMessage = false;
                                    let searchMessageId = `${g.id}-${guildSettings.twitchStreams[i]}`;
                                    for(const key in streamMessages) {
                                        if(key == searchMessageId) {
                                            let embedMsgContent = ``;
                                            let roleMention = ``;
                                            if(guildSettings.roleToPing !== undefined && guildSettings.roleToPing !== 'none') {
                                                roleMention = await g.roles.fetch(guildSettings.roleToPing);
                                                embedMsgContent = `${roleMention}`;
                                                msgChannel.messages.edit(streamMessages[key].msgId.id, {
                                                    content: `${roleMention}`,
                                                    embeds: [twitchEmbedMsg],
                                                    allowedMentions: {roles: [roleMention.id]}
                                                });                                    
                                            }
                                            else { msgChannel.messages.edit(streamMessages[key].msgId.id, {embeds: [twitchEmbedMsg]}); }                                
                                            let updatedMsgLog = `Updated activity (${g.id}-${guildSettings.twitchStreams[i]}) message`;
                                            console.log(updatedMsgLog);
                                            log('info', logChannel, updatedMsgLog);
                                            foundMessage = true;
                                        }
                                    }
                                    if(!foundMessage){
                                        let embedMsgContent = ``;
                                        let roleMention = ``;
                                        if(guildSettings.roleToPing !== undefined && guildSettings.roleToPing !== 'none') {
                                            roleMention = await g.roles.fetch(guildSettings.roleToPing);
                                            embedMsgContent = `${roleMention}`;
                                            const streamingMsgId = await msgChannel.send({
                                                content: `${roleMention}`,
                                                embeds: [twitchEmbedMsg],
                                                allowedMentions: {roles: [roleMention.id]}
                                            });
                                            let activityId = `${g.id}-${guildSettings.twitchStreams[i]}`;
                                            streamMessages[activityId] = {
                                                activityId: activityId,
                                                guildId: g.id,
                                                msgId: streamingMsgId,
                                                twitchUsername: guildSettings.twitchStreams[i],
                                                discordUsername: activityUsername
                                            };                                
                                        }
                                        else {
                                            const streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
                                            let activityId = `${g.id}-${guildSettings.twitchStreams[i]}`; // TODO - set this to a variable and add date to id? 
                                            streamMessages[activityId] = {
                                                activityId: activityId,
                                                guildId: g.id,
                                                msgId: streamingMsgId,
                                                twitchUsername: guildSettings.twitchStreams[i],
                                                discordUsername: activityUsername
                                            };
                                        }                                                                                                 
                                        let addedMsgLog = `Added activity (${g.id}-${guildSettings.twitchStreams[i]}) message to list`;
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
                    else {
                        // stream is offline 
                        console.log(`${guildSettings.twitchStreams[i]} is not streaming. Calling embed cleanup.`);
                        await cleanupStreamEmbeds();
                    }
                }                                    
            }
            else { console.log(`twitchStreams or notificationChannelId not set in guild. Skipping`); }
        });            
    }
    catch(error) {
        console.log(error);
    }    
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
    streamMessages = await getStreamMessages();    
    checkTwitchConnectionInterval = setInterval(twitchTokenHeartbeat,60*60000); // 1 hour 
    // checkTwitchConnectionInterval = setInterval(twitchTokenHeartbeat,15000); // 15 seconds
    // cleanupStreamEmbedsTimer = setInterval(cleanupStreamEmbeds,15*60000); // 5 minutes (15*60000)
    checkStreamsTimer = setInterval(checkStreams,1*10000); // 10 seconds (1*10000)
    // checkStreamsTimer = setInterval(checkStreams,15*60000); // 5 minutes (15*60000) 
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

// client.on('presenceUpdate', async (oldStatus, newStatus) => {   
//     newStatus.activities.forEach(async(act) => {
//         // if(act.type == "LISTENING") {
//             // let listenString = `listening to ${act.state} - ${act.details}`;
//             // console.log(listenString);
//             // msgChannel.send(listenString);
//         // }
//         if(act.name == 'Twitch') { // check if this is twitch or anoter service
//             // console.log(`New twitch activity\n${act}`);
//             // console.log(newStatus);
//             try {
//                 const guildSettings = await getAllGuildSettings(newStatus.guild.id);
//                 if(guildSettings.watchedUserId !== 'all') { // if watchedUser is not set to all 
//                     if(newStatus.userId !== guildSettings.watchedUserId) { // check if it's the watched user id
//                         // console.log(newStatus);
//                         // console.log(`Activity did not come from watched user`);
//                         // log('info', logChannel, `Activity did not come from watched user`); // TODO - uncomment before release
//                         return; 
//                     }
//                 }
//                 // console.log(newStatus);
//                 // send or update embed
//                 let twitchUsername = act.url.replace('https://www.twitch.tv/', '');
//                 try { 
//                     if(botSettings.twitchToken == undefined || botSettings.twitchToken === null || botSettings.twitchToken.length < 5) {
//                         throw "Twitch token in bot settings invalid";
//                     }
//                     const actChannelManager = newStatus.guild.channels;
//                     const msgChannel = actChannelManager.resolve(guildSettings.notificationChannelId);
//                     let activityUsername = newStatus.user.username; 
//                     const twitchEmbedMsg = await streamingEmbed(twitchUsername, activityUsername);
//                     if(twitchEmbedMsg !== undefined && msgChannel !== undefined) {
//                         if(msgChannel !== null) {
//                             let foundMessage = false;
//                             let searchMessageId = `${newStatus.guild.id}-${newStatus.userId}`;
//                             for(const key in streamMessages) {
//                                 if(key == searchMessageId) {
//                                     let embedMsgContent = ``;
//                                     let roleMention = ``;
//                                     if(guildSettings.roleToPing !== undefined && guildSettings.roleToPing !== 'none') {
//                                         roleMention = await newStatus.guild.roles.fetch(guildSettings.roleToPing);
//                                         embedMsgContent = `${roleMention}`;
//                                         msgChannel.messages.edit(streamMessages[key].msgId.id, {
//                                             content: `${roleMention}`,
//                                             embeds: [twitchEmbedMsg],
//                                             allowedMentions: {roles: [roleMention.id]}
//                                         });                                    
//                                     }
//                                     else { msgChannel.messages.edit(streamMessages[key].msgId.id, {embeds: [twitchEmbedMsg]}); }                                
//                                     let updatedMsgLog = `Updated activity (${newStatus.guild.id}-${newStatus.userId}) message`;
//                                     console.log(updatedMsgLog);
//                                     log('info', logChannel, updatedMsgLog);
//                                     foundMessage = true;
//                                 }
//                             }
//                             if(!foundMessage){
//                                 let embedMsgContent = ``;
//                                 let roleMention = ``;
//                                 if(guildSettings.roleToPing !== undefined && guildSettings.roleToPing !== 'none') {
//                                     roleMention = await newStatus.guild.roles.fetch(guildSettings.roleToPing);
//                                     embedMsgContent = `${roleMention}`;
//                                     const streamingMsgId = await msgChannel.send({
//                                         content: `${roleMention}`,
//                                         embeds: [twitchEmbedMsg],
//                                         allowedMentions: {roles: [roleMention.id]}
//                                     });
//                                     let activityId = `${newStatus.guild.id}-${newStatus.userId}`;
//                                     streamMessages[activityId] = {
//                                         activityId: activityId,
//                                         guildId: newStatus.guild.id,
//                                         msgId: streamingMsgId,
//                                         twitchUsername: twitchUsername,
//                                         discordUsername: newStatus.user.username
//                                     };                                
//                                 }
//                                 else {
//                                     const streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
//                                     let activityId = `${newStatus.guild.id}-${newStatus.userId}`;
//                                     streamMessages[activityId] = {
//                                         activityId: activityId,
//                                         guildId: newStatus.guild.id,
//                                         msgId: streamingMsgId,
//                                         twitchUsername: twitchUsername,
//                                         discordUsername: newStatus.user.username
//                                     };
//                                 }                                                                                                 
//                                 let addedMsgLog = `Added activity (${newStatus.guild.id}-${newStatus.userId}) message to list`;
//                                 console.log(addedMsgLog);
//                                 log('info', logChannel, addedMsgLog);                                   
//                             }
//                         }
//                         await writeStreamMessages(streamMessages);
//                         streamMessages = await getStreamMessages();
//                     }                
//                 }
//                 catch(error) {
//                     console.log(`Error creating streaming embed message: ${error}`);
//                     log('error', logChannel, `Error creating streaming embed message: ${error}`);
//                 }                    
//             }
//             catch(error) {
//                 console.log(`Error checking guild settings for activity ${act.id}. This could mean the bot hasn't been setup yet.`);
//             } 
//         }
//         else {
//             // console.log(`Activity name ${act.name} is not twitch, ignoring.`);
//             // console.log(act);
//         }
//     });
// });
