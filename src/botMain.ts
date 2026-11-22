import * as djs from "discord.js";
import * as dotenv from "dotenv";
import signale from "signale";

import { StudentEsportsClient } from "./Client";

dotenv.config();
const log = signale.scope("entry:bot");

const botToken = process.env.UKSE_BOT_TOKEN;
if (!botToken) {
    log.error("Missing UKSE_BOT_TOKEN from environment variables");
    process.exit(1);
}

(async () => {
    const client = new StudentEsportsClient(new djs.Client({ intents: [djs.GatewayIntentBits.Guilds] }));

    client.discordClient.on(djs.Events.ClientReady, async () => {
        if (client.discordClient.user) {
            log.info(`Bot client ready! (Username: ${client.discordClient.user.username})`);
        } else {
            log.warn("Bot client ready but has no 'user' property");
        }
    });

    log.debug("Logging in..");
    await client.discordClient.login(botToken);
})();