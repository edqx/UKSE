import * as djs from "discord.js";
import signale from "signale";

import { DiscordInteractionService, DiscordMessageFormatService, LeagueProviderService } from "./services";

const log = signale.scope("client");

export class StudentEsportsClient {
    private leagueProviderService: LeagueProviderService;

    private discordMessageFormatService: DiscordMessageFormatService;
    private discordInteractionService: DiscordInteractionService;

    constructor(public readonly discordClient: djs.Client) {
        discordClient.on(djs.Events.InteractionCreate, async interaction => {
            await this.handleInteractionCreate(interaction);
        });

        this.leagueProviderService = new LeagueProviderService;
        this.discordMessageFormatService = new DiscordMessageFormatService;
        this.discordInteractionService = new DiscordInteractionService(this.leagueProviderService, this.discordMessageFormatService);
    }

    private async handleInteractionCreate(interaction: djs.Interaction): Promise<void> {
        if (interaction.isAutocomplete()) {
            const leagueId = interaction.options.getString("league");
            const teamId = interaction.options.getString("team");
            const league = this.leagueProviderService.leagueFromId(leagueId);
            if (league === null) {
                await interaction.respond([]);
                return;
            }

            const autocompleteProvider = this.leagueProviderService.getAutocompleteProvider(league);
            const teams = autocompleteProvider.autocompleteTeams(teamId || "");
            await interaction.respond(teams.map(t => ({
                name: t.gameName
                    ? `${t.displayName} (${t.gameName})`
                    : t.displayName,
                value: t.providerId,
            })));
            return;
        }

        if (interaction.isChatInputCommand()) {
            const subCommand = interaction.options.getSubcommand(false);
            if (interaction.commandName === "player") {
                if (subCommand === "search") {
                    await this.discordInteractionService.handlePlayerSearchInteraction(interaction);
                }
            } else if (interaction.commandName === "team") {
                if (subCommand === "search") {
                    await this.discordInteractionService.handleTeamSearchInteraction(interaction);
                } else if (subCommand === "matches") {
                    await this.discordInteractionService.handleTeamMatchesInteraction(interaction);
                }
            }
            return;
        }
    }
}