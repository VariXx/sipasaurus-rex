const { Client, Intents, Message } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed } = require('./utils/streamingEmbed');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });

var sentStreamMessages = { };

client.once('ready', () => {
    console.log(`${client.user.username} connected`);
    client.user.setActivity({name: 'your streaming status', type: 'WATCHING'});
});

client.login(botSettings.token);

client.on('messageCreate', async (msg) => {
    if(msg.author == client.user) { return; } // ignore messages sent by bot
    if(msg.content.startsWith(botSettings.cmdPrefix)) {
        if(msg.content.toLocaleLowerCase() == `!test`) {
            try {
                const msgChannel = msg.guild.channels.resolve(botSettings.notificationChannelId);
                msgChannel.send(`Kifflom!`);
            }
            catch(error) {
                console.log(error);
            }
            // let testMsg = await streamingEmbed('varixx', `${msg.author.username} is live`, client.user.username, client.user.avatarURL());
            // if(testMsg !== undefined) { msg.channel.send({embeds: [testMsg]}); }
            console.log(msg.author);
        }
    }
});

client.on('presenceUpdate', async (oldStatus, newStatus) => {
    // console.log(`Old status:`);
    // console.log(oldStatus);
    // console.log(`New status:`);
    // console.log(newStatus);   
    
    newStatus.activities.forEach( async (act) => {
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
        if(act.type == "STREAMING") { 
            // console.log(newStatus);
            // console.log(act);
            // check if this is enabled for the guild and if the user is on the enabled list 
            const twitchUsername = act.url.replace('https://www.twitch.tv/', '');
            try { 
                const actChannelManager = newStatus.guild.channels;
                const msgChannel = actChannelManager.resolve(botSettings.notificationChannelId);
                const twitchEmbedMsg = await streamingEmbed(twitchUsername, newStatus.user.username, client.user.username, client.user.avatarURL());
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
                            let streamingMsgId = await msgChannel.send({embeds: [twitchEmbedMsg]});
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
        }
    });
});
