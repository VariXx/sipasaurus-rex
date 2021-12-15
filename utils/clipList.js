const fs = require('fs');
const util = require('util');
const clipListFilename = './clipList.sipa';

async function getClipList() {
    const readFile = util.promisify(fs.readFile);
    if(fs.existsSync(clipListFilename)) {
        try {
            const clipList = await readFile(clipListFilename);
            const clipListString = clipList.toString();
            const clipListArray = clipListString.split(',');
            return clipListArray;
        }
        catch(error) {
            console.log(`Error reading clip list file: ${error}`);
        }
    }
    else {
        console.error(`Could not load file ${clipListFilename}`);
    }
}

async function addClip(newClip) {
    const appendFile = util.promisify(fs.appendFile);
    try {
        await appendFile(clipListFilename,`${newClip},`);
        console.log(`Added ${newClip} to clip list file`);
    }
    catch(error) {
        console.log(`Error writing clip list file: ${error}`);
    }
}

module.exports.getClipList = getClipList;
module.exports.addClip = addClip;