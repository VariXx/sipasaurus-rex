const fs = require('fs');
const { getAllGuildSettings } = require('./getGuildSettings');
const guildsSettingsDir = require('../botSettings.json').guildSettingsDir

function checkConfigDir(configDir) {
    if (!fs.existsSync(configDir)){
        fs.mkdirSync(configDir);
    }
}

async function setGuildSetting(guildSettingsFilename, setting, newValue) {
    let newSettings = {}; 
    let guildSettingsFilePath = `${guildsSettingsDir}${guildSettingsFilename}.sipa`;
    // check if settings dir exists
    if (!fs.existsSync(guildsSettingsDir)){
        console.log(`Settings directory ${guildsSettingsDir} does not exist. Attempting to create it.`);
        try { 
            fs.mkdirSync(guildsSettingsDir);
            console.log(`Created ${guildsSettingsDir}`);
        }
        catch(error) { 
            console.log(`Error: ${error}`);
        }
    }
    
    if(fs.existsSync(guildSettingsFilePath)) {
        let foundSetting = false;
        const oldSettings = await getAllGuildSettings(guildSettingsFilename);
        for(let key in oldSettings) {
            if(key == setting) { 
                newSettings[key] = newValue;
                foundSetting = true;
            }
            else {
                newSettings[key] = oldSettings[key];
            }
        }
        if(!foundSetting) {
            newSettings[setting] = newValue;
        }
    }
    else {
        newSettings[setting] = newValue;
    }
    try {
        fs.writeFileSync(guildSettingsFilePath,JSON.stringify(newSettings));
        return true;
    }
    catch(error) {
        console.log(error);
        return false;
    }
}

module.exports.setGuildSetting = setGuildSetting;