# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 103 files · ~61,624 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 678 nodes · 1860 edges · 24 communities (19 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a260780`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- write.ts
- matches.ts
- getCurrentUser
- next
- suggestions.ts
- espace/page.tsx
- stats.ts
- package.json
- geocoding.ts
- arbitres/[id]/page.tsx
- CheckboxPicker
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- current-user.ts
- AlertToast
- import-matches.ts
- utilisateurs/page.tsx

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 90 edges
2. `next` - 48 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `getMatchCandidates()` - 21 edges
9. `GET()` - 18 edges
10. `AvailabilityPeriodPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/espace/page.tsx → src/lib/supabase/server.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (24 total, 5 thin omitted)

### Community 0 - "write.ts"
Cohesion: 0.05
Nodes (76): cheerio, dynamic, GET(), maxDuration, readableError(), dynamic, FbiRencontrePage(), maxDuration (+68 more)

### Community 1 - "matches.ts"
Cohesion: 0.06
Nodes (65): react, dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES, maxDuration (+57 more)

### Community 2 - "getCurrentUser"
Cohesion: 0.15
Nodes (22): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+14 more)

### Community 3 - "next"
Cohesion: 0.05
Nodes (51): nextConfig, next, @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic (+43 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.07
Nodes (64): dynamic, ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage(), designate(), matches() (+56 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.08
Nodes (45): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+37 more)

### Community 6 - "stats.ts"
Cohesion: 0.09
Nodes (37): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+29 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.25
Nodes (15): FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords(), removeDuplicateRencontres(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary, cleanPlaceName() (+7 more)

### Community 9 - "arbitres/[id]/page.tsx"
Cohesion: 0.15
Nodes (23): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+15 more)

### Community 10 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 13 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, fluid, regions

### Community 18 - "schema.sql"
Cohesion: 0.16
Nodes (22): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "LevelMapping", "Match" (+14 more)

### Community 19 - "current-user.ts"
Cohesion: 0.15
Nodes (15): dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, dynamic, Variant (+7 more)

### Community 20 - "AlertToast"
Cohesion: 0.19
Nodes (16): EditRefereePage(), deleteReferee(), updateReferee(), createReferee(), dynamic, NewRefereePage(), EditMatchPage(), deleteMatch() (+8 more)

### Community 21 - "import-matches.ts"
Cohesion: 0.22
Nodes (12): dynamic, ImportMatchsPage(), maxDuration, submit(), excelDateToIso(), excelTimeToHm(), HEADER_ALIASES, importMatches() (+4 more)

### Community 22 - "utilisateurs/page.tsx"
Cohesion: 0.24
Nodes (10): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+2 more)

## Knowledge Gaps
- **188 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 216 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `write.ts`, `matches.ts`, `getCurrentUser`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `package.json`, `arbitres/[id]/page.tsx`, `current-user.ts`, `AlertToast`, `import-matches.ts`, `utilisateurs/page.tsx`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _188 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05491268672417421 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `write.ts`, `matches.ts`, `next`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `arbitres/[id]/page.tsx`, `current-user.ts`, `AlertToast`, `import-matches.ts`, `utilisateurs/page.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Should `matches.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05742821473158552 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `write.ts`, `matches.ts`, `next`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `geocoding.ts`, `arbitres/[id]/page.tsx`, `AlertToast`, `import-matches.ts`, `utilisateurs/page.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `getCurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.14624505928853754 - nodes in this community are weakly interconnected._