import signale from "signale";
import { DOMWindow, JSDOM } from "jsdom";

import { LeagueProvider } from "../LeagueProvider";
import { Profile, ProfileData, UniversityData, TeamData, Match, Team, TeamPlayerData, MatchData, Player, University, Tournament, TournamentData } from "../types";

const log = signale.scope("provider:nse");

const baseUrl = `https://nse.gg`;

enum IdStyle {
    NoSpaces,
    IncludeSpaces,
}

export class NseScrapeLeagueProvider implements LeagueProvider {
    public getName(): string {
        return "National Student Esports";
    }

    public getEmoji(): string {
        return "<:nse:1573404204502876281>";
    }

    public getProfileUrl(profile: Profile): string {
        return `${baseUrl}/profiles/${profile.providerId}`;
    }

    public getTeamUrl(team: Team): string {
        return `${baseUrl}/teams/${team.providerId}`;
    }

    public getUniversityUrl(university: University): string {
        return `${baseUrl}/organisations/${university.providerId}`;
    }

    public getMatchUrl(match: Match): string {
        return `${baseUrl}/tournaments/${match.tournament.providerId}/matches/${match.providerId}`;
    }

    public getTournamentUrl(tournament: Tournament): string {
        return `${baseUrl}/tournaments/${tournament.providerId}`;
    }

    private getIdFromName(name: string, style: IdStyle) {
        var out = name.toLowerCase();
        switch (style) {
            case IdStyle.NoSpaces:
                out = out.replace(/ /g, "-");
                break;
            case IdStyle.IncludeSpaces:
                break;
        }
        out = out.replace(/\//g, "");
        return encodeURIComponent(out);
    }

    public async searchProfiles(username: string): Promise<Profile[]> {
        const id = this.getIdFromName(username, IdStyle.IncludeSpaces);

        log.debug(`Fetching profile teams page.. (ID: ${id})`);
        // we use teams page because it is more interesting than the overview page
        const page = await fetch(`${baseUrl}/profiles/${id}/teams`);
        if (page.status !== 200) {
            log.error(`Could not fetch profile teams page, got invalid response status (ID: ${id}, Status: ${page.status})`);
            return [];
        }

        const html = await page.text();
        const window = new JSDOM(html).window;
        const profileData = this.parseProfilePage(id, window);
        return [new Profile(this, profileData)];
    }

    private parseProfilePage(id: string, window: DOMWindow): ProfileData {
        const basic = this.parseBasicPage(id, window);

        const university = this.getUniversity(window);
        // we exclude first child because the first row is table headings
        // <table class="table"> <tbody> <tr> ... </tr> ... </tbody> </table>
        const teamsRows = window.document.querySelectorAll(".table tr:not(:first-child)");
        const teams = this.parseTeamsTable(teamsRows);

        return {
            ...basic,
            university,
            teams,
        };
    }

    private parseBasicPage(id: string, window: DOMWindow): { providerId: string; displayName: string; avatarUrl: string | null; } {
        // <h1 class="university-title">...</h1>
        const titleHeadingElement = window.document.querySelector(".university-title");
        if (!titleHeadingElement || titleHeadingElement.tagName !== "H1") {
            log.error(`Could not parse profile page, no display name title on page (ID: ${id})`);
            throw new Error("Invalid page to scrape");
        }

        // <img class="university-banner-logo rounded" src="..." alt="logo">
        const pfpImageElement = window.document.querySelector(".university-banner-logo") as HTMLImageElement | null;
        if (pfpImageElement && pfpImageElement.tagName !== "IMG") {
            log.error(`Could not parse profile page, no avatar image (ID: ${id})`);
            throw new Error("Invalid page to scrape");
        }

        return {
            providerId: id,
            avatarUrl: pfpImageElement && pfpImageElement.src ? pfpImageElement.src : null,
            displayName: titleHeadingElement.innerHTML.trim(),
        };
    }

    private getEventDetailElement(window: DOMWindow, detail: string): Element | null {
        // <div class="event-details-table-row">...</div>
        const detailsRows = window.document.querySelectorAll(".event-details-table-row");

        for (const row of detailsRows) {
            // <div class="event-details-table-title">...</div> <div class="event-details-table-value">...</div>
            const keyElement = row.querySelector(".event-details-table-title") as HTMLDivElement | null;
            const valueElement = row.querySelector(".event-details-table-value");

            if (!keyElement || keyElement.tagName !== "DIV" || !valueElement) {
                log.error(`Could not parse details row: missing key or value element`);
                throw new Error("Invalid page to scrape");
            }

            if (keyElement.innerHTML.toLowerCase() === detail) {
                return valueElement;
            }
        }

        return null;
    }

    private getUniversity(window: DOMWindow): UniversityData {
        const eventDetail = this.getEventDetailElement(window, "university");
        if (!eventDetail) {
            log.error(`Could not parse university: missing university detail key`);
            throw new Error("Invalid page to scrape");
        }

        const valueLinkElement = eventDetail.querySelector("a") as HTMLLinkElement | null;
        if (!valueLinkElement) {
            log.error(`Could not parse university: missing university detail value`);
            throw new Error("Invalid page to scrape");
        }
        const universityId = valueLinkElement.href.split("/")[2];
        if (!universityId) {
            log.error(`Could not parse university: missing ID`);
            throw new Error("Invalid page to scrape");
        }
        const displayName = valueLinkElement.innerHTML.trim();

        return {
            providerId: universityId,
            displayName,
        };
    }

    private parseCountryName(countryName: string): string | null {
        return countryName === "No Name" ? null : countryName;
    }

    private parseTeamsTable(teamsRows: NodeListOf<Element>): TeamData[] {
        const teams: TeamData[] = [];

        for (const row of teamsRows) {
            // <td> <img src="..." alt="..." title="..." class="flag"> <a href="...">...</a> </td>
            const cells = row.querySelectorAll("td") as NodeListOf<HTMLTableCellElement>;
            const name = cells[0];
            if (!name) {
                log.error(`Could not parse team table row: missing team name cell`);
                throw new Error("Invalid page to scrape");
            }

            const flagImageElement = name.querySelector(".flag") as HTMLImageElement | null;
            if (!flagImageElement || flagImageElement.tagName !== "IMG") {
                log.error(`Could not parse team table row: missing team country flag image`);
                throw new Error("Invalid page to scrape");
            }
            const countryName = flagImageElement.title;

            const nameLinkElement = name.querySelector("a") as HTMLLinkElement | null;
            if (!nameLinkElement) {
                log.error(`Could not parse team table row: missing team name`);
                throw new Error("Invalid page to scrape");
            }

            // <a href="...">...</a>
            const id = nameLinkElement.href.split("/")[2];
            if (!id) {
                log.error(`Could not parse team table row: missing team ID`);
                throw new Error("Invalid page to scrape");
            }
            const displayName = nameLinkElement.innerHTML.trim();

            teams.push({
                providerId: id,
                displayName,

                countryName: this.parseCountryName(countryName),
            });
        }

        return teams;
    }

    public async searchTeams(name: string): Promise<Team[]> {
        const id = this.getIdFromName(name, IdStyle.NoSpaces);
        const teamUrl = `${baseUrl}/teams/${id}`;

        log.debug(`Fetching teams page.. (ID: ${id})`);

        // we use teams page because it is more interesting than the overview page
        const page = await fetch(`${teamUrl}`);
        if (page.status !== 200) {
            log.error(`Could not fetch team page, got invalid response status (ID: ${id}, Status: ${page.status})`);
            return [];
        }

        const html = await page.text();
        const window = new JSDOM(html).window;
        const teamData = this.parseTeamPage(id, window);
        return [new Team(this, teamData)];
    }

    private parseTeamPage(id: string, window: DOMWindow): TeamData {
        const basic = this.parseBasicPage(id, window);

        const university = this.getUniversity(window);
        // we exclude first child because the first row is table headings
        // <table class="table"> <thead> <tr> ... </tr> </thead> <tbody> <tr> ... </tr> ... </tbody> </table>
        const playersRows = window.document.querySelectorAll(".table tbody tr");
        const players = this.parsePlayersTable(playersRows);

        return {
            ...basic,
            university,
            players,
        };
    }

    private parsePlayersTable(playersRows: NodeListOf<Element>): TeamPlayerData[] {
        const players: TeamPlayerData[] = [];

        for (const row of playersRows) {
            // <td> <img src="..." alt="..." title="..." class="flag"> <a href="...">...</a> </td>
            const cells = row.querySelectorAll("td");
            const name = cells[0] as HTMLTableCellElement | undefined;
            if (!name) {
                log.error(`Could not parse player table row: missing team name cell`);
                throw new Error("Invalid page to scrape");
            }

            // const flagImageElement = name.querySelector(".flag") as HTMLImageElement | null;
            // if (!flagImageElement || flagImageElement.tagName !== "IMG") {
            //     log.error(`Could not parse team table row: missing team country flag image`);
            //     throw new Error("Invalid page to scrape");
            // }
            // const countryName = flagImageElement.title;

            const nameLinkElement = name.querySelector("a") as HTMLLinkElement | null;
            if (!nameLinkElement) {
                log.error(`Could not parse player table row: missing team name`);
                throw new Error("Invalid page to scrape");
            }

            // <a href="...">...</a>
            // for some reason player "ids" contain the actual space, so we need to ensure it's
            // URI-safe
            const idRaw = nameLinkElement.href.split("/")[2];
            if (!idRaw) {
                log.error(`Could not parse player table row: missing ID`);
                throw new Error("Invalid page to scrape");
            }
            const id = encodeURIComponent(idRaw);
            const displayName = nameLinkElement.innerHTML.trim();

            const role = cells[2] as HTMLTableCellElement | undefined;
            if (!role) {
                log.error(`Could not parse player table row: missing role cell`);
                throw new Error("Invalid page to scrape");
            }

            const isCaptain = role.innerHTML.trim() === "Leader";
            players.push({
                profile: {
                    providerId: id,
                    displayName,
                },
                isCaptain,
            });
        }

        return players;
    }

    public async getTeamMatches(teamId: string): Promise<Match[]> {
        const teamUrl = `${baseUrl}/teams/${teamId}`;

        log.debug(`Fetching rosters page.. (ID: ${teamId})`);

        // we use teams page because it is more interesting than the overview page
        const page = await fetch(`${teamUrl}/rosters`);
        if (page.status !== 200) {
            log.error(`Could not fetch team rosters page, got invalid response status (ID: ${teamId}, Status: ${page.status})`);
            return [];
        }

        const html = await page.text();
        const window = new JSDOM(html).window;
        // the first cell in the table body is the roster link
        // <table class="table"> <thead> <tr> ... </tr> <tbody> <tr> <td> ... </td> ... </tr> ... </tbody> </table>
        const rosterLinkElements = window.document.querySelectorAll(".table tbody td:first-child a") as NodeListOf<HTMLLinkElement>;
        const links = [...rosterLinkElements].map(link => link.href);

        const matches: MatchData[] = [];

        for (const link of links) {
            const tournamentId = link.split("/")[2];
            if (!tournamentId) {
                log.error(`Could not parse rosters link: missing tournament id`);
                throw new Error("Invalid page to scrape");
            }

            log.debug(`Fetching roster matches page.. (Team ID: ${teamId}, Tournament ID: ${tournamentId})`);

            const rosterPage = await fetch(`${baseUrl}${link}/matches`);
            if (rosterPage.status !== 200) {
                log.error(`Could not fetch roster page, got invalid response status (ID: ${teamId}, Status: ${page.status})`);
                return [];
            }

            const rosterHtml = await rosterPage.text();
            const rosterWindow = new JSDOM(rosterHtml).window;

            const tournament: TournamentData = this.parseBasicPage(tournamentId, rosterWindow);
            const matchesRows = rosterWindow.document.querySelectorAll(".table tbody tr") as NodeListOf<HTMLTableRowElement>;
            matches.push(...this.parseMatchesTable(tournament, matchesRows));
        }

        return matches.map(matchData => new Match(this, matchData));
    }

    private parseMatchesTable(tournament: TournamentData, matchesRows: NodeListOf<HTMLTableRowElement>): MatchData[] {
        const matches: MatchData[] = [];

        for (const row of matchesRows) {
            // .matches-id .matches-time .matches-hometeam .matches-homescore .matches-awayscore .matches-awayteam .matches-round .matches-details
            const cells = row.querySelectorAll("td") as NodeListOf<HTMLTableCellElement>;
            const idElement = cells[0];
            if (!idElement) {
                log.error(`Could not parse matches table row: missing match ID cell`);
                throw new Error("Invalid page to scrape");
            }

            const timeElement = cells[1];
            if (!timeElement) {
                log.error(`Could not parse matches table row: missing time cell`);
                throw new Error("Invalid page to scrape");
            }

            const homeTeamElement = cells[2];
            if (!homeTeamElement) {
                log.error(`Could not parse matches table row: missing home team cell`);
                throw new Error("Invalid page to scrape");
            }

            const homeScoreElement = cells[3];
            if (!homeScoreElement) {
                log.error(`Could not parse matches table row: missing home score cell`);
                throw new Error("Invalid page to scrape");
            }

            const awayScoreElement = cells[4];
            if (!awayScoreElement) {
                log.error(`Could not parse matches table row: missing away score cell`);
                throw new Error("Invalid page to scrape");
            }

            const awayTeamElement = cells[5];
            if (!awayTeamElement) {
                log.error(`Could not parse matches table row: missing away team cell`);
                throw new Error("Invalid page to scrape");
            }

            const id = idElement.innerHTML.trim();

            const timeString = timeElement.innerHTML.trim().replace(/<br>/g, " ").replace(/ +/g, " ");
            const date = new Date(timeString);

            const homeFlagImageElement = homeTeamElement.querySelector(".flag") as HTMLImageElement | null;
            if (!homeFlagImageElement || homeFlagImageElement.tagName !== "IMG") {
                log.error(`Could not parse team table row: missing home team country flag image`);
                throw new Error("Invalid page to scrape");
            }
            const homeCountryName = homeFlagImageElement.title;

            const homeNameLinkElement = homeTeamElement.querySelector("a") as HTMLLinkElement | null;
            if (!homeNameLinkElement) {
                log.error(`Could not parse matches table row: missing home team name`);
                throw new Error("Invalid page to scrape");
            }

            const homeId = homeNameLinkElement.href.split("/")[2];
            if (!homeId) {
                log.error(`Could not parse matches table row: missing home team ID`);
                throw new Error("Invalid page to scrape");
            }
            const homeDisplayName = homeNameLinkElement.innerHTML.trim();

            const homeScore = parseInt(homeScoreElement.innerHTML.trim());

            const awayFlagImageElement = awayTeamElement.querySelector(".flag") as HTMLImageElement | null;
            if (!awayFlagImageElement || awayFlagImageElement.tagName !== "IMG") {
                log.error(`Could not parse matches table row: missing away team country flag image`);
                throw new Error("Invalid page to scrape");
            }
            const awayCountryName = awayFlagImageElement.title;

            const awayNameLinkElement = awayTeamElement.querySelector("a") as HTMLLinkElement | null;
            if (!awayNameLinkElement) {
                log.error(`Could not parse matches table row: missing away team name`);
                throw new Error("Invalid page to scrape");
            }

            const awayId = awayNameLinkElement.href.split("/")[2];
            if (!awayId) {
                log.error(`Could not parse matches table row: missing away team ID`);
                throw new Error("Invalid page to scrape");
            }
            const awayDisplayName = awayNameLinkElement.innerHTML.trim();

            const awayScore = parseInt(awayScoreElement.innerHTML.trim());

            matches.push({
                providerId: id,

                date: date,

                team1: {
                    providerId: homeId,
                    displayName: homeDisplayName,

                    countryName: this.parseCountryName(homeCountryName),
                },
                team2: {
                    providerId: awayId,
                    displayName: awayDisplayName,

                    countryName: this.parseCountryName(awayCountryName),
                },
                score1: isNaN(homeScore) ? null : homeScore,
                score2: isNaN(awayScore) ? null : awayScore,

                tournament,
            });
        }

        return matches;
    }
}