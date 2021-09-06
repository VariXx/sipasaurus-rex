const { Client, Intents} = require('discord.js');
const botSettings = require('./botSettings.json');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
    console.log('ready');
});

client.login(botSettings.token);

client.on('messageCreate', msg => {
    console.log(msg);
    if(msg.content.startsWith(botSettings.cmdPrefix)) {
        console.log(`this was a command`);
    }
    else {
        console.log(`message does not start with command prefix, ignoring`);   
    }
});


