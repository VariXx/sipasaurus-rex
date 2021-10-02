# Sipasaurus Rex

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/varixx/sipasaurus-rex?sort=semver)](https://github.com/VariXx/sipasaurus-rex/releases) [![GitHub last commit](https://img.shields.io/github/last-commit/varixx/sipasaurus-rex)](https://github.com/VariXx/sipasaurus-rex/commits/master) [![GitHub last commit (branch)](https://img.shields.io/github/last-commit/varixx/sipasaurus-rex/develop?label=last%20commit%20%28dev%29)](https://github.com/VariXx/sipasaurus-rex/commits/develop) [![Discord](https://img.shields.io/discord/90687557523771392?color=000000&label=%20&logo=discord)](https://discord.gg/QNppY7T) [![Twitch Status](https://img.shields.io/twitch/status/varixx?label=%20&logo=twitch)](https://twitch.tv/VariXx) 

<!-- <img src="https://acceptdefaults.com/varibot-twitch-js/varibot.png" align="right" /> -->

Sipasaurus Rex is a discord bot that sends messages when a user is live on twitch based on the user's discord status. 

## Installation
- Download and extract the [latest release](https://github.com/VariXx/sipasaurus-rex/releases/latest)
- Install node (tested with 16.10.0)
- Install dependencies `npm install` 
- Copy `botSettings.json.example` to `botSettings.json` (see [botSettings section](#botsettingsjson) for settings)
- Create a bot in the [Discord developer portal](https://discord.com/developers/applications). The bot needs **presence intent** enabled to work correctly. 
- [Register a Twitch application](https://dev.twitch.tv/docs/api/) to get a Twitch client ID and token.
- Start with `npm start` 

### botSettings.json
- **discordToken**: Discord token used by the bot. You can find this in the [Discord developer portal](https://discord.com/developers/applications). 
- **cmdPrefix**: Command prefix used by the bot. Changing this to "/" will **not** enable slash commands. 
- **notificationChannelId**: Discord channel ID to send streaming notification message. You can find this by enabling developer options in Discord and right clicking the channel. 
- **roleToPing**: Role to ping in streaming notification message. Set to "none" for no role mention. You can find this by opening the roles list in server settings and clicking "Copy ID" in the role options.
- **twitchClientId**: Twitch client ID. This is used to pull stream information used in the message.
- **twitchToken**: Twitch token. This is used to pull stream information used in the message.
- **watchedUserId**: (optional) User to watch. Set to 'all' if you want the bot to send messages for all users. 

## Support
[Discord server](https://discord.gg/QNppY7T) or DM `VariXx#8317`

## License
[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)

