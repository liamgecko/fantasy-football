# ESPN NFL Teams Endpoint

- **Endpoint**: `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`
- **Purpose**: Returns the master list of NFL franchises tracked by ESPN, including IDs, branding assets, and navigation links. Useful for building team selectors, enriching roster data, or resolving `teamId` references from other endpoints.
- **Auth**: Public, no headers required.
- **Default payload**: All 32 franchises (~45 KB gzipped).

## Query Parameters

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `limit` | number | 32 | Page size. Use to paginate through the collection. |
| `page` | number (1-based) | 1 | When `limit` is set, advance through pages (e.g., `page=2`). |
| `lang`, `region` | string | `en`, `us` | Optional locale hints. Content is largely identical across locales. |

> Example: `GET …/teams?limit=5&page=2` yields five teams starting with the Dallas Cowboys.

## Response Envelope

```jsonc
{
  "sports": [
    {
      "id": "20",
      "uid": "s:20",
      "name": "Football",
      "slug": "football",
      "leagues": [
        {
          "id": "28",
          "uid": "s:20~l:28",
          "name": "National Football League",
          "abbreviation": "NFL",
          "shortName": "NFL",
          "slug": "nfl",
          "year": 2025,
          "season": { "year": 2025, "displayName": "2025" },
          "teams": [ { "team": { /* see below */ } }, … ]
        }
      ]
    }
  ]
}
```

- `sports`: Outer wrapper keyed by ESPN sport ID (`20` for football).
- `leagues`: Contains one entry for the NFL with season metadata and the `teams` list.
- `year` / `season`: Mirror the current year/label ESPN associates with the feed. Not tied to schedule status.

## Team Object Schema

Each `teams[n].team` entry contains branding and navigation data for a franchise.

| Field | Description |
|-------|-------------|
| `id` | Stringified ESPN team ID (e.g., `"10"` for the Titans). Primary key for other endpoints (`team`/`statistics`, schedule, roster, etc.). |
| `uid` | Global identifier `s:{sportId}~l:{leagueId}~t:{teamId}`. |
| `slug` | URL-friendly slug (`"tennessee-titans"`). |
| `abbreviation` | Short code used throughout ESPN (`"TEN"`). |
| `displayName` | Full franchise name (`"Tennessee Titans"`). |
| `shortDisplayName` | Shortened name, typically the nickname. |
| `name` | Nickname (`"Titans"`). |
| `nickname` | Duplicate of `name`; use when ESPN differentiates for some leagues. |
| `location` | Market/city (`"Tennessee"`). |
| `color` | Primary hex color (no leading `#`). |
| `alternateColor` | Secondary/trim color used on dark themes. |
| `isActive` | Indicates whether the franchise is active in the league. |
| `isAllStar` | Always `false` for NFL teams; used in other sports for exhibition squads. |
| `logos` | Array of image descriptors (see below). |
| `links` | Array of navigation links to ESPN and partner pages. |

### Logos Array

Each logo entry provides a hosted asset and classification tags.

```jsonc
{
  "href": "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
  "alt": "",
  "rel": ["full", "default"],
  "width": 500,
  "height": 500
}
```

Common `rel` values:
- `full` + `default`: Primary transparent background logo.
- `dark`: Versions suited to dark backgrounds.
- `scoreboard`: Assets sized for scoreboard modules.

### Links Array

Standard navigation metadata for ESPN’s site and ticketing partners.

```jsonc
{
  "language": "en-US",
  "rel": ["clubhouse", "desktop", "team"],
  "href": "https://www.espn.com/nfl/team/_/name/ten/tennessee-titans",
  "text": "Clubhouse",
  "shortText": "Clubhouse",
  "isExternal": false,
  "isPremium": false,
  "isHidden": false
}
```

Typical `rel` values include `clubhouse`, `roster`, `stats`, `schedule`, `tickets`, `depthchart`. Ticket links point to Vivid Seats and set `isExternal: true`.

## Sample Response (Trimmed)

```jsonc
{
  "team": {
    "id": "10",
    "uid": "s:20~l:28~t:10",
    "slug": "tennessee-titans",
    "abbreviation": "TEN",
    "displayName": "Tennessee Titans",
    "shortDisplayName": "Titans",
    "name": "Titans",
    "nickname": "Titans",
    "location": "Tennessee",
    "color": "4b92db",
    "alternateColor": "002a5c",
    "isActive": true,
    "isAllStar": false,
    "logos": [ … ],
    "links": [ … ]
  }
}
```

## Implementation Guidance

- **Caching**: Team metadata changes infrequently. Cache aggressively (weekly or on deploy) and pair with `id` lookups in player data.
- **Branding**: Store the primary and dark logos to support light/dark UI themes. Width/height are consistently 500px (PNG) for NFL assets.
- **Link templating**: Use the `rel` array to identify relevant URLs. ESPN may add new relations (e.g., `transactions`, `injuries`); keep the consumer flexible.
- **Pagination**: When fetching incrementally (`limit` < 32), supply both `limit` and `page`. Missing pages return empty arrays rather than errors.
- **Localization**: Alternate locales currently mirror English strings, but keep `lang`/`region` available in case ESPN expands translations.

_Last updated: 2025-01-16._
