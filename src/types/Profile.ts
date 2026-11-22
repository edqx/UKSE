import { LeagueProvider } from "../LeagueProvider";
import { Team, TeamData } from "./Team";
import { University, UniversityData } from "./University";

export type ProfileData = {
    providerId: string;
    displayName: string;

    avatarUrl?: string | null;
    university?: UniversityData | null;

    teams?: TeamData[];
};

export class Profile implements ProfileData {
    providerId: string;

    avatarUrl: string | null;
    displayName: string;

    university: University | null;
    teams: Team[];

    constructor(public provider: LeagueProvider, data: ProfileData) {
        this.providerId = data.providerId;
        this.displayName = data.displayName;

        this.avatarUrl = data.avatarUrl ?? null;
        this.university = data.university ? new University(provider, data.university) : null;

        this.teams = data.teams ? data.teams.map(team => new Team(provider, team)) : [];
    }

    public getUrl(): string {
        return this.provider.getProfileUrl(this);
    }
}