import { LeagueProvider } from "../LeagueProvider";
import { Team, TeamData } from "./Team";
import { Tournament, TournamentData } from "./Tournament";

export type MatchData = {
    providerId: string;

    date: Date;

    team1: TeamData | null;
    team2: TeamData | null;

    score1: number | null;
    score2: number | null;

    tournament: TournamentData;
};

export class Match implements MatchData {
    providerId: string;

    date: Date;

    team1: Team | null;
    score1: number | null;
    team2: Team | null;
    score2: number | null;

    tournament: Tournament;

    constructor(public readonly provider: LeagueProvider, data: MatchData) {
        this.providerId = data.providerId;

        this.date = data.date;

        this.team1 = data.team1 ? new Team(provider, data.team1) : null;
        this.score1 = data.score1;
        this.team2 = data.team2 ? new Team(provider, data.team2) : null;
        this.score2 = data.score2;

        this.tournament = new Tournament(provider, data.tournament);
    }

    public getUrl(): string {
        return this.provider.getMatchUrl(this);
    }
}