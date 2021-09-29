const { Client, Intents, Message, CommandInteractionOptionResolver } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed } = require('./utils/streamingEmbed');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });

var sentStreamMessages = { };

client.once('ready', () => {
    console.log(`${client.user.username} connected`);
    // client.user.setActivity({name: 'your streaming status', type: 'WATCHING'});

});

client.login(botSettings.discordToken);

client.on('messageCreate', async (msg) => {
    if(msg.author == client.user) { return; } // ignore messages sent by bot
    // if(msg.content.startsWith(botSettings.cmdPrefix)) {
    //     if(msg.content.toLocaleLowerCase() == `!test`) { // find and mention role. ID is not the same as copy id from discord client
    //         const roleMention = await msg.guild.roles.fetch('563995560730951681');
    //         // console.log(roleMention);
    //         msg.channel.send({ 
    //             content: `hello ${roleMention}`,
    //             allowedMentions: {roles: [roleMention.id]}
    //         });
    //     }
    // }
    // if(msg.mentions.users.hasAny(client.user.id)) { // check for mentions
    //     msg.channel.send('huh?');
    // }
    // console.log(msg);
});

client.on('presenceUpdate', async (oldStatus, newStatus) => {
    // console.log(`Old status:`);
    // console.log(oldStatus);
    // console.log(`New status:`);
    // console.log(newStatus);   
    
    newStatus.activities.forEach(async(act) => {
        // if(act.type == "LISTENING") {
            // let listenString = `listening to ${act.state} - ${act.details}`;
            // console.log(listenString);
            // msgChannel.send(listenString);
            // msgChannel.send({ embeds: [streamingEmbed(`Track Change`, `https://acceptdefaults.com`, `${newStatus.user.username}`, `Track Change2`, `${newStatus.user.avatarURL()}`, `${act.state}`, `${act.details}`)]});
            // console.log(act);
            // msgChannel.send(`Activity Start`);
            // for (let a in act) {
            //     msgChannel.send(`${a}: ${act[a]}`);
            // }
            // msgChannel.send(`Activity End`);
        // }
        // console.log(newStatus);
        if(act.type == "STREAMING") {
            // console.log(newStatus);
            // check if this is twitch or anoter service
            if(botSettings.watchedUserId !== 'all') { // if watchedUser is not set to all 
                if(newStatus.userId !== botSettings.watchedUserId) { // check if it's the watched user id
                    console.log(`Activity did not come from watched user`);
                    return; 
                }
            }
            let twitchUsername = act.url.replace('https://www.twitch.tv/', '');
            try { 
                const actChannelManager = newStatus.guild.channels;
                const msgChannel = actChannelManager.resolve(botSettings.notificationChannelId);
                const twitchEmbedMsg = await streamingEmbed(twitchUsername, newStatus.user.username);
                if(twitchEmbedMsg !== undefined && msgChannel !== undefined) {
                    if(msgChannel !== null) {
                        let foundMessage = false;
                        for(const key in sentStreamMessages) {
                            if(sentStreamMessages[key].activityId == act.id) {
                                sentStreamMessages[key].msgId.edit({embeds: [twitchEmbedMsg]});
                                console.log(`Updated activity message`);
                                foundMessage = true;
                            }
                        }
                        if(!foundMessage){
                            const streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
                            sentStreamMessages[act.id] = {
                                activityId: act.id,
                                msgId: streamingMsgId
                            };
                            console.log(`Added activity message to json`);
                        }
                    }
                }                
            }
            catch(error) {
                console.log(`Couldn't find notification channel: ${error}`);
            }
            // cleanup message when user stops streaming?
        }
    });
});
