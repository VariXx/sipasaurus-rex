const fs = require('fs');
const util = require('util');
const streamMessagesFilePath = require('../botSettings.json').streamMessagesFilePath;

async function getStreamMessages() {
    // read and return json
    let returnStreamMessages = {};
    const readFile = util.promisify(fs.readFile);
    if(fs.existsSync(streamMessagesFilePath)) {
        try {
            const streamMessages = await readFile(streamMessagesFilePath);
            returnStreamMessages = JSON.parse(streamMessages);
            return returnStreamMessages;
        }
        catch(error) {
            console.log(error);
            return undefined;
        }
    }
    else {
        // file doesn't exist - should this exit or return blank?
        return {}; 
    }   
}

async function writeStreamMessages(newMsg) {
    try {
        fs.writeFileSync(streamMessagesFilePath,JSON.stringify(newMsg));
        return true;
    }
    catch(error) {
        console.log(error);
        return false;
    }
}

module.exports.getStreamMessages = getStreamMessages;
module.exports.writeStreamMessages = writeStreamMessages;
