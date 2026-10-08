# Graph Report - AlloArbitre  (2026-10-08)

## Corpus Check
- 122 files · ~90,859 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 779 nodes · 2138 edges · 33 communities (25 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4cde0b03`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- disponibilites/[id]/page.tsx
- write.ts
- sync.ts
- next
- suggestions.ts
- espace/page.tsx
- export/page.tsx
- package.json
- arbitres/[id]/page.tsx
- matches.ts
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- referees.ts
- referee-access-actions.ts
- fetch.ts
- getCurrentUser
- availability.ts
- current-user.ts
- CheckboxPicker
- fbi-sync/route.ts
- searchDesignations.ts
- designation-rules.ts
- FbiClient
- client.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 93 edges
2. `next` - 56 edges
3. `supabaseAdmin` - 34 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 29 edges
6. `SubmitButton()` - 28 edges
7. `createClient()` - 27 edges
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 21 edges
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/auth/confirm/route.ts → src/lib/supabase/server.ts
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `GroupsPanel()` --calls--> `CheckboxPicker()`  [EXTRACTED]
  src/app/admin/divisions/groupes-panel.tsx → src/components/checkbox-picker.tsx

## Import Cycles
- None detected.

## Communities (33 total, 8 thin omitted)

### Community 0 - "disponibilites/[id]/page.tsx"
Cohesion: 0.26
Nodes (15): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, activeReferees() (+7 more)

### Community 1 - "write.ts"
Cohesion: 0.21
Nodes (19): overlaps(), analyzeFbiDay(), assignRefereeToFbiRencontre(), checkFbiOfficielEligibility(), dayCache, DayData, deleteOfficielRow(), FbiAlreadyDesignatedError (+11 more)

### Community 2 - "sync.ts"
Cohesion: 0.43
Nodes (7): compareWithAlloArbitre(), FbiMismatch, matchesFbiRow(), MatchRow, normalize(), parseFbiDateTime(), teamNamesMatch()

### Community 3 - "next"
Cohesion: 0.06
Nodes (30): nextConfig, next, @supabase/ssr, dynamic, GET(), dynamic, RefereeActivationPage(), activate() (+22 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (80): dynamic, MatchDetailPage(), designate(), handlePreview(), matches(), normalize(), SuggestionsList(), renderRow() (+72 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.27
Nodes (13): dynamic, One, RefereeSpacePage(), changePassword(), saveAvailability(), daysBetween(), formatDayFr(), mapPeriod() (+5 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (27): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+19 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "arbitres/[id]/page.tsx"
Cohesion: 0.33
Nodes (9): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), addPunctualUnavailability(), addRecurringUnavailability(), removeUnavailability() (+1 more)

### Community 9 - "matches.ts"
Cohesion: 0.05
Nodes (71): react, dynamic, MultiDesignatePage(), ControlsPage(), dynamic, PERIODS, dynamic, FbiPage() (+63 more)

### Community 10 - "nav.tsx"
Cohesion: 0.10
Nodes (21): geistMono, geistSans, metadata, RootLayout(), viewport, AppNav(), AppNavLink, buzz() (+13 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.15
Nodes (23): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "DesignationRule", "LevelMapping" (+15 more)

### Community 19 - "referees.ts"
Cohesion: 0.23
Nodes (13): dynamic, RefereesPage(), todayIso(), CollapsibleFilters(), computeUnavailableRefereeIds(), listRefereeLevels(), listRefereesWithLoad(), listZones() (+5 more)

### Community 20 - "referee-access-actions.ts"
Cohesion: 0.36
Nodes (5): CopyText(), PersonalLinkButton(), generate(), generatePersonalLink(), appUrl()

### Community 21 - "fetch.ts"
Cohesion: 0.13
Nodes (23): dynamic, FbiRencontrePage(), maxDuration, presenceStyles, EtatBadge(), etatStyles, FbiRencontreRow(), presenceStyles (+15 more)

### Community 24 - "getCurrentUser"
Cohesion: 0.05
Nodes (90): dynamic, GroupRow, GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow (+82 more)

### Community 25 - "availability.ts"
Cohesion: 0.15
Nodes (13): AvailabilityPeriodsPage(), createPeriod(), dynamic, formatDay(), AvailabilityIndex, AvailabilityPeriod, AvailabilityStatus, AvailabilityVerdict (+5 more)

### Community 27 - "current-user.ts"
Cohesion: 0.24
Nodes (10): logout(), LoginPage(), login(), SignupPage(), signup(), CurrentReferee, CurrentUser, getSessionProfile (+2 more)

### Community 29 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

### Community 32 - "fbi-sync/route.ts"
Cohesion: 0.24
Nodes (12): dynamic, GET(), maxDuration, readableError(), syncFbiOfficielsToDesignations(), FbiOfficiel, formatDateFr(), FbiPushPositionResult (+4 more)

### Community 34 - "searchDesignations.ts"
Cohesion: 0.18
Nodes (17): cheerio, describe(), dynamic, GET(), maxDuration, Step, timed(), cellText() (+9 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (44): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+36 more)

### Community 37 - "client.ts"
Cohesion: 0.38
Nodes (6): BodyMode, cooldownError(), FbiDump, FetchedResponse, fetchWithRetry(), throttle()

## Knowledge Gaps
- **209 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 244 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `fbi-sync/route.ts`, `disponibilites/[id]/page.tsx`, `searchDesignations.ts`, `designation-rules.ts`, `suggestions.ts`, `espace/page.tsx`, `export/page.tsx`, `package.json`, `arbitres/[id]/page.tsx`, `matches.ts`, `nav.tsx`, `referees.ts`, `fetch.ts`, `getCurrentUser`, `availability.ts`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.05870020964360587 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `fbi-sync/route.ts`, `disponibilites/[id]/page.tsx`, `searchDesignations.ts`, `designation-rules.ts`, `suggestions.ts`, `export/page.tsx`, `arbitres/[id]/page.tsx`, `matches.ts`, `nav.tsx`, `referee-access-actions.ts`, `availability.ts`, `current-user.ts`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05934065934065934 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `getCurrentUser` to `fbi-sync/route.ts`, `disponibilites/[id]/page.tsx`, `sync.ts`, `designation-rules.ts`, `suggestions.ts`, `espace/page.tsx`, `next`, `matches.ts`, `referees.ts`, `availability.ts`, `current-user.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `export/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._