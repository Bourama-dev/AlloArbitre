import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchFbiDesignationDetail } from "@/lib/fbi/fetch";
import type { FbiDetailSection } from "@/lib/fbi/detail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  let sections: FbiDetailSection[] = [];
  let error: string | null = null;
  try {
    sections = await fetchFbiDesignationDetail(id);
  } catch (err) {
    error = err instanceof Error ? err.message : "Erreur inconnue";
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <Link href={retour} className="text-xs text-[var(--accent)] hover:underline">
          ← Rencontres FBI
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-1">
          {q.eq1 && q.eq2 ? `${q.eq1} - ${q.eq2}` : `Rencontre FBI n° ${id}`}
        </h1>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          {[q.code, q.date, q.heure && q.heure !== "00:00" ? q.heure : null, q.etat].filter(Boolean).join(" · ")}
          {q.code ? " · " : ""}Fiche lue en direct sur FBI.
        </p>
      </div>

      {error ? (
        <div className="card p-4 text-sm">
          <p className="font-medium text-[var(--danger)]">Impossible de lire la fiche FBI</p>
          <p className="text-[var(--muted)] mt-1">{error}</p>
        </div>
      ) : sections.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-10 text-center card">FBI n&apos;a renvoyé aucun détail pour cette rencontre.</p>
      ) : (
        sections.map((s, i) => (
          <section key={i} className="space-y-2">
            {s.title && <h2 className="text-sm font-semibold">{s.title}</h2>}
            <div className="table-shell overflow-x-auto">
              <table>
                <tbody>
                  {s.rows.map((cells, j) => (
                    <tr key={j}>
                      {cells.map((c, k) => (
                        <td key={k} className={k === 0 && cells.length > 1 ? "text-[var(--muted)] whitespace-nowrap" : ""}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
