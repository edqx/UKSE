import { LeagueProvider } from "../LeagueProvider";
import { LeagueProviderAutocompleteProvider, NseScrapeLeagueProvider, UssLeagueProvider } from "../providers";

export enum League {
    NSE,
    USS,
};

export class LeagueProviderService {
    private nse: LeagueProviderAutocompleteProvider = new LeagueProviderAutocompleteProvider(new NseScrapeLeagueProvider)
    private uss: LeagueProviderAutocompleteProvider = new LeagueProviderAutocompleteProvider(new UssLeagueProvider);

    public leagueFromId(leagueId: string | null): League | null {
        if (!leagueId) return null;
        switch (leagueId) {
            case "nse": return League.NSE;
            case "uss": return League.USS;
            default: return null;
        }
    }

    public getAutocompleteProvider(league: League): LeagueProviderAutocompleteProvider {
        switch (league) {
            case League.NSE: return this.nse;
            case League.USS: return this.uss;
        }
    }

    public resolveProviderList(league: League | null): LeagueProvider[] {
        if (league === null) return [this.nse, this.uss];
        switch (league) {
            case League.NSE: return [this.nse];
            case League.USS: return [this.uss];
        }
    }
}