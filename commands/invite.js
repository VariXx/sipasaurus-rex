const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('link to add me to a server'),
    async execute(interaction) {
        const inviteUrl = `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=2147994688`; 
        await interaction.reply({ content: `Add me to your server: ${inviteUrl}`, ephemeral: true }); 
        return; 
    },
};
