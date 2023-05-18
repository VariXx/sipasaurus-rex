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
                .setDescription('The Discord channel to post new clips'))
        .addStringOption(option => 
            option.setName('twitchchannel')
                .setDescription('Twitch channel to monitor for new clips'))
        // .addStringOption(option =>
        //     option.setName('option1')
        //         .setDescription('option one'))
        ,
    async execute(interaction) {
        // console.log(interaction.options);
        const clipsEnabled = interaction.options.getBoolean('enabled');
        const clipsDiscordChannel = interaction.options.getChannel('channel');
        const clipsTwitchChannel = interaction.options.getString('twitchchannel');

        if(clipsEnabled !== undefined && clipsEnabled !== null) {
            console.log(clipsEnabled);
            if(clipsEnabled) {
                // enable clips in guild settings
                await interaction.reply({ content: `Clips enabled`, ephemeral: true});
                // TODO - change setting in the bot
            }
            else {
                // disable clips in guild settings
                await interaction.reply({ content: `Clips enabled`, ephemeral: true});
                // TODO - change setting in the bot
            }
        }
        if(clipsDiscordChannel !== undefined && clipsDiscordChannel !== null) {
            console.log(clipsDiscordChannel);
            clipsDiscordChannel.send("I'll start posting clips in this channel.");
            interaction.reply({ content: `Set clips channel to ${clipsDiscordChannel}`, ephemeral: true});
            // TODO - change setting in the bot
        }
        if(clipsTwitchChannel !== undefined && clipsTwitchChannel !== null) {
            await interaction.reply({ content: `Set twitch channel to ${clipsTwitchChannel}`, ephemeral: true});
            // TODO - change setting in the bot
        }
        // const option1String = interaction.options.getString('option1');
        // await interaction.reply(`${interaction.user.username} ran the test command with option1: ${option1String}`);
        // const clipsChanell = interaction.options.getc
    },
};

// https://discord.js.org/#/docs/builders/main/class/SlashCommandBuilder
