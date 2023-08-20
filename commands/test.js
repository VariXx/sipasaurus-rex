const { SlashCommandBuilder } = require('discord.js');
const botSettings = require('../botSettings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Sipa test')
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('option one')),
    async execute(interaction) {
        // console.log(interaction);
        // console.log(interaction.guild.id);
        // console.log(interaction.channel);
        // const option1String = interaction.options.getString('option1');
        // await interaction.reply({ content: `${interaction.user.username} ran the test command with option1: ${option1String}`, ephemeral: true });

        if(interaction.user.id == interaction.guild.ownerId || interaction.user.id == botSettings.botOwnerID) {
            await interaction.reply('command was from guild or bot owner');
        }
        else {
            await interaction.reply({content : 'Command restricted to guild or bot owner only.', ephemeral: true});
        }
    },
};

// https://discord.js.org/#/docs/builders/main/class/SlashCommandBuilder
