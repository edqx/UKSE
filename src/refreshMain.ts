import * as djs from "discord.js";
import * as dotenv from "dotenv";
import signale from "signale";

import { commands } from "./commands";

dotenv.config();
const dev = process.argv.includes("--dev");

const log = signale.scope("entry:refresh");

const clientId = process.env.UKSE_CLIENT_ID;
if (!clientId) {
    log.error("Missing UKSE_CLIENT_ID from environment variables");
    process.exit(1);
}
const devGuildId = process.env.UKSE_DEV_GUILD_ID;
if (!devGuildId) {
    log.error("Missing UKSE_DEV_GUILD_ID from environment variables");
    process.exit(1);
}
const botToken = process.env.BOT_TOKEN;
if (!botToken) {
    log.error("Missing UKSE_BOT_TOKEN from environment variables");
    process.exit(1);
}

(async () => {
    log.pending("Refreshing commands..");

    const rest = new djs.REST;
    rest.setToken(botToken);

    if (dev) {
        await rest.put(djs.Routes.applicationGuildCommands(clientId, devGuildId), {
            body: commands,
        });
    } else {
        await rest.put(djs.Routes.applicationCommands(clientId), {
            body: commands,
        });
    }

    log.success("Successfully refreshed commands");
})();