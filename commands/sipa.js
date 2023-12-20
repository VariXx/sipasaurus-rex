const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const botSettings = require('../botSettings.json');
const { checkTwitchConnection } = require('../utils/checkTwitchConnection');
const { getVStreamChannelInfo } = require('../utils/vStreamAPI');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sipa')
        .setDescription('Sipa Settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.MANAGE_GUILD)        
        .addSubcommand(subcommand =>
            subcommand
                .setName('twitchtoken')
                .setDescription('Get Twitch token URL'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('twitchtokentest')
                .setDescription('Test Twitch token'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('vstreamtokentest')
                .setDescription('Test vStream token'))
                                
        ,
    async execute(interaction) {
        if(interaction.user.id == botSettings.botOwnerID) {
            if(interaction.options.getSubcommand() === 'twitchtoken') {
                const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
                await interaction.reply({content: `<${tokenUrl}>`, ephemeral: true});
                return;
            }
            if(interaction.options.getSubcommand() === 'twitchtokentest') {
                const twitchStatus = await checkTwitchConnection();
                let checkMsg = `Twitch token status: `;
                if(twitchStatus) { 
                    checkMsg += `:white_check_mark:`;
                }
                else { 
                    const tokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${botSettings.twitchClientId}&redirect_uri=https://acceptdefaults.com/twitch-oauth-token-generator/&response_type=token&scope=user:read:broadcast`;
                    checkMsg += `:no_entry_sign: Renew token <${tokenUrl}>`; 
                }
                await interaction.reply(checkMsg);
                return;
            }
            if(interaction.options.getSubcommand() === 'vstreamtokentest') {
                const vStreamTokenTest = await getVStreamChannelInfo('varixx');
                let checkMsg = `vStream token status: `;
                if(vStreamTokenTest) {
                    checkMsg += `:white_check_mark:`;
                }
                else {
                    checkMsg += `:no_entry_sign: TODO - renew token if you get this message`; 
                }                    
                await interaction.reply(checkMsg);
                return;
            }
        }
        else {
            await interaction.reply({content: `Command restricted to bot owner.`, ephemeral: true});
            return;
        }
    },
};
