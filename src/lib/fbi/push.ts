import { supabaseAdmin } from "@/lib/supabase/admin";
import { FbiClient } from "./client";
import { formatDateFr } from "./fetch";
import { searchDesignations } from "./searchDesignations";
import { matchesFbiRow } from "./sync";
import { assignRefereeToFbiRencontre } from "./write";

type MatchForPush = {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  fbiIdRencontre: string | null;
  designations: {
    position: number;
    referee: { firstName: string; lastName: string; nationalNumber: string | null };
    /** Conflit d'horaire côté AlloArbitre (cf. annotateDesignationConflicts) : jamais poussé vers FBI. */
    conflict?: string | null;
  }[];
};

/**
 * Retrouve l'idRencontre FBI d'un match AlloArbitre (même logique de
 * rapprochement que la comparaison en lecture, cf. sync.ts), en cherchant sur
 * une fenêtre étroite autour de sa date. Une fois trouvé, mis en cache sur
 * Match.fbiIdRencontre pour éviter de refaire la recherche à chaque push.
 */
async function resolveFbiIdRencontre(client: FbiClient, match: MatchForPush): Promise<string> {
  if (match.fbiIdRencontre) return match.fbiIdRencontre;

  const matchDate = new Date(match.date);
  const du = new Date(matchDate.getTime() - 24 * 60 * 60 * 1000);
  const au = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000);
  const rows = await searchDesignations(client, { dateDebut: formatDateFr(du), dateFin: formatDateFr(au) });

  const candidate = rows.find((r) => r.idRencontre && matchesFbiRow(r, match));
  if (!candidate?.idRencontre) {
    throw new Error(
      `Aucune rencontre FBI trouvée pour ${match.homeTeam} - ${match.awayTeam} le ${formatDateFr(matchDate)}`
    );
  }

  const { error } = await supabaseAdmin
    .from("Match")
    .update({ fbiIdRencontre: candidate.idRencontre })
    .eq("id", match.id);
  if (error) console.error("[fbi-push] échec de la mise en cache de fbiIdRencontre:", error);

  return candidate.idRencontre;
}

export type FbiPushPositionResult = {
  position: number;
  referee: string;
  status: "ok" | "skip" | "conflict" | "error";
  message: string;
};

export type FbiPushMatchResult = {
  matchId: string;
  matchLabel: string;
  idRencontre: string | null;
  positions: FbiPushPositionResult[];
  error?: string;
};

const OCCUPIED_RE = /^Position \d+ déjà occupée sur FBI par .* \(licence (.+?)\)/;

async function pushOnePosition(
  client: FbiClient,
  idRencontre: string,
  position: number,
  refereeLabel: string,
  nationalNumber: string | null
): Promise<FbiPushPositionResult> {
  if (!nationalNumber) {
    return { position, referee: refereeLabel, status: "error", message: "Numéro national manquant côté AlloArbitre" };
  }
  try {
    const result = await assignRefereeToFbiRencontre(client, idRencontre, { position, numeroNational: nationalNumber, dryRun: false });
    return {
      position,
      referee: refereeLabel,
      status: "ok",
      message: result.frais.deuxiemeMatchMemeSalle
        ? "Désigné sur FBI (0 km : 2e match du jour dans la même salle)"
        : "Désigné sur FBI",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const occupied = message.match(OCCUPIED_RE);
    if (occupied) {
      return occupied[1] === nationalNumber
        ? { position, referee: refereeLabel, status: "skip", message: "Déjà désigné sur FBI" }
        : { position, referee: refereeLabel, status: "conflict", message };
    }
    return { position, referee: refereeLabel, status: "error", message };
  }
}

/** Pousse toutes les désignations AlloArbitre d'un match vers FBI (une position à la fois, jamais d'écrasement). */
export async function pushMatchToFbi(client: FbiClient, match: MatchForPush): Promise<FbiPushMatchResult> {
  const matchLabel = `${match.homeTeam} - ${match.awayTeam} (${formatDateFr(new Date(match.date))})`;
  if (match.designations.length === 0) {
    return { matchId: match.id, matchLabel, idRencontre: match.fbiIdRencontre, positions: [], error: "Aucune désignation à pousser" };
  }

  let idRencontre: string;
  try {
    idRencontre = await resolveFbiIdRencontre(client, match);
  } catch (err) {
    return {
      matchId: match.id,
      matchLabel,
      idRencontre: null,
      positions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const positions: FbiPushPositionResult[] = [];
  for (const d of match.designations) {
    const refereeLabel = `${d.referee.firstName} ${d.referee.lastName}`;
    if (d.conflict) {
      positions.push({
        position: d.position,
        referee: refereeLabel,
        status: "conflict",
        message: `Non poussé : conflit d'horaire à corriger dans AlloArbitre. ${d.conflict}`,
      });
      continue;
    }
    positions.push(await pushOnePosition(client, idRencontre, d.position, refereeLabel, d.referee.nationalNumber));
  }

  return { matchId: match.id, matchLabel, idRencontre, positions };
}
