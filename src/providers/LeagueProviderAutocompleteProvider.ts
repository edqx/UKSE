import Fuse from "fuse.js";

import { LeagueProvider } from "../LeagueProvider";
import { Match, Profile, Team, Tournament, University } from "../types";

export class LeagueProviderAutocompleteProvider implements LeagueProvider {
    private profiles: Map<string, Profile> = new Map;
    private teams: Map<string, Team> = new Map;

    constructor(public readonly provider: LeagueProvider) { }

    public getName(): string {
        return this.provider.getName();
    }

    public getEmoji(): string {
        return this.provider.getEmoji();
    }

    public getProfileUrl(profile: Profile): string {
        return this.provider.getProfileUrl(profile);
    }

    public getTeamUrl(team: Team): string {
        return this.provider.getTeamUrl(team);
    }

    public getUniversityUrl(university: University): string {
        return this.provider.getUniversityUrl(university);
    }

    public getMatchUrl(match: Match): string {
        return this.provider.getMatchUrl(match);
    }

    public getTournamentUrl(tournament: Tournament): string {
        return this.provider.getTournamentUrl(tournament);
    }

    private registerProfileAutoComplete(profile: Profile, depth: number = 0): void {
        this.profiles.set(profile.providerId, profile);
        for (const team of profile.teams) {
            this.registerTeamAutocomplete(team);
            // avoid infinite recursion (player belongs to a team which has that player who belongs to that team which has that player)
            if (depth < 1) {
                for (const player of team.players) {
                    this.registerProfileAutoComplete(player.profile, depth + 1);
                }
            }
        }
    }

    private registerTeamAutocomplete(team: Team): void {
        this.teams.set(team.providerId, team);
    }

    public async searchProfiles(username: string): Promise<Profile[]> {
        const profiles = await this.provider.searchProfiles(username);
        for (const profile of profiles) {
            this.registerProfileAutoComplete(profile);
        }
        return profiles;
    }

    public async searchTeams(name: string): Promise<Team[]> {
        const teams = await this.provider.searchTeams(name);
        for (const team of teams) {
            this.registerTeamAutocomplete(team);
        }
        return teams;
    }

    public async getTeamMatches(teamId: string): Promise<Match[]> {
        const matches = await this.provider.getTeamMatches(teamId);
        for (const match of matches) {
            if (match.team1) this.registerTeamAutocomplete(match.team1);
            if (match.team2) this.registerTeamAutocomplete(match.team2);
        }
        return matches;
    }

    public autocompleteProfiles(searchTerm: string): Profile[] {
        const fuse = new Fuse([...this.profiles.values()], {
            keys: ["providerId", "displayName"],
            threshold: 0.7,
            includeScore: true,
        });
        return fuse.search(searchTerm, { limit: 10 }).map(r => r.item);
    }

    public autocompleteTeams(searchTerm: string): Team[] {
        const fuse = new Fuse([...this.teams.values()], {
            keys: ["providerId", "displayName"],
            threshold: 0.7,
            includeScore: true,
        });
        return fuse.search(searchTerm, { limit: 10 }).map(r => r.item);
    }
}