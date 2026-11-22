import { LeagueProvider } from "../LeagueProvider";

export type UniversityData = {
    providerId: string;
    displayName: string;
};

export class University implements UniversityData {
    providerId: string;
    displayName: string;

    constructor(public readonly provider: LeagueProvider, data: UniversityData) {
        this.providerId = data.providerId;
        this.displayName = data.displayName;
    }

    public getUrl(): string {
        return this.provider.getUniversityUrl(this);
    }
}