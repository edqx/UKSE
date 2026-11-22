import { LeagueProvider } from "../LeagueProvider";

export type TournamentData = {
    providerId: string;
    displayName: string;
}

export class Tournament implements TournamentData {
    providerId: string;
    displayName: string;

    constructor(public readonly provider: LeagueProvider, data: TournamentData) {
        this.providerId = data.providerId;
        this.displayName = data.displayName;
    }

    public getUrl(): string {
        return this.provider.getTournamentUrl(this);
    }
}