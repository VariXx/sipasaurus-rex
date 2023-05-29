const { SlashCommandBuilder } = require('discord.js');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hey')
        .setDescription('say hello'),
    async execute(interaction) {
        if(interaction.user.id == botSettings.botOwnerID) {
            await interaction.reply(`${botSettings.botIcon}`);
            return;
        }
        else {
            // still reply, but only reply to the user that send the command
            await interaction.reply({ content: `${botSettings.botIcon}`, ephemeral: true });
            return;
        }
    },
};
