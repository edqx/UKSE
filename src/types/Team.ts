import { LeagueProvider } from "../LeagueProvider";
import { Profile, ProfileData } from "./Profile";
import { University, UniversityData } from "./University";

export type TeamData = {
    providerId: string;
    displayName: string;

    avatarUrl?: string | null;
    countryName?: string | null;
    gameName?: string | null;
    university?: UniversityData | null;

    players?: TeamPlayerData[];
};

export type TeamPlayerData = {
    profile: ProfileData;
    isCaptain: boolean;
};

export class Team implements TeamData {
    providerId: string;

    avatarUrl: string | null;
    displayName: string;
    countryName: string | null;
    gameName: string | null;

    university: University | null;

    players: Player[];

    constructor(public readonly provider: LeagueProvider, data: TeamData) {
        this.providerId = data.providerId;
        this.displayName = data.displayName;

        this.avatarUrl = data.avatarUrl ?? null;
        this.countryName = data.countryName ?? null;
        this.gameName = data.gameName ?? null;
        this.university = data.university ? new University(provider, data.university) : null;

        this.players = data.players ? data.players.map(playerData => new Player(provider, playerData)) : [];
    }

    public getUrl(): string {
        return this.provider.getTeamUrl(this);
    }
}

export class Player {
    profile: Profile;
    isCaptain: boolean;

    constructor(public readonly provider: LeagueProvider, data: TeamPlayerData) {
        this.profile = new Profile(provider, data.profile);
        this.isCaptain = data.isCaptain;
    }
}