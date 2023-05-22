# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
<!-- _No unreleased changes_ -->

## [1.0.0] - 2023-03-03
### Added
- Added slash commands
- Added startup message in log channel

### Changed
- Updated discord.js to v14

### Fixed
- Fixed bot activity message for discord.js v13/v14

## [0.9.0] - 2023-03-01
### Added
- Added twitch connection test command

### Fixed
- Fixed twitch connection test timer

## [0.8.0] - 2022-05-09
### Added
- Added twitch connection test

### Security
- Updated node-fetch to 2.6.7

## [0.7.0] - 2022-01-05
### Added
- Added status command

### Changed
- Changed clips to work with multiple guilds
- Cleaned up help message formatting

## [0.6.0] - 2022-01-22
### Added 
- Added commands to change settings in chat
- Added support for multiple guilds

### Changed
- Changed commands from prefix to bot mentions
- Changed activity message to use message in bot settings

## [0.5.0] - 2022-01-11
### Added 
- Added offline embed messages when streams go offline
- Added stream markers to twitch api functions. This is not in use yet. 
- Added command for creating twitch token

### Changed
- Changed Twitch API functions. Only the main Twitch API function needs token and client ID. 

## [0.4.1] - 2021-12-17
### Fixed
- Fixed channel used for sending clip links

## [0.4.0] - 2021-12-17
### Added
- Added logging to Discord channel
- Added checking for invalid twitch token in settings
- Added posting new Twitch clips to a Discord channel

## [0.3.0] - 2021-11-28
### Added
- Added version number to activity message

### Removed
- Removed twitch API v5 functions

## [0.2.0] - 2021-11-25
### Changed
- Changed embed thumbnail URL to update cached thumbnail image

## [0.1.1] - 2021-11-11
### Changed
- Changed some twitch API functions to use new API 
- Changed embedded message author to include link and profile picture

## [0.1.0] - 2021-10-04
### Initial Release

[0.8.0]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.8.0
[0.7.0]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.7.0
[0.6.0]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.6.0
[0.5.0]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.5.0
[0.4.1]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.4.1
[0.4.0]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.4.0
[0.3.0]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.3.0
[0.2.0]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.2.0
[0.1.1]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.1.1
[0.1.0]: https://github.com/aosterwyk/sipasaurus-rex/tree/v0.1.0
[Unreleased]: https://github.com/aosterwyk/sipasaurus-rex/compare/master...dev
