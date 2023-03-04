const { SlashCommandBuilder } = require('discord.js');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purpose')
        .setDescription('What is my purpose?'),
    async execute(interaction) {
        if(interaction.user.id == botSettings.botOwnerID) {
            await interaction.reply(':butter:');
            return;
        }
        else {
            await interaction.reply({content: `Command restricted to bot owner.`, ephemeral: true});
            return;
        }
    },
};
