import express from "express";
import * as dotenv from "dotenv";
import * as djs from "discord.js";
import signale from "signale";
import * as discordInteractions from "discord-interactions";

import { StudentEsportsClient } from "./Client";

dotenv.config();
const log = signale.scope("entry:web");

const publicKey = process.env.UKSE_WEB_PUBLIC_KEY;
if (!publicKey) {
    log.error("Missing UKSE_WEB_PUBLIC_KEY from environment variables");
    process.exit(1);
}

const port = process.env.PORT && parseInt(process.env.PORT);
if (!port) {
    log.error("Missing PORT from environment variables");
    process.exit(1);
}

const host = process.env.HOST;
if (!host) {
    log.error("Missing HOST from environment variables");
    process.exit(1);
}

const client = new StudentEsportsClient(new djs.Client({ intents: [] }));

const router = express();

router.post("/interactions", discordInteractions.verifyKeyMiddleware(publicKey), (req, res) => {
    const body = req.body;
    (client.discordClient["actions"] as any).InteractionCreate.handle(body);
});

router.listen(port, host, () => {
    log.info(`Listening on ${host}:${port}`);
});