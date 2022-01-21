const { Client, Intents } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed, offlineStreamingEmbed } = require('./utils/streamingEmbed');
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

client.login(botSettings.discordToken);

client.on('messageCreate', async (msg) => {
    if(msg.author == client.user) { return; } // ignore messages sent by bot
    if(msg.author.id == botSettings.botOwnerID) {
        // const cmd = msg.content.split(' ');
        if(msg.content == 'twitchToken') {
            const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
            msg.channel.send(`Don't click this unless you asked for it: <${tokenUrl}>`);
        }
        if(msg.conten = 'buzzyLink') {
            const inviteUrl = `https://discordapp.com/oauth2/authorize?client_id=697816077547339797&scope=bot&permissions=2147994688`; 
            msg.channel.send(`Buzzyflop invite: ${inviteUrl}`);
        }
        // if(msg.content == 'showlist') {
        //     console.log(sentStreamMessages);
        // }
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
                                    let updatedMsgLog = `Updated activity (${act.id}) message`;
                                    console.log(updatedMsgLog);
                                    log('info', logChannel, updatedMsgLog);
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
            else {
                console.log(`Streaming activity name ${act.name} is not twitch, ignoring.`);
                console.log(act);
            }
        }
    });
});
