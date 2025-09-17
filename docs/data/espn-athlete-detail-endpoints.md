# ESPN NFL Athlete Detail Endpoints

All endpoints here live under the `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl` namespace and accept an `athleteId` (e.g., `14876` for Ryan Tannehill). They back the ESPN player pages, returning richer data than the public core catalogue. Unless noted, responses are JSON, public, and do not require authentication.

> Tip: Default responses assume `lang=en` and `region=us`. Add those query params explicitly when building stable fetchers.

## Summary

| Path (GET) | Purpose | Notes |
|------------|---------|-------|
| `/athletes/{athleteId}` | Core profile payload | Includes roster metadata, quick links, default stat summary. |
| `/athletes/{athleteId}/bio` | Historical team affiliations | Seasons listed as strings (`YYYY-YYYY`). |
| `/athletes/{athleteId}/gamelog` | Per-game stat arrays for a season | Requires `season` (year) and optional `seasontype`. |
| `/athletes/{athleteId}/news` | Player-specific news feed | Returns `404` when no curated news exists. |
| `/athletes/{athleteId}/overview` | Dashboard data (fantasy, latest news, next game) | Combines stats, news, rotowire blurb, and schedule. |
| `/athletes/{athleteId}/results` | Not implemented for NFL | Always returns `404` for this athlete. |
| `/athletes/{athleteId}/scorecards` | Not implemented for NFL | Always returns `404` for this athlete. |
| `/athletes/{athleteId}/splits` | Home/away and situational splits | Requires `season` to target a year. |
| `/athletes/{athleteId}/stats` | Season-by-season stat history | Supports `season`/`seasontype` filters. |
| `/athletes/{athleteId}/vsathlete` | Comparison endpoint (unsupported) | Returns `code:1020` without extra params. |
| `/statistics/byathlete` | League-wide stat feed filtered by athlete/team/season | Requires `athlete`, `season`, and `seasontype`. |
| `/statistics/byteam` | League-wide team stat feed | Requires `team`, `season`, and `seasontype`. |

---

## `GET /athletes/{athleteId}` — Core Profile

**Primary use**: Fetch ESPN’s canonical player profile. Includes bio data, position, current team, status, headshot, and a high-level stat summary for the most recent season.

**Key response blocks**
- `athlete`: core metadata (`id`, `fullName`, `firstName`, `lastName`, `displayName`, `position`, `team`, `status`, `jersey`, `headshot`, `college`, `statsSummary`).
- `links`: ESPN web/app URLs for the player.
- `quicklinks`: Template URLs for related team resources (placeholders like `[leagueSlug]` must be templated by your client).
- `playerSwitcher`: Roster searcher containing `filters` (team + position options) and `athletes` (other players surfaced in the UI dropdown).
- `season`, `league`, `standings`, `ticketsInfo`, `videos`: contextual data for page widgets.

```jsonc
{
  "athlete": {
    "id": "14876",
    "fullName": "Ryan Tannehill",
    "position": { "abbreviation": "QB", "displayName": "Quarterback" },
    "team": { "id": "10", "displayName": "Tennessee Titans" },
    "status": { "type": "free-agent" },
    "statsSummary": [
      { "name": "passingYards", "value": 1616.0, "displayValue": "1,616", "rank": 33 },
      { "name": "passingTouchdowns", "value": 4.0, "displayValue": "4", "rank": 41 }
    ]
  },
  "playerSwitcher": {
    "team": "Tennessee Titans",
    "filters": [
      { "name": "team", "value": "10", "options": [{ "value": "22", "displayValue": "Arizona Cardinals" }, …] },
      { "name": "position", "value": "8", "options": [{ "value": "8", "displayValue": "Quarterback" }, …] }
    ],
    "athletes": [ { "id": "2574511", "displayName": "Brandon Allen", "jersey": "10" }, … ]
  }
}
```

**Implementation notes**
- `statsSummary` surfaces only a few headline metrics; grab full-season numbers from `/overview`, `/stats`, or `/statistics/byathlete`.
- `status.type` is reliable for determining free agency.
- `team` reflects the last roster assignment even for free agents; expect stale values until ESPN updates the profile.
- `playerSwitcher.filters` is handy for building UI pickers (team + position enumerations).

---

## `GET /athletes/{athleteId}/bio` — Team History

**Purpose**: Lists every professional team the athlete has been rostered on, with seasons described in `YYYY-YYYY` strings.

```jsonc
[
  {
    "id": "10",
    "displayName": "Tennessee Titans",
    "seasons": "2019-CURRENT",
    "seasonCount": "5",
    "links": [{ "rel": ["clubhouse"], "href": "https://www.espn.com/nfl/team/_/name/ten/tennessee-titans" }, …]
  },
  {
    "id": "15",
    "displayName": "Miami Dolphins",
    "seasons": "2012-2018",
    "seasonCount": "6"
  }
]
```

**Notes**
- No collegiate history appears here; stick to professional franchises.
- `seasons` uses `CURRENT` when the stint is ongoing.
- `links` mirror standard ESPN navigation for each franchise.

---

## `GET /athletes/{athleteId}/gamelog` — Per-Game Stats

**Purpose**: Provides stat arrays for each game in a selected season.

**Common query params**
- `season` (required): four-digit year (e.g., `2023`).
- `seasontype` (optional): `2` for regular season, `3` for postseason.

**Structure**
- `labels`, `names`, `displayNames`: Stat definitions aligned with each position in the `stats` arrays.
- `seasonTypes`: Array per season type. Each `categories[n].events` entry holds `eventId` and the stat array for that game.
- `events`: Map keyed by `eventId` containing metadata (opponent, score, result, links).
- `filters`: Options for league/season toggles identical to ESPN UI.

```jsonc
{
  "labels": ["CMP", "ATT", "YDS", "CMP%", "AVG", …],
  "seasonTypes": [
    {
      "displayName": "Regular Season Stats",
      "events": [
        { "eventId": "401547652", "stats": ["17", "26", "168", "65.4", "6.5", "2", …] },
        { "eventId": "401547631", "stats": ["16", "20", "168", "80.0", "8.4", "0", …] },
        …
      ]
    }
  ],
  "events": {
    "401547652": { "opponent": { "displayName": "Jacksonville Jaguars" }, "score": "28-20", "gameResult": "W", "week": 18 },
    …
  }
}
```

**Implementation notes**
- Convert `labels` + `stats` into meaningful objects by zipping arrays: `stats[i]` aligns with `labels[i]`.
- A zeroed stat line (all `"0"`/`"-"`) indicates DNP or inactive status.
- ESPN sometimes includes postseason events in the same feed; ensure you pass `seasontype` when you need a specific split.

---

## `GET /athletes/{athleteId}/news` — Player News Feed

For Tannehill this endpoint returns:

```json
{"code":404,"message":"…/athletes/14876/news… status=404 …"}
```

**Takeaways**
- ESPN only exposes this feed when a curated news channel exists for the athlete. Otherwise the proxy responds with HTTP 404 + an error payload.
- Use `/overview` (see below) for a merged news view that can include Insider content and wire services even when this endpoint is empty.

---

## `GET /athletes/{athleteId}/overview` — Dashboard Snapshot

**Purpose**: Mirrors the “Overview” tab in ESPN’s UI. Bundles current-season stats, fantasy metadata, recent headlines, Rotowire blurbs, and schedule context.

```jsonc
{
  "statistics": {
    "displayName": "2023 Passing",
    "splits": [ { "displayName": "Regular Season", "stats": ["149", "230", "64.8", "1,616", "7.0", "4", "7", "70", "78.5"] }, … ]
  },
  "fantasy": { "draftRank": "1924", "positionRank": "0", "percentOwned": "0.0149", "last7Days": "-0.00159" },
  "rotowire": { "headline": "The Packers aren't expected…", "published": "Sun Sep 08 10:43:43 PDT 2024" },
  "news": { "headline": "NFL QB reclamations: The path to career recovery for free agents", "lastModified": "2025-02-20T16:31:57.000+00:00", "isPremium": true },
  "nextGame": { "id": "401772724", "name": "Los Angeles Rams at Tennessee Titans", "date": "2025-09-14T17:00:00.000+00:00", "shortName": "LAR @ TEN" },
  "gameLog": { … } // compact per-game summary for the latest contests
}
```

**Notes**
- `statistics.splits` mirrors the columns shown on the Overview page (regular season, projections, career).
- `fantasy` values are decimals encoded as strings; convert to floats as needed.
- `news` array includes Insider pieces—respect the `isPremium` flag before surfacing to free users.
- `nextGame` may represent the previous or upcoming contest depending on schedule context; it carries links to Gamecast, tickets, and betting markets.

---

## `GET /athletes/{athleteId}/results`
## `GET /athletes/{athleteId}/scorecards`

Both endpoints currently return a 404 for NFL athletes:

```json
{"code":404,"message":"error invoking GET: …/results?lang=en"}
```

They appear to be placeholders for sports that support per-event scorecards (e.g., golf). Build resilient clients that treat 404 as “data not provided.”

---

## `GET /athletes/{athleteId}/splits` — Situational Splits

**Purpose**: Provides breakdowns (home/away, win/loss, by opponent, etc.) for a given season.

**Query params**
- `season` (required)
- `seasontype` (optional)

```jsonc
{
  "displayName": "2023 Splits",
  "labels": ["CMP", "ATT", "YDS", "CMP%", "AVG", "TD", …],
  "splitCategories": [
    {
      "displayName": "split",
      "splits": [
        { "displayName": "All Splits", "stats": ["149", "230", "1,616", "64.8", "7.0", "4", …], "abbreviation": "Any" },
        { "displayName": "Home", "stats": ["81", "117", "882", "69.2", "7.5", "4", …], "abbreviation": "Home" },
        { "displayName": "Away", "stats": ["68", "113", "734", "60.2", "6.5", "0", …], "abbreviation": "Away" }
      ]
    },
    …
  ],
  "descriptions": ["The times a player completes a pass…", …]
}
```

**Implementation notes**
- Each `splitCategories` entry represents a grouping (e.g., venue, result margin). Iterate over the array to surface all options.
- The order of `labels` matches the `stats` array; reuse the same zipping logic as the gamelog endpoint.

---

## `GET /athletes/{athleteId}/stats` — Season-By-Season History

**Purpose**: Full statistical history for the athlete, grouped by category (passing, rushing, etc.) with yearly splits and career totals.

**Query params**
- `season` (optional): filter to a specific year.
- `seasontype` (optional): defaults to regular season (`2`).

```jsonc
{
  "filters": [
    { "name": "league", "value": "nfl", "options": ["college-football", "nfl"] },
    { "name": "seasontype", "value": "2", "options": ["Regular Season", "Postseason"] }
  ],
  "categories": [
    {
      "displayName": "Passing",
      "statistics": [
        { "teamSlug": "tennessee-titans", "season": { "year": 2021 }, "stats": ["17", "357", "531", "67.2", "3,734", "7.0", …], "position": "QB" },
        { "teamSlug": "tennessee-titans", "season": { "year": 2022 }, "stats": ["12", "212", "325", "65.2", "2,536", "7.8", …] },
        { "teamSlug": "tennessee-titans", "season": { "year": 2023 }, "stats": ["10", "149", "230", "64.8", "1,616", "7.0", …] }
      ],
      "totals": ["155", "3063", "4764", "64.3", "34,881", "7.3", "216", "115", "91", "415", "91.2", "-"]
    },
    …
  ]
}
```

**Notes**
- Categories cover both offensive and special teams areas even if the player has no data (numbers may be `"-"` and `values` null).
- Years appear even for teams the athlete is no longer on, enabling longitudinal charts.

---

## `GET /athletes/{athleteId}/vsathlete`

Calling the endpoint without additional parameters yields:

```json
{"code":1020,"detail":"script error: invalid API definition class"}
```

It likely expects query parameters describing the comparison target (e.g., `?athlete=14876&compare=3046779`). ESPN’s public site no longer surfaces this feature for NFL players, so treat the endpoint as unsupported unless you discover the correct parameter contract.

---

## `GET /statistics/byathlete` — League-Wide Athlete Stats

**Purpose**: Pulls leaderboard data for one or more athletes, matching the tables on ESPN’s stats pages.

**Required query params**
- `athlete`: target athlete ID (multiple values comma-separated).
- `season`: four-digit year.
- `seasontype`: `2` (regular) or `3` (postseason).

**Optional**
- `category`: filter to a stat category (e.g., `passing`).
- `page` / `limit`: pagination controls (default limit 50).

```jsonc
{
  "requestedSeason": { "year": 2023, "displayName": "2023", "type": { "name": "Regular Season" } },
  "categories": [ { "displayName": "Own General", "labels": ["GP", "FF", "FR", "FTD", …] }, … ],
  "athletes": [
    {
      "athlete": { "id": "14876", "displayName": "Ryan Tannehill", "teamShortName": "TEN" },
      "categories": [
        { "displayName": "Own General", "totals": ["10", "0", "0", "0"], "ranks": ["-", "-", "-", "-"] },
        { "displayName": "Own Passing", "totals": ["149", "230", "64.8", "1,616", "7.0", …], "ranks": ["-", "-", "23", "-", …] }
      ]
    }
  ]
}
```

**Notes**
- Without `season`/`seasontype`, the API defaults to the current season and may exclude athletes on inactive rosters. Always provide explicit parameters when caching.
- `totals` contains the human-readable stats, while `values` (not shown above) repeat the same information as floats. `ranks` is string-encoded.
- The endpoint can return multiple athletes at once, enabling head-to-head comparisons without additional requests.

---

## `GET /statistics/byteam` — League-Wide Team Stats

**Purpose**: Delivers team aggregate stats for the chosen season.

**Required query params**
- `team`: ESPN team ID (e.g., `10` for the Titans).
- `season`: four-digit year.
- `seasontype`: `2` or `3`.

```jsonc
{
  "requestedSeason": { "year": 2023, "displayName": "2023", "type": { "name": "Regular Season" } },
  "categories": [ { "labels": ["GP", "FR", "LST", …] }, … ],
  "teams": [
    {
      "team": { "id": "10", "displayName": "Tennessee Titans" },
      "categories": [
        { "displayName": "Own General", "totals": ["17", "8", "9"], "ranks": ["1", "22", "18"] },
        { "displayName": "Opponent General", "totals": ["17", "9", "8"], "ranks": ["1", "15", "7"] }
      ]
    }
  ]
}
```

**Notes**
- The response may include other teams when `team` is omitted; always provide the parameter to limit results.
- Similar to `/byathlete`, each category carries `totals`, `values`, and `ranks` arrays aligned with the `labels` list.

---

## Working With These Endpoints

- **Rate limiting**: None observed, but avoid hammering the API; cache responses locally where possible.
- **Stringified numbers**: Many stat arrays are strings. Convert to numeric types before running calculations.
- **Missing data**: 404 responses (`/news`, `/results`, `/scorecards`) are expected for some athletes. Handle gracefully and fall back to other feeds.
- **Premium content**: Some news items are Insider-only (`premium: true`). Respect user entitlements before displaying.
- **Zipping helpers**: Build utility functions to pair `labels`+`stats` arrays so downstream code receives friendly objects (e.g., `{ label: 'CMP', value: 149 }`).

_Last updated: 2025-01-16._
