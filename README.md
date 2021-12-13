# Sipasaurus Rex

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/aosterwyk/sipasaurus-rex?sort=semver)](https://github.com/aosterwyk/sipasaurus-rex/releases) [![GitHub last commit](https://img.shields.io/github/last-commit/aosterwyk/sipasaurus-rex)](https://github.com/aosterwyk/sipasaurus-rex/commits/master) [![GitHub last commit (branch)](https://img.shields.io/github/last-commit/aosterwyk/sipasaurus-rex/dev?label=last%20commit%20%28dev%29)](https://github.com/aosterwyk/sipasaurus-rex/commits/dev) [![Discord](https://img.shields.io/discord/90687557523771392?color=000000&label=%20&logo=discord)](https://discord.gg/QNppY7T) [![Twitch Status](https://img.shields.io/twitch/status/aosterwyk?label=%20&logo=twitch)](https://twitch.tv/aosterwyk) 

<!-- <img src="https://acceptdefaults.com/varibot-twitch-js/varibot.png" align="right" /> -->

Sipasaurus Rex is a discord bot that sends messages when a user is live on twitch based on the user's discord status. 

## Installation
- Download and extract the [latest release](https://github.com/aosterwyk/sipasaurus-rex/releases/latest)
- Install node (tested with 16.10.0)
- Install dependencies `npm install` 
- Copy `botSettings.json.example` to `botSettings.json` (see [botSettings.md](./botSettings.md) for settings)
- Create a bot in the [Discord developer portal](https://discord.com/developers/applications). The bot needs **presence intent** enabled to work correctly. 
- [Register a Twitch application](https://dev.twitch.tv/docs/api/) to get a Twitch client ID and token.
- Start with `npm start` 

## Support
[Discord server](https://discord.gg/QNppY7T) or DM `VariXx#8317`

## License
[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)

