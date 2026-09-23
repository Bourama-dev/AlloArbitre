import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchFbiDesignationDetail } from "@/lib/fbi/fetch";
import type { FbiRencontreDetail } from "@/lib/fbi/detail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const presenceStyles: Record<string, string> = {
  "Présent": "text-[var(--success)] bg-[var(--success-bg)]",
  "Absent": "text-[var(--danger)] bg-[var(--danger-bg)]",
};

export default async function FbiRencontrePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  // Résumé passé par la liste /fbi, pour l'en-tête (évite de relancer la recherche).
  searchParams: Promise<{ code?: string; eq1?: string; eq2?: string; date?: string; heure?: string; etat?: string; retour?: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const q = await searchParams;
  const retour = q.retour?.startsWith("/fbi") ? q.retour : "/fbi";

  let detail: FbiRencontreDetail | null = null;
  let error: string | null = null;
  try {
    detail = await fetchFbiDesignationDetail(id);
  } catch (err) {
    error = err instanceof Error ? err.message : "Erreur inconnue";
  }

  // Noms complets depuis la fiche (la liste FBI les tronque avec "...").
  const info = (label: string) => detail?.infos.find((i) => i.label.toLowerCase().startsWith(label))?.value;
  const equipe1 = info("equipe 1") ?? q.eq1;
  const equipe2 = info("equipe 2") ?? q.eq2;

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <Link href={retour} className="text-xs text-[var(--accent)] hover:underline">
          ← Rencontres FBI
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-1">
          {equipe1 && equipe2 ? `${equipe1} - ${equipe2}` : `Rencontre FBI n° ${id}`}
        </h1>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          {[q.code, q.etat].filter(Boolean).join(" · ")}
          {q.code || q.etat ? " · " : ""}Fiche lue en direct sur FBI.
        </p>
      </div>

      {error ? (
        <div className="card p-4 text-sm">
          <p className="font-medium text-[var(--danger)]">Impossible de lire la fiche FBI</p>
          <p className="text-[var(--muted)] mt-1">{error}</p>
        </div>
      ) : (
        detail && (
          <>
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">
                Officiels désignés{" "}
                <span className="font-normal text-[var(--muted)]">({detail.officiels.length})</span>
              </h2>
              {detail.officiels.length === 0 ? (
                <p className="text-sm text-[var(--muted)] py-6 text-center card">
                  Aucun officiel désigné sur FBI pour cette rencontre.
                </p>
              ) : (
                <div className="table-shell overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Fonction</th>
                        <th>N° licence</th>
                        <th>Présence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.officiels.map((o, i) => (
                        <tr key={`${o.licence}-${i}`}>
                          <td className="font-medium whitespace-nowrap">{o.nom || "-"}</td>
                          <td className="whitespace-nowrap">{o.prenom || "-"}</td>
                          <td className="whitespace-nowrap">{o.fonction || "-"}</td>
                          <td className="whitespace-nowrap text-[var(--muted)]">{o.licence || "-"}</td>
                          <td>
                            {o.presence ? (
                              <span className={`badge ${presenceStyles[o.presence] ?? "text-[var(--muted)] bg-[var(--neutral-bg)]"}`}>
                                {o.presence}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {detail.infos.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Rencontre</h2>
                <dl className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {detail.infos.map((i) => (
                    <div key={i.label} className="flex gap-2">
                      <dt className="text-[var(--muted)] shrink-0">{i.label}</dt>
                      <dd className="font-medium">{i.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </>
        )
      )}
    </div>
  );
}
