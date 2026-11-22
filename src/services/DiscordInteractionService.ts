import * as djs from "discord.js";
import signale from "signale";

import { DiscordMessageFormatService, MatchesTimeRange } from "./DiscordMessageFormatService";
import { LeagueProviderService } from "./LeagueProviderService";
import { Match, Profile, Team } from "../types";

const log = signale.scope("service:interaction");

export class DiscordInteractionService {
    constructor(
        private readonly leagueProviderService: LeagueProviderService,
        private readonly discordMessageFormatService: DiscordMessageFormatService,
    ) { }

    public async handlePlayerSearchInteraction(interaction: djs.ChatInputCommandInteraction): Promise<void> {
        const leagueId = interaction.options.getString("league");
        const searchTerm = interaction.options.getString("username");
        if (!searchTerm) {
            log.warn("Missing 'username' option in /player search interaction");
            return;
        }

        log.debug(`Got /player search interaction (Username: ${searchTerm}, League: ${leagueId})`);

        await interaction.deferReply();

        const league = this.leagueProviderService.leagueFromId(leagueId);
        const providers = this.leagueProviderService.resolveProviderList(league);
        const profiles: Profile[] = [];

        const start = Date.now();
        for (const provider of providers) {
            profiles.push(...await provider.searchProfiles(searchTerm));
        }
        const tookMs = Date.now() - start;

        const message = this.discordMessageFormatService.getProfileSearchResultMessage(tookMs, searchTerm, profiles);
        await interaction.editReply(message);
    }

    public async handleTeamSearchInteraction(interaction: djs.ChatInputCommandInteraction): Promise<void> {
        const leagueId = interaction.options.getString("league");
        const searchTerm = interaction.options.getString("name");
        if (!searchTerm) {
            log.warn("Missing 'name' option in /team search interaction");
            return;
        }

        log.debug(`Got /team search interaction (Name: ${searchTerm}, League: ${leagueId})`);

        await interaction.deferReply();

        const league = this.leagueProviderService.leagueFromId(leagueId);
        const providers = this.leagueProviderService.resolveProviderList(league);
        const teams: Team[] = [];

        const start = Date.now();
        for (const provider of providers) {
            teams.push(...await provider.searchTeams(searchTerm));
        }
        const tookMs = Date.now() - start;

        const message = this.discordMessageFormatService.getTeamSearchResultMessage(tookMs, searchTerm, teams);
        await interaction.editReply(message);
    }

    private matchesTimeRangeFromId(timeRangeId: string | null): MatchesTimeRange | null {
        if (!timeRangeId) return null;
        switch (timeRangeId) {
            case "past": return MatchesTimeRange.Past;
            case "future": return MatchesTimeRange.Future;
            default: return null;
        }
    }

    private getMatchesTimeRangeFilter(timeRange: MatchesTimeRange): (match: Match) => boolean {
        switch (timeRange) {
            case MatchesTimeRange.Past: return match => match.date.getTime() <= Date.now();
            case MatchesTimeRange.Future: return match => match.date.getTime() >= Date.now();
        }
    }

    public async handleTeamMatchesInteraction(interaction: djs.ChatInputCommandInteraction): Promise<void> {
        const leagueId = interaction.options.getString("league");
        const teamId = interaction.options.getString("team");
        const timeRangeId = interaction.options.getString("time-range");
        if (!teamId) {
            log.warn("Missing 'team' option in /team search interaction");
            return;
        }

        log.debug(`Got /team matches interaction (ID: ${teamId}, League: ${leagueId}, Range: ${timeRangeId})`);

        await interaction.deferReply();

        const start = Date.now();

        const league = this.leagueProviderService.leagueFromId(leagueId);
        const timeRange = this.matchesTimeRangeFromId(timeRangeId) ?? MatchesTimeRange.Future;
        const providers = this.leagueProviderService.resolveProviderList(league);
        const matches: Match[] = [];
        for (const provider of providers) {
            const providerMatches = await provider.getTeamMatches(teamId);
            const filter = this.getMatchesTimeRangeFilter(timeRange);
            matches.push(...providerMatches.filter(filter));
        }
        const tookMs = Date.now() - start;

        const message = this.discordMessageFormatService.getMatchesMessage(tookMs, teamId, timeRange, matches);
        await interaction.editReply(message);
    }
}