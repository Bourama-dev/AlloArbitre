# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 104 files · ~78,702 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 696 nodes · 1903 edges · 36 communities (30 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dca47b70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- write.ts
- matches.ts
- getCurrentUser
- referee-auth.ts
- suggestions.ts
- disponibilites/[id]/page.tsx
- export/page.tsx
- package.json
- geocoding.ts
- stats.ts
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- current-user.ts
- dates.ts
- espace/page.tsx
- referees.ts
- utilisateurs/page.tsx
- controls.ts
- next
- matchs/[id]/page.tsx
- suggestions-list.tsx
- refereeOwnClubTeam
- proxy.ts
- devDependencies
- dependencies
- CheckboxPicker
- scripts
- eslint.config.mjs

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 93 edges
2. `next` - 49 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `evaluateMatchCandidates()` - 22 edges
9. `AvailabilityPeriodPage()` - 18 edges
10. `GET()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `handlePreview()` --calls--> `previewAutoDesignation()`  [EXTRACTED]
  src/components/fbi-matches-panel.tsx → src/lib/actions/auto-designate-actions.ts

## Import Cycles
- None detected.

## Communities (36 total, 6 thin omitted)

### Community 0 - "write.ts"
Cohesion: 0.05
Nodes (82): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+74 more)

### Community 1 - "matches.ts"
Cohesion: 0.07
Nodes (51): react, dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES, maxDuration (+43 more)

### Community 2 - "getCurrentUser"
Cohesion: 0.15
Nodes (22): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+14 more)

### Community 3 - "referee-auth.ts"
Cohesion: 0.19
Nodes (18): dynamic, RefereeActivationPage(), activate(), dynamic, RefereeLoginPage(), login(), activateRefereeAccount(), AuthResult (+10 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.12
Nodes (30): divisionPriorityRank(), previewAutoDesignation(), ageAt(), divisionAgeCategory(), divisionReasons(), getDivisionRules(), loadAvailabilityIndex(), buildWhy() (+22 more)

### Community 5 - "disponibilites/[id]/page.tsx"
Cohesion: 0.10
Nodes (32): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, createPeriod() (+24 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (26): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+18 more)

### Community 7 - "package.json"
Cohesion: 0.17
Nodes (11): name, private, version, cheerio, @supabase/supabase-js, tailwindcss, @tailwindcss/postcss, @types/node (+3 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.10
Nodes (37): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), updateReferee(), createReferee(), EditMatchPage() (+29 more)

### Community 9 - "stats.ts"
Cohesion: 0.20
Nodes (15): cachedRoadDistances(), coordKey(), fetchMatrix(), roadDistance, roadDistancesTo(), clubOfTeam(), ClubStats, computeSeasonStats() (+7 more)

### Community 10 - "nav.tsx"
Cohesion: 0.13
Nodes (14): geistMono, geistSans, metadata, RootLayout(), MobileNav(), NavLink, adminLinks, linkClass() (+6 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.16
Nodes (22): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "LevelMapping", "Match" (+14 more)

### Community 19 - "current-user.ts"
Cohesion: 0.13
Nodes (21): react-dom, dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, dynamic (+13 more)

### Community 20 - "dates.ts"
Cohesion: 0.15
Nodes (17): dynamic, MatchesPage(), designate(), addWeeks(), formatDateFr(), PRE_MATCH_PRESENCE_MINUTES, weekRange(), checkQuotaRules() (+9 more)

### Community 21 - "espace/page.tsx"
Cohesion: 0.15
Nodes (24): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), AvailabilityPeriodsPage(), dynamic, formatDay() (+16 more)

### Community 22 - "referees.ts"
Cohesion: 0.19
Nodes (16): dynamic, EditRefereePage(), deleteReferee(), dynamic, RefereesPage(), todayIso(), computeUnavailableRefereeIds(), getRefereeSheet() (+8 more)

### Community 24 - "utilisateurs/page.tsx"
Cohesion: 0.24
Nodes (10): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+2 more)

### Community 25 - "controls.ts"
Cohesion: 0.16
Nodes (15): ControlsPage(), dynamic, PERIODS, CommitteeSettings, DivisionRules, getSettings(), maxDistanceReason(), MIN_DESIGNATION_AGE (+7 more)

### Community 26 - "next"
Cohesion: 0.17
Nodes (13): nextConfig, next, dynamic, GET(), ComptePage(), changePassword(), dynamic, logout() (+5 more)

### Community 27 - "matchs/[id]/page.tsx"
Cohesion: 0.36
Nodes (8): dynamic, MatchDetailPage(), designate(), hasSchedulingConflict(), distanceKm(), estimatePayment(), getMatchById(), designateReferee()

### Community 28 - "suggestions-list.tsx"
Cohesion: 0.43
Nodes (6): matches(), normalize(), SuggestionsList(), renderRow(), IneligibleReferee, RefereeSuggestion

### Community 29 - "refereeOwnClubTeam"
Cohesion: 0.48
Nodes (6): normalize(), ownClubMessage(), refereeOwnClubTeam(), teamClubSegments(), isLaterMatchSameVenueSameDay(), annotateDesignationConflicts()

### Community 30 - "proxy.ts"
Cohesion: 0.20
Nodes (8): @supabase/ssr, SUPABASE_ANON_KEY, SUPABASE_URL, AUTH_ROUTES, config, REFEREE_PUBLIC_ROUTES, REFEREE_ROUTES, SELF_AUTH_API_ROUTES

### Community 31 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 32 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr, @supabase/supabase-js

### Community 33 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

### Community 34 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 35 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **196 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 222 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `write.ts`, `matches.ts`, `getCurrentUser`, `referee-auth.ts`, `disponibilites/[id]/page.tsx`, `export/page.tsx`, `package.json`, `geocoding.ts`, `nav.tsx`, `current-user.ts`, `dates.ts`, `espace/page.tsx`, `referees.ts`, `utilisateurs/page.tsx`, `controls.ts`, `matchs/[id]/page.tsx`, `suggestions-list.tsx`, `proxy.ts`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _196 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `write.ts`, `matches.ts`, `suggestions.ts`, `disponibilites/[id]/page.tsx`, `export/page.tsx`, `geocoding.ts`, `nav.tsx`, `current-user.ts`, `dates.ts`, `espace/page.tsx`, `referees.ts`, `utilisateurs/page.tsx`, `next`, `matchs/[id]/page.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Should `matches.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06862745098039216 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `write.ts`, `matches.ts`, `referee-auth.ts`, `suggestions.ts`, `disponibilites/[id]/page.tsx`, `geocoding.ts`, `stats.ts`, `espace/page.tsx`, `referees.ts`, `utilisateurs/page.tsx`, `controls.ts`, `matchs/[id]/page.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `getCurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.14624505928853754 - nodes in this community are weakly interconnected._