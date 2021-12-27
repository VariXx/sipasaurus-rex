const { Client, Intents } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed, doneStreamingEmbed } = require('./utils/streamingEmbed');
const { log } = require('./utils/log');
const version = require('./package.json').version;
const { getClipList, addClip } = require('./utils/clipList');

const { getTwichClips, getStreamMakers, getTwitchVideos } = require('./utils/twitchApi');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });

var sentStreamMessages = { };
var logChannel = null;
var discordClipsChannel = null;
var clipsCheckTime = 60*60000; // default to 1 hour
var clipsChecker; 
var sentTestMessages = {}; 

async function checkTwitchClips() {
    try {
        let clipsResult = await getTwichClips(botSettings.twitchClipsChannel, botSettings.twitchClientId, botSettings.twitchToken);
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
        // if(msg.content == 'st') { // clips test, move this to a function when done testing
        //     if(botSettings.postTwitchClips) { 
        //         try {
        //             let clipsResult = await getTwichClips('varixx', botSettings.twitchClientId, botSettings.twitchToken);
        //             const clipList = await getClipList();
        //             clipsResult.forEach(async (clip) => {
        //                 console.log(clip.id);
        //                 let foundClip = false;
        //                 if(clipList !== undefined) {
        //                     if(clipList.includes(clip.id)) {
        //                         console.log(`Found clip ${clip.id} in list, skipping.`);
        //                         log('info', logChannel, `Found clip ${clip.id} in list, skipping.`);
        //                         foundClip = true;
        //                     }
        //                 }
        //                 if(!foundClip) {
        //                     await addClip(clip.id);
        //                     logChannel.send(`${clip.url}`);
        //                 }
        //             });
        //         }
        //         catch(error) {
        //             console.log(error);
        //         }
        //     }
        // }
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
                let doneMsg = await doneStreamingEmbed('varixx','test user');
                sentTestMessages[0].msgId.edit({embeds: [doneMsg]});
            }
            catch(error) {
                console.log(error);
            }
        }
        if(msg.content == 'mtest') {
            try {
                await getStreamMakers('varixx', botSettings.twitchClientId, botSettings.twitchToken);
            }
            catch(error) {
                console.log(error);
            }
        }
        if(msg.content == 'vtest') {
            try { 
                await getTwitchVideos('varixx', botSettings.twitchClientId, botSettings.twitchToken);
            }
            catch(error)
            {
                console.log(error);
            }
        }
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
                                    msgId: streamingMsgId
                                };                                
                            }
                            else {
                                const streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
                                sentStreamMessages[act.id] = {
                                    activityId: act.id,
                                    msgId: streamingMsgId
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
