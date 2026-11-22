# UK Student Esports
This is a Discord bot for querying different UK student esports platforms, because they all unfortunately suck.

## Supported Platforms
- [National Student Esports](https://nse.gg)
- [University Student Showdown](https://ussesports.com)

## Environment
Define these either in a `.env` file or in your system:
```env
# The ID of an application to upload commands to
UKSE_CLIENT_ID=
# The ID of a guild to upload test commands to for development
UKSE_DEV_GUILD_ID=

# The private bot client token
UKSE_BOT_TOKEN=

# The TCP port to listen on
PORT=
# The network interface to listen on
HOST=
# Your application's client public key
UKSE_WEB_PUBLIC_KEY=
```

## How to Run
- Run `pnpm install`.
- Run `pnpm dev:refresh [--dev]` to upload the register the commands on Discord.
- Run `pnpm dev:web` to accept interactions via a Discord [webhook](https://docs.discord.com/developers/interactions/overview#configuring-an-interactions-endpoint-url). You must host this on a public 