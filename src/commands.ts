import * as djs from "discord.js";

function createLeagueOption(): djs.SlashCommandStringOption {
    return new djs.SlashCommandStringOption()
        .setName("league")
        .setDescription("A particular league to search - if left out, all leagues are searched")
        .setChoices(
            { name: "National Student Esports", value: "nse" },
            { name: "University Student Showdown", value: "uss" },
        );
}

function createTimeRangeOption(): djs.SlashCommandStringOption {
    return new djs.SlashCommandStringOption()
        .setName("time-range")
        .setDescription("Whether to search in the past or the future")
        .setChoices(
            { name: "Past", value: "past" },
            { name: "Future", value: "future" },
        );
}

const player = new djs.SlashCommandBuilder()
    .setName("player")
    .setDescription("Get information about players on various UK Student Esports websites")
    .setIntegrationTypes([
        djs.ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
        djs.InteractionContextType.Guild,
        djs.InteractionContextType.BotDM,
        djs.InteractionContextType.PrivateChannel
    ])
    .addSubcommand(
        new djs.SlashCommandSubcommandBuilder()
            .setName("search")
            .setDescription("Search for a player based on their username")
            .addStringOption(
                new djs.SlashCommandStringOption()
                    .setRequired(true)
                    .setName("username")
                    .setDescription("The player username to search for"),
            )
            .addStringOption(
                createLeagueOption()
                    .setRequired(false),
            ),
    );

const team = new djs.SlashCommandBuilder()
    .setName("team")
    .setDescription("Get information about a team on various UK Student Esports websites")
    .setIntegrationTypes([
        djs.ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
        djs.InteractionContextType.Guild,
        djs.InteractionContextType.BotDM,
        djs.InteractionContextType.PrivateChannel
    ])
    .addSubcommand(
        new djs.SlashCommandSubcommandBuilder()
            .setName("search")
            .setDescription("Search for a team based on its name")
            .addStringOption(
                new djs.SlashCommandStringOption()
                    .setRequired(true)
                    .setName("name")
                    .setDescription("The team name to search for"),
            )
            .addStringOption(
                createLeagueOption()
                    .setRequired(false),
            ),
    )
    .addSubcommand(
        new djs.SlashCommandSubcommandBuilder()
            .setName("matches")
            .setDescription("Get matches for a given team")
            .addStringOption(
                createLeagueOption()
                    .setRequired(true),
            )
            .addStringOption(
                new djs.SlashCommandStringOption()
                    .setRequired(true)
                    .setName("team")
                    .setAutocomplete(true)
                    .setDescription("The ID of the team to get the matches for (Use /team search to get this)"),
            )
            .addStringOption(
                createTimeRangeOption()
                    .setRequired(false),
            ),
    );


export const commands = [
    player,
    team,
];