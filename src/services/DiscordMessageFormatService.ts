import * as djs from "discord.js";
import { Match, Profile, Team } from "../types";

export enum MatchesTimeRange {
    Past,
    Future,
};

export class DiscordMessageFormatService {
    private getBaseEmbed(tookMs: number) {
        return new djs.EmbedBuilder()
            .setColor(0xbc369a)
            .setFooter({
                text: `Took ${(tookMs / 1000).toFixed(2)}s to search all leagues | Made by weakeyes`
            });
    }

    private getGameEmoji(name: string): string | null {
        // TODO: make configurable
        switch (name.toLowerCase()) {
            case "overwatch": return "<:overwatch:1573475199733465168>";
            case "deadlock": return "<:deadlock:1573475493121097768>";
            case "rocket league": return "<:rocketleague:1573474857616801932>";
            default: return null;
        }
    }

    public getProfileSearchResultMessage(tookMs: number, searchTerm: string, profiles: Profile[]): djs.BaseMessageOptions {
        const embed = this.getBaseEmbed(tookMs)
            .setTitle(`Player Search Results for \`${searchTerm}\``);

        for (let i = 0; i < profiles.length; i++) {
            const profile = profiles[i]!;
            const field = this.getProfileField(i, profile);
            embed.addFields(field);

            if (profile.avatarUrl) {
                embed.setThumbnail(profile.avatarUrl);
            }
        }

        if (profiles.length === 0) {
            embed.setDescription("No results found");
        }

        return { embeds: [embed] };
    }

    private getProfileField(index: number, profile: Profile): djs.APIEmbedField {
        var lines = [];

        lines.push(`**Player**: [${profile.displayName}](${profile.getUrl()})`);
        if (profile.university) {
            lines.push(`**University**: [${profile.university.displayName}](${profile.university.getUrl()})`);
        }

        profile.teams.sort((a, b) => {
            return a.displayName.localeCompare(b.displayName);
        });

        if (profile.teams.length > 0) {
            var teamsText = "**Teams**: ";
            for (let i = 0; i < profile.teams.length; i++) {
                const team = profile.teams[i]!;
                teamsText += (i !== 0 ? ", " : "");
                teamsText += `[${team.displayName}](${team.getUrl()})`;
            }

            lines.push(teamsText);
        }

        return {
            name: `${index + 1}. ${profile.provider.getEmoji()} ${profile.provider.getName()} (ID: \`${profile.providerId}\`)`,
            value: lines.join("\n"),
        };
    }

    public getTeamSearchResultMessage(tookMs: number, searchTerm: string, teams: Team[]): djs.BaseMessageOptions {
        const embed = this.getBaseEmbed(tookMs)
            .setTitle(`Team Search Results for \`${searchTerm}\``);

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i]!;
            const field = this.getTeamField(i, team);
            embed.addFields(field);

            if (team.avatarUrl) {
                embed.setThumbnail(team.avatarUrl);
            }
        }

        if (teams.length === 0) {
            embed.setDescription("No results found");
        }

        return { embeds: [embed] };
    }

    private getTeamField(index: number, team: Team): djs.APIEmbedField {
        var lines = [];

        if (team.gameName) {
            const emoji = this.getGameEmoji(team.gameName);
            if (emoji) {
                lines.push(`**Team**: [${team.displayName}](${team.getUrl()}) (${emoji} ${team.gameName})`);
            } else {
                lines.push(`**Team**: [${team.displayName}](${team.getUrl()}) (${team.gameName})`);
            }
        } else {
            lines.push(`**Team**: [${team.displayName}](${team.getUrl()})`);
        }
        if (team.university) {
            lines.push(`**University**: [${team.university.displayName}](${team.university.getUrl()})`);
        }

        team.players.sort((a, b) => {
            return a.profile.displayName.localeCompare(b.profile.displayName);
        });

        if (team.players.length > 0) {
            var playersText = "**Players**: ";
            for (let i = 0; i < team.players.length; i++) {
                const player = team.players[i]!;
                playersText += (i !== 0 ? ", " : "");
                if (player.isCaptain) {
                    playersText += "**";
                }
                playersText += `[${player.profile.displayName}](${player.profile.getUrl()})`;
                if (player.isCaptain) {
                    playersText += "**";
                }
            }

            lines.push(playersText);
        }

        return {
            name: `${index + 1}. ${team.provider.getEmoji()} ${team.provider.getName()} (ID: \`${team.providerId}\`)`,
            value: lines.join("\n"),
        };
    }

    public getMatchesMessage(tookMs: number, teamId: string, timeRange: MatchesTimeRange, matches: Match[]): djs.BaseMessageOptions {
        var out = "";

        matches.sort((a, b) => {
            return b.date.getTime() - a.date.getTime();
        });
        if (matches.length === 0) {
            switch (timeRange) {
                case MatchesTimeRange.Past:
                    out = "No past matches found";
                    break;
                case MatchesTimeRange.Future:
                    out = "No upcoming matches found";
                    break;
            }
        } else {
            const maxHomeTeamNameLength = matches.reduce((prev, cur) => cur.team1 && cur.team1.displayName.length > prev ? cur.team1.displayName.length : prev, 0) + 1;
            const maxAwayTeamNameLength = matches.reduce((prev, cur) => cur.team2 && cur.team2.displayName.length > prev ? cur.team2.displayName.length : prev, 0) + 1;

            for (let i = 0; i < matches.length; i++) {
                const match = matches[i]!;
                if (i > 8) break;
                if (i !== 0) {
                    out += "\n\n";
                }
                out += `\
**${match.provider.getEmoji()} [Match #${match.providerId}](${match.getUrl()})** _<t:${Math.floor(match.date.getTime() / 1000)}:S>_
\`${(match.team1 ? match.team1.displayName : "").padStart(maxHomeTeamNameLength, " ")} ${match.score1 ?? " "} \
- \
${match.score2 ?? " "} ${(match.team2 ? match.team2.displayName : "").padEnd(maxAwayTeamNameLength, " ")}\`\
`;
            }
        }

        const embed = this.getBaseEmbed(tookMs)
            .setDescription(out);

        switch (timeRange) {
            case MatchesTimeRange.Past:
                embed.setTitle(`Past Matches for ID: \`${teamId}\``);
                break;
            case MatchesTimeRange.Future:
                embed.setTitle(`Upcoming matches for ID: \`${teamId}\``);
                break;
        }

        return { embeds: [embed] };
    }
}