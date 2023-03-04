const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clips')
        .setDescription('Twitch clips settings')
        .addBooleanOption(option => // should these be subcommands?
            option.setName('enabled')
                .setDescription('Enable new clip posts'))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to post new clips'))
        // .addStringOption(option =>
        //     option.setName('option1')
        //         .setDescription('option one'))
        ,
    async execute(interaction) {
        // console.log(interaction.options);
        const clipsEnabled = interaction.options.getBoolean('enabled');
        const clipsChannel = interaction.options.getChannel('channel');
        
        if(clipsEnabled !== undefined && clipsChannel !== null) {
            if(clipsEnabled) {
                // enable clips in guild settings
                interaction.reply({ content: `Clips enabled`, ephemeral: true});
            }
            else {
                // disable clips in guild settings
                interaction.reply({ content: `Clips enabled`, ephemeral: true});
            }
        }
        if(clipsChannel !== undefined && clipsChannel !== null) {
            clipsChannel.send('Set this channel to clips channel');
            interaction.reply({ content: `Set clips channel to ${clipsChannel}`, ephemeral: true});
        }
        // const option1String = interaction.options.getString('option1');
        // await interaction.reply(`${interaction.user.username} ran the test command with option1: ${option1String}`);
        // const clipsChanell = interaction.options.getc
    },
};

// https://discord.js.org/#/docs/builders/main/class/SlashCommandBuilder
