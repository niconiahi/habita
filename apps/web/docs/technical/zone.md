# Zone filtering

## The problem we're solving

The properties page had a zone filter that worked by comparing text strings. When a user selected a zone like "Palermo", the query did `WHERE location.suburb = 'Palermo' OR location.city = 'Palermo' OR location.town = 'Palermo'`. This was fundamentally fragile because the values in those columns come from Nominatim's geocoding response at the time each property was created, and Nominatim is wildly inconsistent about what it puts in each field. A property might have its suburb as "Palermo", another as "Palermo Hollywood", another might not have a suburb at all and instead have the neighborhood name in the city field. The old `zone` table was just a flat list of names and types (suburb/city/town) with no geometry — it was essentially a lookup table for text matching.

The consequence was that users would select a zone and miss properties that were clearly inside it. There's no way to fix this with text matching because the problem is in the source data, not in our code. Two properties on the same block can have different suburb values depending on when they were geocoded and what Nominatim decided to return that day.

## Why polygons

Every property already stores a PostGIS `point` in the `location` table — the exact latitude/longitude as a geometry. This has been there since the beginning, used for map display. Nominatim's internal PostgreSQL database (the `placex` table) stores polygon geometries for administrative boundaries. Not all entries have polygons — `class='place'` entries are almost entirely POINTs with no boundaries, but `class='boundary', type='administrative'` entries all have POLYGON or MULTIPOLYGON geometries (see Nominatim reference section below).

So the idea is simple: instead of comparing the text "Palermo" against three string columns, we check whether the property's point falls inside Palermo's polygon using `ST_Contains(zone.geometry, location.point)`. This is geometrically precise. If the building is inside the boundary, it matches. It doesn't matter what string Nominatim put in the suburb field.

## Nominatim reference

Self-hosted Nominatim instance running in the geo stack. Used for geocoding addresses when creating/editing properties, and as the source of zone boundary data.

- Start: `just geo`
- Internal address: `http://nominatim:8080`
- Proxied to the app via: `src/routes/nominatim/search/+server.ts`
- Internal database: PostgreSQL with PostGIS, database name `nominatim`

### The `placex` table

Nominatim's main table. Every geographic feature from OpenStreetMap lives here. Key columns:

| Column         | Type     | Description                                            |
| -------------- | -------- | ------------------------------------------------------ |
| `name`         | hstore   | Name in multiple languages. Access with `name->'name'` |
| `class`        | text     | Primary category (e.g., `place`, `boundary`)           |
| `type`         | text     | Sub-category (e.g., `suburb`, `administrative`)        |
| `admin_level`  | integer  | Administrative hierarchy level                         |
| `country_code` | text     | ISO country code (e.g., `ar`)                          |
| `geometry`     | geometry | POINT, POLYGON, or MULTIPOLYGON                        |

**Key finding**: `class='place'` entries are almost entirely POINTs (no boundary polygon). The actual polygon boundaries live under `class='boundary', type='administrative'` — all 14,930 Argentine entries have POLYGON or MULTIPOLYGON geometries.

### Argentine admin levels

| Level | What it is                                      | Count  |
| ----- | ----------------------------------------------- | ------ |
| 4     | Provincia / CABA                                | 24     |
| 5     | Departamento / Partido                          | ~528   |
| 6     | Distrito, Pedanía, Cuartel (varies by province) | ~655   |
| 7     | Municipio                                       | ~1,964 |
| 8     | Localidad                                       | ~2,051 |
| 9     | Barrio                                          | ~5,779 |
| 10    | (no official name — community-contributed data) | ~3,711 |

Source: [OSM Wiki — boundary=administrative](https://wiki.openstreetmap.org/wiki/Tag:boundary=administrative). The scheme is "proposed" — not fully standardized.

### Province × level map

Each province uses different levels. Full data at `apps/web/temp/province_levels.md`.

| Provincia    | 6              | 7                      | 8               | 9             | 10    |
| ------------ | -------------- | ---------------------- | --------------- | ------------- | ----- |
| Buenos Aires | Cuartel (179)  | —                      | Localidad (561) | Barrio (1554) | (87)  |
| CABA         | —              | —                      | —               | Barrio (48)   | —     |
| Catamarca    | —              | Municipio (35)         | Localidad (81)  | Barrio (68)   | (153) |
| Córdoba      | Pedanía (146)  | Municipio (426)        | Localidad (279) | Barrio (877)  | (145) |
| Entre Ríos   | Distrito (106) | Municipio (229)        | Localidad (44)  | Barrio (133)  | (182) |
| Mendoza      | Distrito (203) | —                      | Localidad (23)  | Barrio (292)  | —     |
| San Juan     | Distrito (20)  | —                      | Localidad (3)   | Barrio (4)    | (853) |
| Santa Fe     | —              | Municipio/Comuna (373) | Localidad (170) | Barrio (618)  | (395) |

(Remaining provinces follow similar patterns — see `province_levels.md` for the full table.)

Notable variations:

- **Depto = Municipio** (same entity, no level 7): La Rioja, Mendoza, San Juan
- **Level 6 varies**: Cuartel (Buenos Aires), Pedanía (Córdoba), Distrito (Entre Ríos, Mendoza, San Juan)
- **CABA**: Comunas at level 5, barrios at level 9

### Hierarchy examples

**Buenos Aires province** (skips level 7):

```
Provincia Buenos Aires (4) → Partido (5) → Localidad (8)
  e.g. Buenos Aires → Partido de La Matanza → Ramos Mejía, San Justo...
```

**CABA** (goes directly to barrios):

```
CABA (4) → Barrio (9)
  e.g. CABA → Palermo, Recoleta, Caballito... (48 barrios)
```

**Córdoba**:

```
Provincia Córdoba (4) → Departamento (5) → Municipio/Comuna (7) → Localidad (8) → Barrio (9)
  e.g. → Departamento Capital → Municipio de Córdoba → Córdoba → Nueva Córdoba, Güemes...
```

### Duplicate names

Names repeat across provinces:

- Level 8: "San Justo" in Buenos Aires, Entre Ríos, Santa Fe. "Avellaneda" in Buenos Aires, Córdoba.
- Level 9: "Centro" appears 79 times. "San Martín" 34 times. "Belgrano" 28 times.

Disambiguation requires the `label` column which includes parent departamento/partido and provincia.

### Spatial query performance

With GiST indexes on both `zone.geometry` and `location.point`, `ST_Contains` is fast:

1. Polygon lookup by id → **~0.04ms** (index scan)
2. GiST index narrows candidates by bounding box → **~1ms** (skips all points clearly outside)
3. Precise `ST_Contains` check on remaining candidates → **~0.4ms**

Benchmarked at **6.6ms total** against Nominatim's 4M row `placex` table. Against the app's `location` table (hundreds of rows) it's even faster.

### Querying Nominatim's DB directly

```bash
docker compose -p geo -f infra/geo/docker-compose.yml -f infra/geo/docker-compose.dev.yml \
  exec -T nominatim \
  su - postgres -c "psql -d nominatim -t -A -c \"YOUR_QUERY\""
```

## Single table design

A zone is a zone — some are bigger (provinces), some are smaller (barrios). There's no reason for the application to care which admin level a zone belongs to. The `ST_Contains` query works identically regardless of polygon size. A single `zone` table with a single `zone_id` filter simplifies everything: one table, one param, one subquery, one hidden input.

The table has ~14,700 rows covering admin levels 4–10:

```
zone
├── id (serial PK)
├── name (text)          — "Palermo", "Buenos Aires", "Partido de La Matanza"
├── admin_level (integer) — 4, 5, 6, 7, 8, 9, 10
├── label (text)          — "Palermo, Comuna 14, Ciudad Autónoma de Buenos Aires"
├── badge (text)          — "Barrio", "Provincia", "Cuartel"
└── geometry (geometry, 4326)
```

The `label` column is pre-composed at extraction time. The combobox displays it as-is with no runtime joins. For level 4 (provinces), label is just the name. For level 5 (departments), it's `"{name}, {province}"`. For levels 6–10, it's `"{name}, {department}, {province}"`, omitting null parents.

The `badge` column is a province-specific level name computed during extraction from the mapping in `apps/web/temp/province_levels.md`. For example, level 6 in Buenos Aires is "Cuartel", in Córdoba it's "Pedanía", in Entre Ríos/Mendoza/San Juan it's "Distrito". Level 7 is always "Municipio", level 8 is "Localidad", level 9 is "Barrio".

No FKs, no relationships — the table is flat. Parent info is baked into `label` and `badge` as text.

## Unique constraint

The table has a unique constraint on `(name, admin_level, label)`. Zone names repeat across different departments (there are many neighborhoods called "Centro"), but the label includes parent context for disambiguation, so the combination is unique. This makes the seed idempotent with `ON CONFLICT DO NOTHING`.

## Indexes

The `zone` table has a GiST index on its `geometry` column. GiST (Generalized Search Tree) is the spatial index type that makes `ST_Contains` queries fast — it builds a bounding-box hierarchy so the database can quickly eliminate polygons that can't possibly contain a given point, then only does exact geometry checks on the few remaining candidates.

We also added a GiST index on `location.point`, which was missing before. Without it, every property filter would require the database to read every property's point from the table to check containment. With the index, the database can use the spatial index on both sides — it knows which polygon to check (from the zone's GiST index) and which points might be inside it (from the location's GiST index).

The existing B-tree indexes on `location.suburb`, `location.city`, and `location.town` are kept. Those columns are still used for display purposes when showing property addresses, even though they're no longer used for filtering.

## Data extraction pipeline

The data comes from Nominatim's internal PostgreSQL database, which we run locally as part of the geo stack (`just geo`). The extraction is triggered with `just zone argentina`.

### File structure

Country-specific extraction data lives in `db/zones/{country}/`:

```
db/zones/argentina/
├── data.tsv      # extracted zone data (~14,700 rows, generated)
├── label.awk     # compute_label() — composes display string from name/dept/province
└── badge.awk     # compute_badge() — maps (admin_level, province) to level name
```

The awk files define pure functions. `label.awk` has `compute_label(level, name, dept, prov)` which composes the display string based on admin level. `badge.awk` has `compute_badge(level, prov)` which looks up the province-specific level name (e.g. level 6 in Buenos Aires is "Cuartel", in Córdoba it's "Pedanía").

The orchestration script `bin/extract_zones.sh` runs the SQL query against Nominatim, then pipes the raw TSV through both awk functions to produce the final `data.tsv`.

### TSV format

We chose TSV over CSV because zone names can contain commas (e.g. "San Fernando del Valle de Catamarca"), and TSV avoids the quoting complexity. The geometry is encoded as hex EWKB (Extended Well-Known Binary) — this is a lossless format that preserves the full precision and SRID of the geometry, and it's what PostGIS natively understands, so there's no conversion loss when we insert it back.

### SQL query

The extraction query selects all admin levels 4–10 from `placex` and joins each zone with its parent level 5 (department) and level 4 (province) using `ST_Contains` on the zone's centroid. We use the centroid rather than the full geometry for the containment check because `ST_Contains(parent, ST_Centroid(child))` is much faster than `ST_Contains(parent, child)` and works correctly for the hierarchical nesting we need. The LEFT JOINs mean zones without a matching parent get NULL for those columns.

These extraction queries are slow — they take minutes because of the spatial joins on the full `placex` table. This is fine because they run once during setup, not at runtime. The results are static — Argentina's administrative boundaries don't change often enough to need automated updates.

### Label edge cases

Out of ~14,700 zones, 3 have incomplete labels due to missing parent data in OSM:

- 1 zone with only province (no department): `"Dock Sud, Buenos Aires"`
- 2 zones with no parents at all: `"Ushuaia"`, `"Bahía Ushuaia"` (Tierra del Fuego boundary data is sparse)

All three are still unique names, so there's no disambiguation issue.

## Seeding

The seed file `db/seeds/012_zones.ts` iterates over all country directories in `db/zones/*/data.tsv`. For each valid TSV file (header must match the expected columns), it inserts rows using raw SQL with `ST_GeomFromEWKB(decode(hex, 'hex'))`. We use `ON CONFLICT (name, admin_level, label) DO NOTHING` so the seed is idempotent.

The seed validates each TSV header before processing. If the header doesn't match (e.g. a stale file from a previous schema), the file is skipped with a log message. If no valid TSV files exist (because `just zone argentina` hasn't been run), the entire seed is skipped. This ensures `just db reset` never fails due to missing zone data.

## How the filter works at query time

The properties fetcher (`$lib/server/fetchers/properties.ts`) accepts a single optional `zone_id` filter param. When set, it translates to an `EXISTS` subquery:

```sql
WHERE EXISTS (
  SELECT 1 FROM zone
  WHERE zone.id = $zone_id
    AND ST_Contains(zone.geometry, location.point)
)
```

We use `EXISTS` with a subquery rather than a `JOIN` because the filter is optional — when no zone is selected, we don't want to join the zone table at all. The `EXISTS` pattern keeps the main query shape unchanged regardless of which filters are active, which is the same pattern used for the tag and service filters throughout the codebase.

The `sql<SqlBool>` type annotation on the `ST_Contains` call is needed because Kysely's `.where()` method expects an expression that resolves to a SQL boolean. Raw SQL templates default to `RawBuilder<unknown>`, which doesn't satisfy that type constraint. The generic parameter tells Kysely "this expression evaluates to a boolean".

## The set_filters action

The `set_filters` action in `routes/properties/actions/set_filters.server.ts` handles the form submission from the zone combobox (and all other filters). It has a single `zone_id: v.optional(ForceNumberSchema)` field.

The action reads this from FormData, validates it, and builds a redirect URL with the `zone_id` search param. The `ZONE_PARAMS` array (just `["zone_id"]`) makes it easy to loop over without duplicating the set/delete logic.

The `parse_filters` function reads `zone_id` back from the URL search params on page load and converts it to a number.

## The ZoneInput component

The `ZoneInput` component (`$lib/components/ZoneInput.svelte`) is a combobox that presents all zones from the single `zone` table. Each item has an `id`, `label` (pre-composed display string), and `badge` (level name).

When the user selects an item, the component renders a single hidden `<input name="zone_id" value={selected.id}>`. When no item is selected, no hidden input is rendered, so no zone param is sent and the filter is cleared.

### Search behavior

The combobox filters client-side by splitting the typed query into words and checking that every word appears somewhere in the label (case-insensitive, diacritics-stripped). For example:

- `"palermo ciudad de"` matches `"Palermo, Comuna 14, Ciudad Autónoma de Buenos Aires"` — each word ("palermo", "ciudad", "de") is found independently in the label
- `"palermo cor"` matches `"Alto Palermo, Departamento Capital, Córdoba"` — diacritics are stripped so "cor" matches "Córdoba"

Diacritic stripping uses `String.normalize("NFD")` to decompose characters (e.g. `ó` → `o` + combining accent), then removes the combining marks. This handles all accented characters (á, é, í, ó, ú, ü, ñ).

Each item in the dropdown shows the label and a badge on the right side ("Provincia", "Departamento", "Municipio", "Localidad", "Barrio", etc.). The badge helps disambiguate items with the same name at different levels — there's a "Córdoba" province and a "Córdoba" localidad, for example.

## The properties page loader

The loader in `routes/properties/+page.server.ts` calls `fetch_zones()` which returns all zones (id, name, admin_level, label, badge) ordered by name. It maps these to `{ id, label, badge }` for the combobox. The `selected_zone` is derived by finding the zone item matching `filters.zone_id`.

## How zone filters are preserved across other filter interactions

The properties page has multiple independent filter forms — the zone combobox, tag toggles, service toggles, and range filters. Each form submits to the same `set_filters` action, and each needs to preserve all the other active filters. Each non-zone form includes a single conditional hidden input:

```svelte
{#if data.filters.zone_id}
  <input
    type="hidden"
    name="zone_id"
    value={data.filters.zone_id}
  />
{/if}
```

The `range_hidden_entries` derived value excludes `"zone_id"` so it doesn't get duplicated in the catch-all hidden inputs for range filters.

## What stays the same

The existing `location.suburb`, `location.city`, and `location.town` columns are untouched. They're still populated by Nominatim during property creation and still used for display (the `display_location` function uses them to show human-readable addresses). Their B-tree indexes are kept too. The zone filtering system simply doesn't depend on them anymore — filtering is spatial, display is textual.

The rest of the filter system (tags, services, room counts, surface area, construction year) is completely unchanged. The `PropertyFilters` interface just has a single `zone_id?: number` field.

## Workflow

```
just geo                # start Nominatim (one-time, heavy)
just zone argentina     # extract zones → db/zones/argentina/data.tsv
just db reset           # migrations + seeds (picks up all db/zones/*/data.tsv)
```

Extraction and database reset are independent operations. Extraction only needs to be re-run if the Nominatim data changes (rare).

## Files

- `db/migrations/1774111243531_add_zone.ts` — single `zone` table with geometry column, GiST indexes, and unique constraint
- `db/zones/argentina/label.awk` — `compute_label()` function for Argentine label composition
- `db/zones/argentina/badge.awk` — `compute_badge()` function for Argentine badge mapping
- `db/zones/argentina/data.tsv` — extracted zone data (generated by `just zone argentina`)
- `bin/extract_zones.sh` — orchestrates SQL extraction + awk transformation
- `db/seeds/012_zones.ts` — iterates `db/zones/*/data.tsv`, inserts with geometry
- `db/types.ts` — `Zone` interface
- `$lib/server/fetchers/zones.ts` — single `fetch_zones()` function
- `$lib/server/fetchers/properties.ts` — single `zone_id` filter with `ST_Contains` subquery
- `routes/properties/actions/set_filters.server.ts` — single `zone_id` param
- `$lib/components/ZoneInput.svelte` — combobox with multi-word diacritics-insensitive search
- `routes/properties/+page.server.ts` — single `fetch_zones()` call, simplified loader
- `routes/properties/+page.svelte` — single hidden input for zone preservation
- `zone.just` — `just zone argentina` recipe
