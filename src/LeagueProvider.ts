import { Match, Player, Profile, Team, Tournament, University } from "./types";

export interface LeagueProvider {
    getName(): string;
    getEmoji(): string;

    getProfileUrl(profile: Profile): string;
    getTeamUrl(team: Team): string;
    getUniversityUrl(university: University): string;
    getMatchUrl(match: Match): string;
    getTournamentUrl(tournament: Tournament): string;

    searchProfiles(username: string): Promise<Profile[]>;

    searchTeams(name: string): Promise<Team[]>;
    getTeamMatches(teamId: string): Promise<Match[]>;
}