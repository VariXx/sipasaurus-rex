const { SlashCommandBuilder } = require('discord.js');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('twitchtoken')
        .setDescription('URL for Twitch token'),
    async execute(interaction) {
        if(interaction.user.id == botSettings.botOwnerID) {
            const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
            interaction.reply({content: `<${tokenUrl}>`, ephemeral: true});
        }
        else {
            interaction.reply({content: `Command restricted to bot owner.`, ephemeral: true});
            return;
        }
    },
};
