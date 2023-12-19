# botSettings.json
## discordToken
Discord token used by the bot. You can find this in the [Discord developer portal](https://discord.com/developers/applications). 

## discordClientId 
Discord client ID used by the bot. You can find this in the [Discord developer portal](https://discord.com/developers/applications). 

## cmdPrefix
Command prefix used by the bot. Changing this to "/" will **not** enable slash commands. 

## notificationChannelId
Discord channel ID to send streaming notification message. You can find this by enabling developer options in Discord and right clicking the channel. 

## roleToPing (optional)
Role to ping in streaming notification message. Set to "none" for no role mention. You can find this by opening the roles list in server settings and clicking "Copy ID" in the role options.

## twitchClientId
Twitch client ID. This is used to pull stream information used in the message.

## twitchToken
Twitch token. This is used to pull stream information used in the message.

<!-- ## watchedUserId (optional)
User to watch. Set to "all" if you want the bot to send messages for all users.  -->

## logChannel 
Channel ID used for sending log messages

## logLevel 
0: off
1: error
2: info

## botOwnerID 
Bot owner's user ID. Used for testing. Can be left as "" unless needed. 

## checkTwitchClips
true or false
Enable posting new clips from Twitch. Do not surround in quotes.

## twitchClipsChannel
Twitch channel name to watch for new clips 

## discordClipsChannel
Discord channel ID to post new clips 

## clipsCheckTime 
Check for new clips every X minutes. Do not surround in quotes. 


