import signale from "signale";

import { LeagueProvider } from "../LeagueProvider";
import { Match, MatchData, Profile, ProfileData, Team, TeamData, Tournament, TournamentData, University } from "../types";

const webBaseUrl = `https://ussesports.com`;
const apiBaseUrl = `https://api.ussesports.com`;

const log = signale.scope("provider:uss");

type USSEsportsTournamentsJson = {
    count: number;
    tournaments: {
        id: number;
        name: string;
        description: string;
        startTime: string;
        signupsCloseTime: string;
        endTime: string;
        active: boolean;
        game: {
            id: number;
            name: string;
        };
        teams: {
            id: number;
            name: string;
            players: {
                id: number;
                displayName: string;
                captain: boolean;
            }[];
            wins: number;
            losses: number;
            seed: number;
        }[];
    }[];
};

type USSEsportsProfileJson = {
    id: number;
    displayName: string;
    streamName: string;
    createdAt: string;
    pronouns: string;
    permissionLevel: number;
    studentStatus: number;
    university: {
        id: number;
        name: string;
        societyName: string;
    }
    connections: {
        discord: string;
        battleNet: string;
        epicGames: string;
        riotGames: string;
        steam: string;
    };
    teams: {
        id: number;
        name: string;
        game: string;
        captain: number;
        playerCount: number;
    }[];
};

type USSEsportsTeamJson = {
    id: number;
    name: string;
    game: number;
    gameName: string;
    university: number;
    universityName: string;
    joinCode: string | null;
    captain: number;
    teamColour: string;
    teamType: number;
    createdAt: string;
    inCurrentTournament: boolean;
    teamMembers: {
        id: number;
        displayName: string;
        captain: boolean;
        playerRank: number;
        permissions: number;
        connections: {
            discord: string;
            battleNet: string;
            epicGames: string;
            riotGames: string;
            steam: string;
        };
    }[];
};

type USSEsportsTournamentJson = {
    id: number;
    name: string;
    description: string;
    rules: string;
    startTime: string;
    signupsCloseTime: string;
    endTime: string;
    mapPool: string;
    qualifierType: number;
    playoffType: number;
    tournamentType: number;
    swissRounds: number;
    roundBulk: number;
    checkInsOpen: boolean;
    checkInsRequired: boolean;
    active: boolean;
    divisionCount: number;
    divisionSize: number;
    seedRuleBuckets: {
        startSeed: number;
        endSeed: number;
        bonusWins: number;
        bonusLosses: number;
    }[];
    seedingLocked: boolean;
    game: {
        id: number;
        name: string;
        platform: string;
        teamSize: number;
        maxTeamSize: number;
        hasMapPool: boolean;
        showMapDiff: boolean;
    };
    teams: {
        teamId: number;
        teamName: string;
        checkedIn: boolean;
        wins: number;
        losses: number;
        mapWins: number;
        mapLosses: number;
        omwp: number;
        playoffsEligible: boolean;
        initialSeed: number;
        division: number;
        divisionSeed: number;
        position: number;
        university: {
            id: number;
            name: string;
            societyName: string;
        };
        players: {
            id: number;
            displayName: string;
            captain: boolean;
            playerRank: number;
            connections: {
                discord: string;
                battleNet: string;
                epicGames: string;
                riotGames: string;
                steam: string;
            };
        }
    }[];
    swissMatches: {
        id: number;
        week: number;
        round: number;
        winnerMatchId: number | null;
        awaySourceMatchId: number | null;
        awaySourceIsWinner: boolean | null;
        homeSourceMatchId: number | null;
        homeSourceIsWinner: boolean | null;
        loserMatchId: number | null;
        startTime: string;
        homeTeam: {
            id: number;
            name: string;
            homeTeamSeed: number;
            homeTeamPosition: number;
        } | null;
        awayTeam: {
            id: number;
            name: string;
            awayTeamSeed: number;
            awayTeamPosition: number;
        } | null;
        scoreHome: number;
        scoreAway: number;
        bestOf: number;
        completed: boolean;
        isBye: boolean;
        winnerTeamId: number;
    }[];
    playoffMatches: {
        id: number;
        division: number;
        round: number;
        slot: number;
        upperBracket: boolean;
        startTime: string;
        winnerMatchId: number | null;
        loserMatchId: number | null;
        homeTeam: {
            id: number;
            name: string;
            seed: number;
        } | null;
        awayTeam: {
            id: number;
            name: string;
            seed: number;
        } | null;
        scoreHome: number;
        scoreAway: number;
        bestOf: number;
        isBye: boolean;
        completed: boolean;
    }[];
};

export class UssLeagueProvider implements LeagueProvider {
    public getName(): string {
        return "University Student Showdown";
    }

    public getEmoji(): string {
        return "<:uss:1573404289223753759>";
    }

    public getProfileUrl(profile: Profile): string {
        return `${webBaseUrl}/profile/${profile.providerId}`;
    }

    public getTeamUrl(team: Team): string {
        return `${webBaseUrl}/team/${team.providerId}`;
    }

    public getUniversityUrl(university: University): string {
        return `${webBaseUrl}/university/${university.providerId}`;
    }

    public getMatchUrl(match: Match): string {
        return `${webBaseUrl}/match/${match.providerId}`;
    }

    public getTournamentUrl(tournament: Tournament): string {
        return `${webBaseUrl}/tournament/${tournament.providerId}`;
    }

    public async searchProfiles(username: string): Promise<Profile[]> {
        log.debug("Fetching tournament data..");

        const res = await fetch(`${apiBaseUrl}/api/tournament`);
        if (res.status !== 200) {
            log.error(`Could not fetch tournament data for player profiles, got invalid response status (Status: ${res.status})`);
            return [];
        }
        const json: USSEsportsTournamentsJson = await res.json();

        const uniqueProfiles: Map<number, ProfileData> = new Map;
        for (const tournament of json.tournaments) {
            for (const team of tournament.teams) {
                for (const player of team.players) {
                    if (player.displayName.toLowerCase() === username.toLowerCase()) {
                        const teamData: TeamData = {
                            providerId: team.id.toString(),
                            avatarUrl: null,
                            displayName: team.name,
                            countryName: null,
                            gameName: tournament.game.name,
                            university: null,
                            players: team.players.map(player => ({
                                profile: {
                                    providerId: player.id.toString(),
                                    displayName: player.displayName,
                                },
                                isCaptain: player.captain,
                            })),
                        };
                        const existing = uniqueProfiles.get(player.id);
                        const profile: ProfileData = existing ?? await this.getPlayerProfile(player.id);
                        if (!existing) {
                            uniqueProfiles.set(player.id, profile);
                        }

                        profile.teams!.push(teamData);
                        break;
                    }
                }
            }
        }

        return [...uniqueProfiles.values()].map(profileData => new Profile(this, profileData));
    }

    private async getPlayerProfile(playerId: number): Promise<ProfileData> {
        log.debug(`Fetching player profile.. (ID: ${playerId})`);

        const res = await fetch(`${apiBaseUrl}/api/user/${playerId}`);
        if (res.status !== 200) {
            log.error(`Could not fetch player profile, got invalid response status (ID: ${playerId}, Status: ${res.status})`);
            throw new Error("Could not fetch profile information");
        }
        const json: USSEsportsProfileJson = await res.json();

        return {
            providerId: json.id.toString(),
            displayName: json.displayName,
            // university id 1 is "no university", see https://ussesports.com/university/1
            university: json.university.id === 1 ? null : {
                providerId: json.university.id.toString(),
                displayName: json.university.name,
            },
            teams: [],
        };
    }

    public async searchTeams(name: string): Promise<Team[]> {
        log.debug("Fetching tournament data..");

        const res = await fetch(`${apiBaseUrl}/api/tournament`);
        if (res.status !== 200) {
            log.error(`Could not fetch tournament data for teams, got invalid response status (Status: ${res.status})`);
            return [];
        }
        const json: USSEsportsTournamentsJson = await res.json();

        const teams: Team[] = [];
        for (const tournament of json.tournaments) {
            for (const team of tournament.teams) {
                if (team.name.toLowerCase() === name.toLowerCase()) {
                    const teamData = await this.getTeam(team.id);
                    teams.push(new Team(this, teamData));
                }
            }
        }

        return teams;
    }

    private async getTeam(teamId: number): Promise<TeamData> {
        log.debug(`Fetching team.. (ID: ${teamId})`);

        const res = await fetch(`${apiBaseUrl}/api/team/${teamId}`);
        if (res.status !== 200) {
            log.error(`Could not fetch team, got invalid response status (ID: ${teamId}, Status: ${res.status})`);
            throw new Error("Could not fetch team information");
        }
        const json: USSEsportsTeamJson = await res.json();

        return {
            providerId: json.id.toString(),
            displayName: json.name,

            gameName: json.gameName,
            // university id 1 is "no university", see https://ussesports.com/university/1
            university: json.university === 1 ? null : {
                providerId: json.university.toString(),
                displayName: json.universityName,
            },
            players: json.teamMembers.map(player => ({
                profile: {
                    providerId: player.id.toString(),
                    displayName: player.displayName,
                },
                isCaptain: player.captain,
            })),
        };
    }

    public async getTeamMatches(teamId: string): Promise<Match[]> {
        log.debug("Fetching tournament data..");

        const res = await fetch(`${apiBaseUrl}/api/tournament`);
        if (res.status !== 200) {
            log.error(`Could not fetch tournament data for team matches, got invalid response status (Status: ${res.status})`);
            return [];
        }
        const json: USSEsportsTournamentsJson = await res.json();

        const matches: Match[] = [];

        for (const tournament of json.tournaments) {
            for (const team of tournament.teams) {
                const tournamentData: TournamentData = {
                    providerId: tournament.id.toString(),
                    displayName: tournament.name,
                };
                if (team.id.toString() === teamId) {
                    matches.push(...await this.getTournamentMatchesForTeam(tournamentData, team.id.toString()));
                    break;
                }
            }
        }

        return matches;
    }

    private async getTournamentMatchesForTeam(tournament: TournamentData, teamId: string): Promise<Match[]> {
        log.debug(`Fetching tournament data.. (Tournament ID: ${tournament.providerId})`);

        const res = await fetch(`${apiBaseUrl}/api/tournament/${tournament.providerId}`);
        if (res.status !== 200) {
            log.error(`Could not fetch tournament data, got invalid response status (Tournament ID: ${tournament.providerId}, Status: ${res.status})`);
            return [];
        }
        const json: USSEsportsTournamentJson = await res.json();

        const swiss: MatchData[] = json.swissMatches
            .filter(x => x.homeTeam?.id.toString() === teamId || x.awayTeam?.id.toString() === teamId)
            .map(x => ({
                providerId: x.id.toString(),
                tournamentProviderId: tournament.providerId,

                date: new Date(x.startTime),

                team1: x.homeTeam ? {
                    providerId: x.homeTeam!.id.toString(),
                    displayName: x.homeTeam!.name,

                    gameName: json.game.name,
                } : null,
                score1: x.scoreHome,
                team2: x.awayTeam ? {
                    providerId: x.awayTeam!.id.toString(),
                    displayName: x.awayTeam!.name,

                    gameName: json.game.name,
                } : null,
                score2: x.scoreAway,
                tournament,
            }));

        const playoffs: MatchData[] = json.playoffMatches
            .filter(x => x.homeTeam?.id.toString() === teamId || x.awayTeam?.id.toString() === teamId)
            .map(x => ({
                providerId: x.id.toString(),
                tournamentProviderId: tournament.providerId,

                date: new Date(x.startTime),

                team1: x.homeTeam ? {
                    providerId: x.homeTeam.id.toString(),
                    displayName: x.homeTeam.name,

                    gameName: json.game.name,
                } : null,
                score1: x.scoreHome,
                team2: x.awayTeam ? {
                    providerId: x.awayTeam.id.toString(),
                    displayName: x.awayTeam.name,

                    gameName: json.game.name,
                } : null,
                score2: x.scoreAway,
                tournament,
            }));

        return [...swiss, ...playoffs].map(x => new Match(this, x));
    }
}