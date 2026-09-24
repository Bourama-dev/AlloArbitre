import { supabaseAdmin } from "@/lib/supabase/admin";
import { FbiClient } from "./client";
import { formatDateFr } from "./fetch";
import { searchDesignations } from "./searchDesignations";
import { matchesFbiRow } from "./sync";
import { assignRefereeToFbiRencontre, FbiAlreadyDesignatedError } from "./write";

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

const OCCUPIED_RE = /^Position \d+ déjà occupée sur FBI par /;

async function pushOnePosition(
  client: FbiClient,
  idRencontre: string,
  position: number,
  referee: { firstName: string; lastName: string; nationalNumber: string | null },
  /** Autres arbitres AlloArbitre du match : jamais retirés de FBI. */
  keep: { nom: string; prenom: string }[]
): Promise<FbiPushPositionResult> {
  const refereeLabel = `${referee.firstName} ${referee.lastName}`;
  const nationalNumber = referee.nationalNumber;
  if (!nationalNumber) {
    return { position, referee: refereeLabel, status: "error", message: "Numéro national manquant côté AlloArbitre" };
  }
  try {
    const result = await assignRefereeToFbiRencontre(client, idRencontre, {
      position,
      numeroNational: nationalNumber,
      dryRun: false,
      referee: { nom: referee.lastName, prenom: referee.firstName },
      // AlloArbitre remplace la désignation FBI existante sur cette position.
      replace: true,
      keep,
    });
    return {
      position,
      referee: refereeLabel,
      status: "ok",
      message:
        (result.remplace ? `Désigné sur FBI (remplace ${result.remplace})` : "Désigné sur FBI") +
        (result.frais.deuxiemeMatchMemeSalle ? " - 0 km : 2e match du jour dans la même salle" : ""),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Déjà sur FBI (même arbitre, reconnu à son nom) : rien à faire.
    if (err instanceof FbiAlreadyDesignatedError) {
      return { position, referee: refereeLabel, status: "skip", message };
    }
    // Position prise par un autre arbitre AlloArbitre du match (inversion A1/A2).
    if (OCCUPIED_RE.test(message)) {
      return { position, referee: refereeLabel, status: "conflict", message };
    }
    return { position, referee: refereeLabel, status: "error", message };
  }
}

/**
 * Pousse toutes les désignations AlloArbitre d'un match vers FBI, une
 * position à la fois : AlloArbitre remplace l'officiel qui occuperait la
 * position sur FBI (sauf s'il est lui-même désigné sur ce match dans
 * AlloArbitre : inversion A1/A2, signalée sans rien retirer).
 */
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
        message: `Non poussé : à corriger dans AlloArbitre. ${d.conflict}`,
      });
      continue;
    }
    const keep = match.designations
      .filter((o) => o !== d)
      .map((o) => ({ nom: o.referee.lastName, prenom: o.referee.firstName }));
    positions.push(await pushOnePosition(client, idRencontre, d.position, d.referee, keep));
  }

  return { matchId: match.id, matchLabel, idRencontre, positions };
}
