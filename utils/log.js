const { Util } = require('discord.js');
const logLevel = require('../botSettings.json').logLevel;
const logChannel = require('../botSettings.json').logChannel;

/*
logLevel
0: off
1: error
2: info
*/

async function log(logType, channel, msg) {
    let logMsg = '';
    let escMsg = Util.escapeMarkdown(msg);    
    if(logType.toLowerCase() == 'info') {
        logMsg = `[Info] ${msg}`;
        if(logLevel > 2 && logChannel.length > 1) {
            await channel.send(escMsg);
        }  
    }  
    else if(logType.toLowerCase() == 'error') {
        logMsg = `[Error] ${msg}`;
        if(logLevel > 1 && logChannel.length > 1) { 
            await channel.send(escMsg);
        }
    }
    console.log(logMsg);
}

module.exports.log = log;