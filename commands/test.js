const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Sipa test'),
    async execute(interaction) {
        await interaction.reply(`${interaction.user.username} ran the test command`);
    },
};
