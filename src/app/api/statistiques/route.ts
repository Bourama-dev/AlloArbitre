import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { computeSeasonStats, parseSeason } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Bilan de saison au format Excel : onglets Arbitres, Clubs et Détail des désignations. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const s = parseSeason(url.searchParams.get("saison") ?? undefined);
  const cd45Only = url.searchParams.get("tout") !== "1";
  const stats = await computeSeasonStats(s, { cd45Only });

  const wb = new ExcelJS.Workbook();
  wb.creator = "AlloArbitre";
  wb.created = new Date();
  const header = (ws: ExcelJS.Worksheet) => {
    const row = ws.getRow(1);
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D2F55" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
  };

  const refs = wb.addWorksheet("Arbitres");
  refs.columns = [
    { header: "Nom", key: "lastName", width: 20 },
    { header: "Prénom", key: "firstName", width: 16 },
    { header: "Niveau", key: "level", width: 10 },
    { header: "Club", key: "club", width: 28 },
    { header: "Actif", key: "active", width: 7 },
    { header: "Matchs", key: "total", width: 8 },
    { header: "Joués", key: "played", width: 8 },
    { header: "À venir", key: "upcoming", width: 8 },
    ...stats.divisions.map((d) => ({ header: d, key: `div_${d}`, width: 8 })),
    { header: "Campagnes de dispos", key: "periods", width: 11 },
    { header: "Réponses", key: "responses", width: 10 },
    { header: "Sans réponse", key: "noResponse", width: 11 },
    { header: "Retraits", key: "removals", width: 9 },
    { header: "Km A/R estimés", key: "km", width: 12 },
    { header: "Indemnités estimées (€)", key: "payment", width: 14 },
  ];
  for (const r of stats.referees) {
    refs.addRow({
      lastName: r.lastName,
      firstName: r.firstName,
      level: r.level,
      club: r.club ?? "",
      active: r.active ? "oui" : "non",
      total: r.total,
      played: r.played,
      upcoming: r.upcoming,
      ...Object.fromEntries(stats.divisions.map((d) => [`div_${d}`, r.byDivision[d] ?? 0])),
      periods: r.periods,
      responses: r.responses,
      noResponse: Math.max(0, r.periods - r.responses),
      removals: r.removals,
      km: Math.round(r.km),
      payment: Math.round(r.estimatedPayment * 100) / 100,
    });
  }
  header(refs);

  const clubs = wb.addWorksheet("Clubs");
  clubs.columns = [
    { header: "Club (domicile)", key: "club", width: 30 },
    { header: "Matchs", key: "homeMatches", width: 9 },
    { header: "Complets", key: "complete", width: 10 },
    { header: "Partiels", key: "partial", width: 9 },
    { header: "Sans arbitre", key: "none", width: 11 },
    { header: "Couverture (%)", key: "rate", width: 12 },
    ...stats.divisions.map((d) => ({ header: d, key: `div_${d}`, width: 9 })),
    { header: "Arbitres du club", key: "refereeCount", width: 12 },
    { header: "Matchs sifflés par ses arbitres", key: "byItsReferees", width: 16 },
  ];
  for (const c of stats.clubs) {
    clubs.addRow({
      club: c.club,
      homeMatches: c.homeMatches,
      complete: c.complete,
      partial: c.partial,
      none: c.none,
      rate: c.homeMatches ? Math.round((c.complete / c.homeMatches) * 100) : 0,
      ...Object.fromEntries(
        stats.divisions.map((d) => [`div_${d}`, c.byDivision[d] ? `${c.byDivision[d].complete}/${c.byDivision[d].total}` : ""])
      ),
      refereeCount: c.refereeCount,
      byItsReferees: c.designationsByItsReferees,
    });
  }
  header(clubs);

  const detail = wb.addWorksheet("Désignations");
  detail.columns = [
    { header: "Date", key: "date", width: 17, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    { header: "Arbitre", key: "referee", width: 26 },
    { header: "Position", key: "position", width: 9 },
    { header: "Division", key: "division", width: 10 },
    { header: "Domicile", key: "home", width: 26 },
    { header: "Extérieur", key: "away", width: 26 },
    { header: "Salle", key: "venue", width: 28 },
    { header: "Km (aller)", key: "km", width: 10 },
    { header: "Distance", key: "kind", width: 12 },
    { header: "Indemnité estimée (€)", key: "payment", width: 14 },
  ];
  const lines = stats.referees
    .flatMap((r) => r.lines.map((l) => ({ r, l })))
    .sort((a, b) => a.l.date.getTime() - b.l.date.getTime());
  for (const { r, l } of lines) {
    detail.addRow({
      // Heure du gymnase stockée sans fuseau : Excel affiche la valeur telle quelle.
      date: l.date,
      referee: r.name,
      position: l.position,
      division: l.division,
      home: l.homeTeam,
      away: l.awayTeam,
      venue: l.venue ?? "",
      km: l.km != null ? Math.round(l.km * 10) / 10 : "",
      kind: l.km == null ? "inconnue" : l.km === 0 ? "même salle" : l.kmByRoad ? "route" : "vol d'oiseau",
      payment: l.estimatedPayment != null ? Math.round(l.estimatedPayment * 100) / 100 : "",
    });
  }
  header(detail);

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bilan-arbitrage-CD45-${s.label}.xlsx"`,
    },
  });
}
