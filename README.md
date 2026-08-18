# 🎵 Zeta Music V1.0.2.0 Lates

A powerful, feature-rich Discord music bot built with Discord.js v14, featuring high-quality audio streaming, 20+ audio filters, web dashboard, and support for multiple music platforms.

## ✨ Features

### 🎶 Music Features
- **Multi-Platform Support**: Play music from YouTube, Spotify, SoundCloud, Apple Music, Deezer, and more
- **High Quality Audio**: Crystal-clear audio streaming with advanced processing
- **Queue Management**: Advanced queue system with shuffle, loop, remove, and skip features
- **24/7 Mode**: Keep music playing non-stop with reliable 24/7 mode
- **Playlist Support**: Play entire playlists from various platforms
- **Lyrics Display**: View real-time synchronized lyrics for your favorite songs
- **Auto-play**: Automatically play similar songs when queue ends
- **History**: View your recently played songs
- **Favorites**: Save and manage your favorite tracks

### 🎚️ Audio Filters
- **20+ Audio Filters**: Bass boost, Nightcore, Daycore, Vaporwave, 8D, 3D, Space, Underwater, and many more
- **Real-time Filter Application**: Apply filters instantly without interrupting playback
- **Customizable Audio**: Adjust speed, pitch, and apply multiple effects

### 🎛️ Advanced Controls
- **Seek & Rewind**: Jump to any point in a track or rewind
- **Volume Control**: Adjust volume from 0-200%
- **Speed Control**: Change playback speed (0.5x - 2x)
- **Pitch Control**: Adjust track pitch in real-time
- **Move Tracks**: Reorder tracks in the queue
- **Forward/Rewind**: Skip forward or backward by seconds

### 🖥️ Web Dashboard
- **Beautiful Interface**: Modern, responsive web dashboard
- **Remote Control**: Control your bot from anywhere
- **Playlist Management**: Create and manage playlists
- **Server Settings**: Configure bot settings via web interface
- **Statistics**: View detailed bot and server statistics

### ⚙️ Configuration
- **Custom Prefix**: Set custom command prefix per server
- **DJ Role System**: Restrict music commands to specific roles
- **Channel Restrictions**: Ignore specific channels
- **Premium System**: Premium features for enhanced experience
- **Blacklist System**: Server and user blacklisting

### 🛠️ Utility Features
- **Purge Commands**: Multiple purge options (messages, embeds, images, links, etc.)
- **Info Commands**: Server info, user info, bot stats, and more
- **Moderation Tools**: Various moderation utilities
- **Logging System**: Comprehensive logging for commands, errors, and events

## 📋 Prerequisites

- **Node.js** v18.0.0 or higher
- **MongoDB** database (local or cloud)
- **Lavalink** server (for audio processing)
- **Discord Bot Token** ([Get one here](https://discord.com/developers/applications))
- **Spotify API** (optional, for Spotify support)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lingneisandev/Zeta-Music-Free-Code.git
   cd Music-Bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Required
   token=YOUR_DISCORD_BOT_TOKEN
   MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
   
   # Optional but recommended
   CLIENT_ID=YOUR_DISCORD_CLIENT_ID
   CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
   SESSION_SECRET=YOUR_RANDOM_SESSION_SECRET
   DASHBOARD_URL=http://localhost:3000
   
   # Music Platform APIs (optional)
   SPOTIFY_ID=YOUR_SPOTIFY_CLIENT_ID
   SPOTIFY_SECRET=YOUR_SPOTIFY_CLIENT_SECRET
   
   # Lavalink Configuration
   LAVALINK_URL=lavalink.jirayu.net:13592
   LAVALINK_PASSWORD=youshallnotpass
   LAVALINK_SECURE=false
   
   # Webhooks (optional)
   ERROR_LOG_WEBHOOK=YOUR_WEBHOOK_URL
   CMD_LOG_WEBHOOK=YOUR_WEBHOOK_URL
   ```

   For a complete list of environment variables, see [ENV_SETUP.md](./ENV_SETUP.md)

4. **Configure Lavalink**
   
   The bot requires a Lavalink server for audio processing. You can:
   - Use the default provided server
   - Set up your own Lavalink server
   - Update the `LAVALINK_URL` and `LAVALINK_PASSWORD` in your `.env` file

5. **Start the bot**
   ```bash
   npm start
   ```
   
   Or use the sharded version:
   ```bash
   node src/Titan.js
   ```

## 📖 Usage

### Basic Commands

**Music Commands:**
- `z!play <song>` - Play a song or playlist
- `z!pause` - Pause the current track
- `z!resume` - Resume playback
- `z!skip` - Skip to the next song
- `z!stop` - Stop playback and clear queue
- `z!queue` - View the current queue
- `z!nowplaying` or `?np` - Show current track info
- `z!volume <1-200>` - Adjust volume
- `z!loop` - Toggle loop mode (off/queue/track)
- `z!shuffle` - Shuffle the queue
- `z!clear` - Clear the queue

**Filter Commands:**
- `z!bassboost` - Apply bass boost filter
- `z!nightcore` - Apply nightcore effect
- `z!daycore` - Apply slowed + reverb effect
- `z!8d` - Apply 8D audio effect
- `z!reset` - Remove all filters
- `z!3d` - Apply 3D audio effect
- `z!space` - Apply space effect
- `z!underwater` - Apply underwater effect
- And many more...

**Configuration Commands:**
- `z!prefix <new_prefix>` - Change bot prefix
- `z!djrole <role>` - Set DJ role
- `z!247` - Toggle 24/7 mode
- `z!ignore <channel>` - Ignore a channel

**Info Commands:**
- `z!help` - Show all commands
- `z!ping` - Check bot latency
- `z!stats` - View bot statistics
- `z!serverinfo` - Get server information
- `z!userinfo [user]` - Get user information

### Command Categories

- **Music** (30+ commands): Play, pause, skip, queue management, etc.
- **Filters** (20+ commands): Audio effects and filters
- **Config** (4 commands): Server configuration
- **Info** (13 commands): Information and statistics
- **Purge** (18 commands): Message management
- **Premium** (4 commands): Premium features
- **Owner** (13 commands): Bot owner commands

For a complete list of commands, use `?help` in Discord.

## 🖥️ Web Dashboard

The bot includes a beautiful web dashboard for remote control and management.

1. **Access the Dashboard**
   - Default URL: `http://localhost:3000`
   - Configure `DASHBOARD_URL` in your `.env` file

2. **Features**
   - Control music playback
   - Manage playlists
   - View server statistics
   - Configure bot settings
   - View queue and history

3. **Authentication**
   - Login with Discord OAuth
   - Requires `CLIENT_ID` and `CLIENT_SECRET` in `.env`

## 🏗️ Project Structure

```
Music-Bot/
├── src/
│   ├── commands/          # Bot commands
│   │   ├── Music/         # Music commands
│   │   ├── Filters/       # Audio filter commands
│   │   ├── Config/        # Configuration commands
│   │   ├── Info/          # Information commands
│   │   ├── Purge/         # Purge commands
│   │   ├── Premium/       # Premium commands
│   │   └── Owner/         # Owner commands
│   ├── components/        # UI components
│   ├── config/            # Configuration files
│   ├── events/            # Event handlers
│   ├── handlers/          # Command/event handlers
│   ├── models/            # Database models
│   ├── structure/         # Core client structure
│   ├── utils/             # Utility functions
│   ├── web/               # Web dashboard
│   ├── index.js           # Main entry point
│   └── Titan.js           # Sharded entry point
├── assets/                # Bot assets
├── fonts/                 # Custom fonts
├── .gitignore
├── package.json
├── ENV_SETUP.md          # Environment setup guide
└── README.md
```

## 🔧 Configuration

### Setting Up DJ Role

1. Create a role in your Discord server
2. Use `z!djrole @role` to set it
3. Users with this role can control music

### Enabling 24/7 Mode

1. Use `z!247` command
2. Bot will stay in voice channel 24/7
3. Music will continue playing even if everyone leaves

### Custom Prefix

1. Use `z!prefix <new_prefix>` to change prefix
2. Example: `z!prefix !` changes prefix to `!`
3. Prefix is per-server

## 📝 Requirements

- Node.js v18+
- MongoDB database
- Lavalink server
- Discord Bot Token
- (Optional) Spotify API credentials
- (Optional) Top.gg API key

## 🤝 Support

- **Discord Server**: [Join our support server](https://discord.gg/VMbqMG7nUq)
- **Issues**: [GitHub Issues](https://github.com/titanxdevz/Music-Bot/issues)

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Titandevz**

## ⚙️ Modifed

**lingneisandev**

## 🙏 Acknowledgments

- Built with [Discord.js](https://discord.js.org/)
- Music powered by [Kazagumo](https://github.com/Tomato6966/Kazagumo)
- Audio processing via [Lavalink](https://github.com/lavalink-devs/Lavalink)
- UI components using Discord Components v2

## ⚠️ Important Notes

- This bot requires a Lavalink server to function
- Make sure your bot has proper permissions in Discord
- The bot uses sharding for better performance with large bot lists
- Web dashboard requires OAuth setup for full functionality

---

**Made with ❤️ by Titandevz and Beta tester by Hololive Helper Development**

