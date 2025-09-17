# ESPN NFL Athletes Endpoint

- **Endpoint**: `GET https://sports.core.api.espn.com/v3/sports/football/nfl/athletes`
- **Purpose**: Supplies the master catalogue of NFL athletes tracked by ESPN. Includes active, inactive, and historical players, plus placeholder records used in play-by-play feeds.
- **Auth**: Public, no headers required.
- **Typical payload size**: ~3 MB gzipped when requesting the full list.

## Request Controls

| Parameter | Type | Notes |
|-----------|------|-------|
| `page`    | number (1-based) | Chooses the page of results. Defaults to `1`. |
| `limit`   | number | Requested page size. Values up to `20000` work; ESPN defaults to `50`. |

The API ignores unknown query parameters. No native filters for team, position, or activity status are exposed here—apply those in the client after retrieval.

### Example: Full Catalogue Pull

```http
GET https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?page=1&limit=20000
```

Use paging (for example `limit=500`) when caching periodically or when constructing incremental updates to avoid large payloads.

## Envelope Structure

```json
{
  "count": 19533,
  "pageIndex": 1,
  "pageSize": 20000,
  "pageCount": 977,
  "items": [ /* Athlete objects */ ]
}
```

- `count`: Total number of athlete records available across all pages.
- `pageIndex`: Matches the requested `page` value.
- `pageSize`: Number of items returned in this response (≤ `limit`).
- `pageCount`: Total number of pages given the current `pageSize`.
- `items`: Array containing the athlete records.

## Athlete Object Schema

Each entry is a shallow object describing biographical and roster metadata. Keys are omitted when data is unavailable.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key used for all other ESPN athlete endpoints.
| `uid` | string | Global identifier: `s:{sportId}~l:{leagueId}~a:{athleteId}`.
| `guid` | string | UUID-style identifier.
| `firstName` | string | Athlete first name. Missing for placeholder/system entries.
| `lastName` | string | Athlete last name.
| `fullName` | string | Convenience concatenation of first + last name.
| `displayName` | string | Name as shown in ESPN UI.
| `shortName` | string | Abbreviated name (e.g., "P. Mahomes").
| `jersey` | string | Jersey number, or `"00"`/absent for placeholders.
| `active` | boolean | `true` when ESPN marks the athlete as roster-active.
| `weight` | number | Weight in pounds.
| `displayWeight` | string | Human-readable weight (e.g., `"225 lbs"`).
| `height` | number | Height in inches.
| `displayHeight` | string | Human-readable height (e.g., `"6' 2\""`).
| `age` | number | Age in years.
| `dateOfBirth` | string (ISO 8601) | Birth date (UTC offset provided).
| `birthPlace` | object | Optional `{ city, state, country }`.
| `experience` | object | Currently observed with `years`; missing for rookies or placeholders.

### Sample: Placeholder Record

```json
{
  "id": "4246273",
  "uid": "s:20~l:28~a:4246273",
  "guid": "64cf2ccf-8d24-d1be-3ff4-d46499bdd9a6",
  "lastName": "[35]",
  "fullName": " [35]",
  "displayName": " [35]",
  "shortName": "[35]",
  "jersey": "35",
  "active": false
}
```

These placeholder athletes appear in play-by-play feeds (e.g., kickoffs, touchbacks). Filter them out by checking for missing `firstName`.

### Sample: Active Player

```json
{
  "id": "3139477",
  "uid": "s:20~l:28~a:3139477",
  "guid": "37d87523-280a-9d4a-0adb-22cfc6d3619c",
  "firstName": "Patrick",
  "lastName": "Mahomes",
  "fullName": "Patrick Mahomes",
  "displayName": "Patrick Mahomes",
  "shortName": "P. Mahomes",
  "weight": 225.0,
  "displayWeight": "225 lbs",
  "height": 74.0,
  "displayHeight": "6' 2\"",
  "age": 29,
  "dateOfBirth": "1995-09-17T07:00Z",
  "birthPlace": {
    "city": "Whitehouse",
    "state": "TX",
    "country": "USA"
  },
  "experience": {
    "years": 9
  },
  "jersey": "15",
  "active": true
}
```

## Implementation Guidance

- **Caching**: Pull and cache the full dataset periodically (daily or hourly in season) to avoid repeated large responses. Diff against cached data to detect roster changes.
- **Filtering**: Combine `active`, `experience.years`, and future team/position data to scope down to fantasy-relevant players.
- **Hydration strategy**: Use the `id` in subsequent calls (e.g., `GET /athletes/{id}` or team rosters) to obtain positions, stats, injury status, and fantasy scoring.
- **Data hygiene**: Expect historical players and placeholders. Validate names and the presence of `firstName`/`lastName` before exposing data in user flows.

Document updated: 2025-01-16.
