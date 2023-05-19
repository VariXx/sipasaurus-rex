const { SlashCommandBuilder } = require('discord.js');

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
        const option1String = interaction.options.getString('option1');
        await interaction.reply(`${interaction.user.username} ran the test command with option1: ${option1String}`);
    },
};

// https://discord.js.org/#/docs/builders/main/class/SlashCommandBuilder
