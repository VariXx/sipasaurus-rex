const { SlashCommandBuilder } = require('discord.js');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hey')
        .setDescription('say hello'),
    async execute(interaction) {
        if(interaction.user.id == botSettings.botOwnerID) {
            if(interaction.client.user.username == "Buzzyflop") { await interaction.reply(`:rabbit:`); }
            else { await interaction.reply(`:t_rex:`); }
            return;
        }
        else {
            // still reply, but only reply to the user that send the command
            if(interaction.client.user.username == "Buzzyflop") { await interaction.reply({ content: `:rabbit:`, ephemeral: true }); }
            else { await interaction.reply({content: `:t_rex:`, ephemeral: true }); }
            return;
        }
    },
};
