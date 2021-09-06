const { Client, Intents } = require('discord.js');
const botSettings = require('./botSettings.json');
const { streamingEmbed } = require('./utils/streamingEmbed');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });

client.once('ready', () => {
    console.log('ready');
});

client.login(botSettings.token);

client.on('messageCreate', async (msg) => {
    if(msg.author == client.user) { return; } // ignore messages sent by bot
    if(msg.content.startsWith(botSettings.cmdPrefix)) {
        if(msg.content.toLocaleLowerCase() == `!test`) {
            // let testMsg = await streamingEmbed('varixx', `${msg.author.username} is live`, client.user.username, client.user.avatarURL());
            // if(testMsg !== undefined) { msg.channel.send({embeds: [testMsg]}); }
            console.log(msg.author);
        }
    }
});

client.on('presenceUpdate', (oldStatus, newStatus) => {
    // console.log(`Old status:`);
    // console.log(oldStatus);
    // console.log(`New status:`);
    // console.log(newStatus);   
    
    const msgChannel = newStatus.guild.channels.resolve(botSettings.notificationChannelId);
    newStatus.activities.forEach(act => {
        if(act.type == "LISTENING") {
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
        }
        if(act.type == "STREAMING") {
            console.log(act);
            msgChannel.send(`Activity Start`);
            for (let a in act) {
                msgChannel.send(`${a}: ${act[a]}`);
            }
            msgChannel.send(`Activity End`);            
            // let streamingEmbedMsg = await streamingEmbed();
            // msgChannel.send({ embeds: [streamingEmbed(`${act.details}`, `${act.url}`, `${newStatus.user.username} is live!`, `Playing: ${act.state}`, `${newStatus.user.avatarURL()}`,
        }
    });
    // console.log(newStatus.activities[0].type);

    // twitch
    // {
    //     "details": "24H RL Stream for Charity",
    //     "state": "Rocket League",
    //     "name": "Twitch",
    //     "type": 1,
    //     "url": "https://www.twitch.tv/discord"
    // }

});
