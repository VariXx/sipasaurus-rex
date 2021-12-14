const { Client, Intents } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed } = require('./utils/streamingEmbed');
const { log } = require('./utils/log');
const version = require('./package.json').version;

const { getTwichClips } = require('./utils/twitchApi');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });

var sentStreamMessages = { };
let logChannel = null;

client.once('ready', () => {
    console.log(`${client.user.username} connected`);
    client.user.setActivity({name: `your streaming status | ${version}`, type: 'WATCHING'});
    if(botSettings.logChannel.length > 1) {
        logChannel = client.channels.resolve(botSettings.logChannel);    
        console.log(`Found log channel ${logChannel}`);
        // log('info', logChannel, `Connected`);
    }
    else { console.log(`Log channel not set, skipping lookup`); }
});

client.login(botSettings.discordToken);

client.on('messageCreate', async (msg) => {
    if(msg.author == client.user) { return; } // ignore messages sent by bot
    
    // test command
    if(msg.author.id == botSettings.botOwnerID) {
        if(msg.content == 'sipatest') { // clips test, move this to a function when done testing
            try {
                let clipsResult = await getTwichClips('varixx', botSettings.twitchClientId, botSettings.twitchToken);
                console.log(clipsResult);
                clipsResult.forEach(clip => {
                    console.log(clip.url);
                    // log('info', logChannel, `${clip.url}`);
                    // check if clip has already been sent (text file?)
                    // send if it hasn't been sent and add to text file 
                });
            }
            catch(error) {
                console.log(error);
            }
            // try {
            //     const twitchTestEmbedMsg = await streamingEmbed('rifftrax', msg.author.username);
            //     await msg.channel.send({embeds: [twitchTestEmbedMsg]});
            // }
            // catch(error) {
            //     log('error', logChannel, `Error creating embed message: ${error}`);
            // }            
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
                console.log(`Couldn't find notification channel: ${error}`);
                log('error', logChannel, `Couldn't find notification channel: ${error}`);
            }
            // cleanup message when user stops streaming?
        }
    });
});
