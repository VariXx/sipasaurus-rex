const { SlashCommandBuilder } = require('discord.js');
const { helpEmbed } = require('../utils/helpEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Sipa commands'),
    async execute(interaction) {
        const helpMsg = await helpEmbed(interaction.user.username);
        await interaction.reply({embeds: [helpMsg], ephemeral: true});
        return;
    },
};
