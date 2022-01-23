const fs = require('fs');
const util = require('util');
const clipsListDir = require('../botSettings.json').clipsListDir;

function checkConfigDir(configDir) {
    if (!fs.existsSync(configDir)){
        fs.mkdirSync(configDir);
    }
}

async function getClipList(clipsListFilename) {
    const readFile = util.promisify(fs.readFile);
    let clipsListFilepath = `${clipsListDir}${clipsListFilename}.sipa`;
    if(fs.existsSync(clipsListFilepath)) {
        try {
            const clipList = await readFile(clipsListFilepath);
            const clipListString = clipList.toString();
            const clipListArray = clipListString.split(',');
            return clipListArray;
        }
        catch(error) {
            console.log(`Error reading clip list file: ${error}`);
        }
    }
    else {
        console.error(`Could not load file ${clipsListFilepath}`);
    }
}

async function addClip(clipsListFilename, newClip) {
    const appendFile = util.promisify(fs.appendFile);
    try {
        if (!fs.existsSync(clipsListDir)){
            console.log(`Settings directory ${clipsListDir} does not exist. Attempting to create it.`);
            try { 
                fs.mkdirSync(clipsListDir);
                console.log(`Created ${clipsListDir}`);
            }
            catch(error) { 
                console.log(`Error: ${error}`);
            }
        } 
        let clipsListFilepath = `${clipsListDir}${clipsListFilename}.sipa`;
        await appendFile(clipsListFilepath,`${newClip},`);
        console.log(`Added ${newClip} to clip list file`);
    }
    catch(error) {
        console.log(`Error writing clip list file: ${error}`);
    }
}

module.exports.getClipList = getClipList;
module.exports.addClip = addClip;