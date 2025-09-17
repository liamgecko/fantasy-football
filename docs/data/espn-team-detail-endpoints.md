# ESPN NFL Team Detail Endpoints

These endpoints expose franchise-specific data for the NFL. They build on the team list feed by returning profile metadata, roster listings, schedules, statistics, and historical records. Unless stated, all endpoints are public and json formatted.

## Summary

| Path | Purpose |
|------|---------|
| `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{teamId}` | Team profile (branding, franchise metadata, record snapshot, next event). |
| `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{teamId}/roster` | Position-grouped roster for a given season. |
| `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{teamId}/schedule` | Full schedule (past and upcoming games) for a season + season type. |
| `GET https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{season}/types/{type}/teams/{teamId}/statistics` | Core stats feed (aggregate team statistics with rankings). |
| `GET https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{season}/types/{type}/teams/{teamId}/record` | Core standings/record splits for a season + season type. |

`teamId` is the ESPN team identifier returned by the teams catalogue (e.g., `12` for the Kansas City Chiefs). `type` corresponds to `2` (regular season) or `3` (postseason) in the NFL context.

---

## Team Profile — `/teams/{teamId}`

**Key fields**

```jsonc
{
  "team": {
    "id": "12",
    "uid": "s:20~l:28~t:12",
    "slug": "kansas-city-chiefs",
    "displayName": "Kansas City Chiefs",
    "shortDisplayName": "Chiefs",
    "name": "Chiefs",
    "nickname": "Chiefs",
    "location": "Kansas City",
    "color": "e31837",
    "alternateColor": "f2c800",
    "logos": [ { "href": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", "rel": ["full", "default"], "width": 500, "height": 500 }, … ],
    "links": [ { "rel": ["clubhouse", "desktop", "team"], "href": "https://www.espn.com/nfl/team/_/name/kc/kansas-city-chiefs" }, … ],
    "franchise": { "$ref": "…/franchises/12", "displayName": "Kansas City Chiefs", "venue": { "fullName": "GEHA Field at Arrowhead Stadium", … } },
    "groups": { "id": "6", "parent": { "id": "8" }, "isConference": false },
    "record": { "items": [ { "type": "total", "summary": "0-2", "stats": [ { "name": "wins", "value": 0.0 }, … ] }, { "type": "home", … }, { "type": "road", … } ] },
    "standingSummary": "T-3rd in AFC West",
    "nextEvent": [ { "id": "401772837", "date": "2025-09-14T20:25Z", "name": "Philadelphia Eagles at Kansas City Chiefs", "shortName": "PHI @ KC" } ]
  }
}
```

**Notes**
- `franchise` returns a Core API reference with venue details and the canonical franchise record.
- `groups.id` corresponds to the division (e.g., `6` = AFC West); `parent.id` points to the conference group (`8` = AFC).
- `record.items` mirrors what ESPN shows on team pages: overall, home, road, etc. Stats inside each item include normalized names (`wins`, `losses`, `winPercent`, `gamesPlayed`, etc.).
- `nextEvent` is an array; use the first entry as the upcoming matchup. Past seasons may populate `previousEvent` instead.

---

## Roster — `/teams/{teamId}/roster`

**Query parameters**

| Parameter | Description |
|-----------|-------------|
| `season` | Four-digit season year (defaults to current). |
| `type` / `seasontype` | Not required for NFL; feed always returns regular-season roster. |

**Structure**

```jsonc
{
  "team": { "id": "12", "displayName": "Kansas City Chiefs" },
  "season": { "year": 2025 },
  "status": { "type": "full" },
  "coach": [ … ],
  "athletes": [
    {
      "position": "offense",
      "items": [
        {
          "id": "4241372",
          "fullName": "Hollywood Brown",
          "position": { "abbreviation": "WR", "displayName": "Wide Receiver" },
          "jersey": "5",
          "status": { "type": "active" },
          "experience": { "years": 7 },
          "height": 69.0,
          "weight": 180.0,
          "college": { "name": "Oklahoma", "abbrev": "OU" },
          "links": [ { "rel": ["playercard"], "href": "https://www.espn.com/nfl/player/_/id/4241372/hollywood-brown" }, … ],
          "teams": [ { "$ref": "…/seasons/2025/teams/12" } ]
        }, …
      ]
    },
    { "position": "defense", "items": [ … ] },
    { "position": "special-teams", "items": [ … ] }
  ],
  "timestamp": "2025-01-16T…"
}
```

**Notes**
- `athletes` is grouped by high-level unit (`offense`, `defense`, `special-teams`). Each `items` entry contains full bio + contract shells.
- Player positions include both the leaf (`WR`) and the parent grouping (e.g., Offense).
- The feed occasionally includes inactive/IR players; check `status.type` and `injuries` for availability.
- Historical rosters can be pulled by setting `season=YYYY` (e.g., `season=2023`).

---

## Schedule — `/teams/{teamId}/schedule`

**Query parameters**

| Parameter | Description |
|-----------|-------------|
| `season` | Four-digit season year (defaults to current). |
| `seasontype` | `1` = preseason, `2` = regular season, `3` = postseason. Defaults to regular if omitted. |

**Structure**

```jsonc
{
  "team": { "id": "12", "displayName": "Kansas City Chiefs" },
  "season": { "year": 2024 },
  "requestedSeason": { "year": 2024, "type": { "id": "2", "name": "Regular Season" } },
  "byeWeek": 6,
  "events": [
    {
      "id": "401671789",
      "date": "2024-09-06T00:40Z",
      "name": "Baltimore Ravens at Kansas City Chiefs",
      "shortName": "BAL @ KC",
      "week": { "number": 1, "text": "Week 1" },
      "competitions": [
        {
          "status": { "type": { "name": "STATUS_FINAL" } },
          "venue": { "fullName": "GEHA Field at Arrowhead Stadium" },
          "competitors": [
            { "team": { "displayName": "Kansas City Chiefs" }, "homeAway": "home", "score": { "displayValue": "27" }, "record": [ { "type": "total", "displayValue": "1-0" } ], "winner": true },
            { "team": { "displayName": "Baltimore Ravens" }, "homeAway": "away", "score": { "displayValue": "20" }, "record": [ { "displayValue": "0-1" } ], "winner": false }
          ],
          "broadcasts": [ … ],
          "ticketsAvailable": true,
          "attendance": 73611
        }
      ],
      "links": [ { "rel": ["summary", "desktop", "event"], "href": "https://www.espn.com/nfl/game/_/gameId/401671789/ravens-chiefs" }, … ]
    }, …
  ]
}
```

**Notes**
- `events` covers both completed and future games. `timeValid` indicates whether kickoff time is confirmed.
- Each competition includes broadcasting info, notes (e.g., playoff round), and `neutralSite` flag.
- `competitors[].record` supplies mini-record snapshots (overall, home/away) immediately after the game.
- `byeWeek` is the numeric week number of the team’s bye (if applicable).

---

## Team Statistics — `/seasons/{season}/types/{type}/teams/{teamId}/statistics`

**Purpose**: Aggregated team stats for the specified season + season type.

**Structure**

```jsonc
{
  "team": { "$ref": "…/teams/12" },
  "season": { "year": 2025 },
  "seasonType": { "id": 2, "name": "Regular Season" },
  "splits": {
    "id": "0",
    "name": "overall",
    "abbreviation": "Any",
    "categories": [
      {
        "name": "general",
        "displayName": "General",
        "stats": [
          { "name": "fumbles", "value": 2.0, "displayValue": "2", "perGameValue": 1.0, "rank": 10, "rankDisplayValue": "Tied-10th" },
          { "name": "gamesPlayed", "value": 2.0, "displayValue": "2" },
          { "name": "totalPenalties", "value": 16.0, "displayValue": "16" },
          …
        ]
      },
      { "name": "passing", … },
      { "name": "rushing", … },
      …
    ]
  }
}
```

**Notes**
- Categories align with the stat tables on ESPN’s team page (general, offense, defense, special teams). Each stat includes `displayName`, `shortDisplayName`, `description`, optional `perGameValue`, and league `rank`.
- The Core API uses HAL-style references (`$ref`). Follow them when you need richer linked resources.
- When stats are not yet available (e.g., preseason), `categories` may be empty. Handle gracefully.

---

## Team Record — `/seasons/{season}/types/{type}/teams/{teamId}/record`

**Purpose**: Detailed win/loss splits for the requested season and season type.

**Structure**

```jsonc
{
  "count": 9,
  "pageIndex": 1,
  "pageSize": 50,
  "items": [
    {
      "$ref": "…/records/0",
      "id": "0",
      "name": "overall",
      "abbreviation": "Any",
      "type": "total",
      "summary": "12-5",
      "displayValue": "12-5",
      "value": 0.7058823529411765,
      "stats": [
        { "name": "wins", "value": 12.0, "displayValue": "12" },
        { "name": "losses", "value": 5.0, "displayValue": "5" },
        { "name": "winPercent", "value": 0.7058824, "displayValue": ".706" },
        { "name": "avgPointsFor", "value": 28.235294, "displayValue": "28.2" },
        { "name": "avgPointsAgainst", "value": 21.411764, "displayValue": "21.4" },
        { "name": "divisionRecord", "displayValue": "5-1" },
        { "name": "streak", "displayValue": "W1" },
        …
      ]
    },
    { "name": "home", "summary": "7-2", … },
    { "name": "road", "summary": "5-3", … },
    { "name": "division", … },
    …
  ]
}
```

**Notes**
- This feed supports pagination but typically returns all splits in one page for a single team.
- `summary`/`displayValue` provide the human-readable record string. Numeric stats (`value`) allow computation of percentages and rankings.
- Additional items include situational splits (home, road, vs conference, vs division, overtime, etc.).

---

## Implementation Guidance

- **Caching**: Team profile, roster, and historical record data update infrequently (weekly or after roster moves). Cache aggressively to minimize repeated calls.
- **Stat alignment**: The Core statistics feed mirrors the label/value pattern used elsewhere in ESPN endpoints. Build helper utilities to map `stats` arrays to consuming components.
- **Error handling**: If data is unavailable (e.g., stats before season start), categories or items may be empty arrays. Treat empty sets as “no data yet” rather than failures.
- **Locale parameters**: Both Site and Core APIs respect `lang` and `region`. Defaults (`lang=en`, `region=us`) are sufficient for English output.
- **Link traversal**: `$ref` links in Core responses point to richer resources (e.g., franchise, team, venue). Resolve them lazily to avoid unnecessary network chatter.

_Last updated: 2025-01-16._
