const { Client, Intents } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed, offlineStreamingEmbed } = require('./utils/streamingEmbed');
const { log } = require('./utils/log');
const version = require('./package.json').version;
const { getClipList, addClip } = require('./utils/clipList');

const { getTwichClips, getStreamMarkers, getTwitchVideos } = require('./utils/twitchApi');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });

var sentStreamMessages = { };
var logChannel = null;
var discordClipsChannel = null;
var clipsCheckTime = 60*60000; // default to 1 hour
var clipsChecker; 
var sentTestMessages = {}; 

async function checkTwitchClips() {
    try {
        // let clipsResult = await getTwichClips(botSettings.twitchClipsChannel, botSettings.twitchClientId, botSettings.twitchToken);
        let clipsResult = await getTwichClips(botSettings.twitchClipsChannel);
        const clipList = await getClipList();
        clipsResult.forEach(async (clip) => {
            // console.log(clip.id);
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
});

client.login(botSettings.discordToken);

client.on('messageCreate', async (msg) => {
    if(msg.author == client.user) { return; } // ignore messages sent by bot
    // test command
    if(msg.author.id == botSettings.botOwnerID) {
        const cmd = msg.content.split(' ');
        if(msg.content == 'twitchToken') {
            const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
            msg.channel.send(tokenUrl);
        }
        if(msg.content == 'cmsg') {
            if(botSettings.notificationChannelId) {
                try {
                    let testStreamMsg = await streamingEmbed('mst3k', msg.author.id);
                    let testStreamMsgResult = await msg.channel.send({embeds: [testStreamMsg]});
                    sentTestMessages[0] = {
                        activityId: 0,
                        msgId: testStreamMsgResult
                    }
               }
               catch(error){ 
                   console.log(`Error: ${error}`);
               }
            }
        }
        if(cmd[0] == 'umsg') {
            try {
                let doneMsg = await offlineStreamingEmbed('varixx','test user');
                sentTestMessages[0].msgId.edit({embeds: [doneMsg]});
            }
            catch(error) {
                console.log(error);
            }
        }
        if(msg.content == 'mtest') {
            try {
                const vodId = await getTwitchVideos('varixx');
                // console.log(vodId);
                const vodMarkers = await getStreamMarkers(vodId[0].id);
                // console.log(vodMarkers);
            }
            catch(error) {
                console.log(error);
            }
        }
        if(msg.content == 'showlist') {
            console.log(sentStreamMessages);
        }
    }
});

client.on('presenceUpdate', async (oldStatus, newStatus) => {   
    for(let x in sentStreamMessages) {
        sentStreamMessages[x].active = false; // mark all stream messages inactive 
    }
    if(oldStatus !== undefined && oldStatus !== null) {
        // console.log(`old`);
        // console.log(oldStatus.activities);
        let foundInNew = false;        
        oldStatus.activities.forEach(async(oldAct) => {
            if(oldAct.type == "STREAMING") {
                if(!foundInNew) {
                    if(newStatus !== undefined && newStatus !== null) {
                        newStatus.activities.forEach(async(newAct) => {
                            console.log(`----------`);
                            console.log(`Checking if old activity is in new activity list`);
                            console.log(`old`);
                            console.log(oldAct.id);                           
                            console.log(`new`);
                            console.log(newAct);
                            console.log(`old id ${oldAct.id}`);
                            console.log(`new id ${newAct.id}`);
                            console.log(`----------`);
                            if(newAct.id == oldAct.id) {
                                console.log(`Old activity (${oldAct.id}) and new activity (${newAct.id}) IDs match. Marking as active in json.`);
                                foundInNew = true;
                                if(sentStreamMessages[oldAct.id] !== undefined && sentStreamMessages[newAct.id] !== undefined) {
                                    sentStreamMessages[oldAct.id].active = true; // mark stream message active
                                }
                                else {
                                    console.log(`Couldn't find ${oldAct.id} in json. Activity may have started before bot was running.`);
                                }
                            }
                        });
                    }
                }
                else {
                    console.log(`Old activity was found in new activity list. Activity is still active, ignoring.`); // this won't work for spotify or custom status
                }
            }
            // else {
            //     console.log(`Ignoring ${oldAct.type} activity`);
            // }
        });
        for(let x in sentStreamMessages) {
            // cleanup inactive steam markers
            if(!sentStreamMessages[x].active) {
                await offlineStreamingEmbed(sentStreamMessages[x].twitchUsername, sentStreamMessages[x].discordUsername);
                console.log(`Updated streaming embed message.`);
                delete sentStreamMessages[x];
                console.log(`Removed from json`); 
            }
        }
    }
    // if(newStatus !== undefined && newStatus !== null) {
    //     console.log(`new`);
    //     console.log(newStatus.activities);
    // }
    newStatus.activities.forEach(async(act) => {
        // if(act.type == "LISTENING") {
            // let listenString = `listening to ${act.state} - ${act.details}`;
            // console.log(listenString);
            // msgChannel.send(listenString);
        // }
        // console.log(newStatus);
        if(act.type == "STREAMING") {
            // console.log(newStatus);
            // check if this is twitch or anoter service
            if(botSettings.watchedUserId !== 'all') { // if watchedUser is not set to all 
                if(newStatus.userId !== botSettings.watchedUserId) { // check if it's the watched user id
                    console.log(`Activity did not come from watched user`);
                    log('info', logChannel, `Activity did not come from watched user`);
                    return; 
                }
            }
            let twitchUsername = act.url.replace('https://www.twitch.tv/', '');
            try { 
                if(botSettings.twitchToken == undefined || botSettings.twitchToken === null || botSettings.twitchToken.length < 5) {
                    throw "Twitch token in bot settings invalid";
                }
                const actChannelManager = newStatus.guild.channels;
                const msgChannel = actChannelManager.resolve(botSettings.notificationChannelId);
                const twitchEmbedMsg = await streamingEmbed(twitchUsername, newStatus.user.username);
                if(twitchEmbedMsg !== undefined && msgChannel !== undefined) {
                    if(msgChannel !== null) {
                        let foundMessage = false;
                        for(const key in sentStreamMessages) {
                            if(sentStreamMessages[key].activityId == act.id) {
                                let embedMsgContent = ``;
                                let roleMention = ``;
                                if(botSettings.roleToPing !== 'none') {
                                    roleMention = await newStatus.guild.roles.fetch(botSettings.roleToPing);
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
                                console.log(`Updated activity message`);
                                log('info', logChannel, `Updated activity message`);
                                foundMessage = true;
                            }
                        }
                        if(!foundMessage){
                            let embedMsgContent = ``;
                            let roleMention = ``;
                            if(botSettings.roleToPing !== 'none') {
                                roleMention = await newStatus.guild.roles.fetch(botSettings.roleToPing);
                                embedMsgContent = `${roleMention}`;
                                const streamingMsgId = await msgChannel.send({
                                    content: `${roleMention}`,
                                    embeds: [twitchEmbedMsg],
                                    allowedMentions: {roles: [roleMention.id]}
                                });                                    
                                sentStreamMessages[act.id] = {
                                    activityId: act.id,
                                    msgId: streamingMsgId,
                                    active: true,
                                    twitchUsername: twitchUsername,
                                    discordUsername: newStatus.user.username
                                };                                
                            }
                            else {
                                const streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
                                sentStreamMessages[act.id] = {
                                    activityId: act.id,
                                    msgId: streamingMsgId,
                                    active: true,
                                    twitchUsername: twitchUsername,
                                    discordUsername: newStatus.user.username
                                };
                            }                                                      
                            console.log(`Added activity message to json`);
                            log('info', logChannel, `Added activity message to json`);
                        }
                    }
                }                
            }
            catch(error) {
                console.log(`Error creating streaming embed message: ${error}`);
                log('error', logChannel, `Error creating streaming embed message: ${error}`);
            }
            // cleanup message when user stops streaming?
        }
    });
});
