import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { parseMatchesWorkbook, importMatches } from "@/lib/import-matches";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

async function submit(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/matchs");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/import?error=${encodeURIComponent("Aucun fichier sélectionné.")}`);
  }

  let params: URLSearchParams;
  try {
    const buffer = await file.arrayBuffer();
    const rows = await parseMatchesWorkbook(buffer);
    const summary = await importMatches(rows);
    params = new URLSearchParams({
      created: String(summary.created),
      updated: String(summary.updated),
      levels: summary.competitionLevelsCreated.join(", "),
      errors: summary.errors.join(" | "),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    redirect(`/admin/import?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/matchs");
  redirect(`/admin/import?${params.toString()}`);
}

export default async function ImportMatchsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    levels?: string;
    errors?: string;
    error?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/matchs");
  }

  const params = await searchParams;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Import des matchs (Excel)</h1>
        <p className="text-sm text-[var(--muted)]">
          Fichier .xlsx avec les colonnes : <strong>Équipe domicile</strong> (ou{" "}
          <strong>Equipe 1</strong>), <strong>Équipe extérieur</strong> (ou{" "}
          <strong>Equipe 2</strong>), <strong>Date</strong> (AAAA-MM-JJ ou JJ/MM/AAAA),{" "}
          <strong>Heure</strong> (HH:MM), <strong>Lieu</strong> (ou{" "}
          <strong>Salle</strong>), <strong>Niveau</strong> (ou{" "}
          <strong>Code</strong>) — compatible avec l&apos;export &laquo;&nbsp;Recherche
          désignation&nbsp;&raquo; de FFBB Compet. Les niveaux de compétition inconnus
          sont créés automatiquement. Un match déjà présent (même date, mêmes équipes,
          même niveau) est complété/mis à jour plutôt que dupliqué — l&apos;import peut
          être rejoué sans risque.
        </p>
      </div>

      {params.error && (
        <div className="rounded-lg bg-[var(--danger-bg)] text-[var(--danger)] text-sm px-3 py-2">
          {params.error}
        </div>
      )}

      {(params.created !== undefined || params.updated !== undefined) && !params.error && (
        <div className="rounded-lg bg-[var(--success-bg)] text-[var(--success)] text-sm px-3 py-2 space-y-1">
          <p>
            {params.created} match(s) créé(s), {params.updated} match(s) mis à jour.
          </p>
          {params.levels && (
            <p>Niveaux de compétition créés automatiquement : {params.levels}</p>
          )}
          {params.errors && (
            <p className="text-[var(--danger)]">Erreurs : {params.errors}</p>
          )}
        </div>
      )}

      <form action={submit} className="space-y-3 card p-4">
        <input type="file" name="file" accept=".xlsx" required className="block w-full text-sm" />
        <SubmitButton pendingLabel="Import en cours…">Importer</SubmitButton>
      </form>
    </div>
  );
}
