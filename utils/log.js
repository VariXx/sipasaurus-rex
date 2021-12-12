const { Client, Util } = require('discord.js');

async function log(channel, msg) {
    // get log channel when connecting 
    let escMsg = Util.escapeMarkdown(msg);
    await channel.send(escMsg);
}

module.exports.log = log;