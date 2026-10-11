import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAnyProfile } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AlertToast } from "@/components/alert-toast";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FaqList } from "@/components/faq-list";
import {
  ALLOWED_DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
  FAQ_CATEGORIES,
  MAX_DOCUMENT_BYTES,
  TOOLBOX_BUCKET,
  formatSize,
  safeFileName,
  type FaqItem,
  type ToolboxDocument,
} from "@/lib/toolbox";

export const dynamic = "force-dynamic";

const PATH = "/espace/boite-a-outils";
const go = (kind: "ok" | "error", msg: string): never => redirect(`${PATH}?${kind}=${encodeURIComponent(msg)}`);

async function requireAdmin() {
  const profile = await getAnyProfile();
  if (profile?.role !== "ADMIN") redirect(PATH);
}

async function addDocument(formData: FormData) {
  "use server";
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || DOCUMENT_CATEGORIES[0];
  const file = formData.get("file");
  if (!title) go("error", "Donnez un titre au document.");
  if (!(file instanceof File) || file.size === 0) go("error", "Choisissez un fichier.");
  const f = file as File;
  if (!ALLOWED_DOCUMENT_TYPES[f.type]) go("error", "Format non accepté : PDF, image (PNG, JPEG), Word ou Excel.");
  if (f.size > MAX_DOCUMENT_BYTES) go("error", "Fichier trop lourd (10 Mo maximum).");

  const storagePath = `${crypto.randomUUID()}-${safeFileName(f.name)}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(TOOLBOX_BUCKET)
    .upload(storagePath, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: false });
  if (uploadError) go("error", "Envoi impossible : " + uploadError.message);

  const { data: last } = await supabaseAdmin.from("ToolboxDocument").select("position").order("position", { ascending: false }).limit(1);
  const { error } = await supabaseAdmin.from("ToolboxDocument").insert({
    title,
    description,
    category,
    storagePath,
    fileName: f.name,
    mimeType: f.type,
    sizeBytes: f.size,
    position: ((last?.[0]?.position as number | undefined) ?? 0) + 10,
  });
  if (error) {
    await supabaseAdmin.storage.from(TOOLBOX_BUCKET).remove([storagePath]);
    go("error", "Enregistrement impossible.");
  }
  revalidatePath(PATH);
  go("ok", "Document ajouté.");
}

async function toggleDocument(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const { error } = await supabaseAdmin.from("ToolboxDocument").update({ active, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
  go("ok", active ? "Document publié." : "Document masqué aux arbitres.");
}

async function deleteDocument(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { data: doc } = await supabaseAdmin.from("ToolboxDocument").select("storagePath").eq("id", id).maybeSingle();
  const { error } = await supabaseAdmin.from("ToolboxDocument").delete().eq("id", id);
  if (error) throw error;
  if (doc?.storagePath) await supabaseAdmin.storage.from(TOOLBOX_BUCKET).remove([doc.storagePath as string]);
  revalidatePath(PATH);
  go("ok", "Document supprimé.");
}

async function saveFaq(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || FAQ_CATEGORIES[0];
  const active = formData.get("active") === "on";
  if (!question || !answer) go("error", "La question et la réponse sont obligatoires.");
  if (id) {
    const { error } = await supabaseAdmin
      .from("FaqItem")
      .update({ question, answer, category, active, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { data: last } = await supabaseAdmin.from("FaqItem").select("position").order("position", { ascending: false }).limit(1);
    const { error } = await supabaseAdmin
      .from("FaqItem")
      .insert({ question, answer, category, active, position: ((last?.[0]?.position as number | undefined) ?? 0) + 10 });
    if (error) throw error;
  }
  revalidatePath(PATH);
  go("ok", "Question enregistrée.");
}

async function deleteFaq(formData: FormData) {
  "use server";
  await requireAdmin();
  const { error } = await supabaseAdmin.from("FaqItem").delete().eq("id", String(formData.get("id") ?? ""));
  if (error) throw error;
  revalidatePath(PATH);
  go("ok", "Question supprimée.");
}

function FaqFields({ item }: { item?: FaqItem }) {
  return (
    <div className="space-y-2">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input name="question" defaultValue={item?.question} placeholder="Question" className="input w-full" required />
      <textarea name="answer" defaultValue={item?.answer} placeholder="Réponse" rows={4} className="input w-full" required />
      <div className="flex flex-wrap items-center gap-3">
        <input name="category" list="faq-categories" defaultValue={item?.category ?? ""} placeholder="Catégorie" className="input" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={item?.active ?? true} /> Publiée (visible des arbitres)
        </label>
      </div>
    </div>
  );
}

export default async function ToolboxPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const profile = await getAnyProfile();
  if (!profile) redirect("/espace/connexion");
  const isAdmin = profile.role === "ADMIN";
  const isReferee = profile.role === "ARBITRE";
  const { ok, error } = await searchParams;

  const [{ data: docRows, error: docError }, { data: faqRows, error: faqError }] = await Promise.all([
    supabaseAdmin.from("ToolboxDocument").select("*").order("position").order("createdAt"),
    supabaseAdmin.from("FaqItem").select("*").order("position").order("createdAt"),
  ]);
  if (docError) throw docError;
  if (faqError) throw faqError;
  const docs = ((docRows ?? []) as ToolboxDocument[]).filter((d) => isAdmin || d.active);
  const faq = ((faqRows ?? []) as FaqItem[]).filter((f) => isAdmin || f.active);
  const docCategories = [...new Set(docs.map((d) => d.category))];

  const editById = isAdmin
    ? Object.fromEntries(
        faq.map((item) => [
          item.id,
          <div key={item.id} className="mt-3 border-t border-[var(--border)] pt-3 space-y-2">
            <form action={saveFaq} className="space-y-2">
              <FaqFields item={item} />
              <SubmitButton className="btn btn-primary text-sm" pendingLabel="Enregistrement…">
                Enregistrer
              </SubmitButton>
            </form>
            <form action={deleteFaq}>
              <input type="hidden" name="id" value={item.id} />
              <ConfirmSubmitButton confirmMessage="Supprimer cette question ?" className="btn-danger text-sm">
                Supprimer
              </ConfirmSubmitButton>
            </form>
          </div>,
        ])
      )
    : undefined;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {ok && <AlertToast message={decodeURIComponent(ok)} variant="success" />}
      {error && <AlertToast message={decodeURIComponent(error)} variant="error" />}

      <div>
        {isReferee && (
          <Link href="/espace" className="chip-btn">
            ‹ Mon espace
          </Link>
        )}
        <h1 className="text-xl font-bold tracking-tight mt-3">Boîte à outils</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Les documents officiels à avoir sur soi et les réponses aux questions qu&apos;on se pose avant, pendant et après un match.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Documents officiels</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-[var(--muted)] card p-4">Aucun document pour l&apos;instant.</p>
        ) : (
          docCategories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{cat}</h3>
              <ul className="card divide-y divide-[var(--border)]">
                {docs
                  .filter((d) => d.category === cat)
                  .map((d) => (
                    <li key={d.id} className="p-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {d.title}
                          {!d.active && <span className="badge text-[var(--muted)] bg-[var(--neutral-bg)] ml-2">Masqué</span>}
                        </p>
                        {d.description && <p className="text-xs text-[var(--muted)]">{d.description}</p>}
                        <p className="text-[11px] text-[var(--muted)]">
                          {ALLOWED_DOCUMENT_TYPES[d.mimeType] ?? "Fichier"} · {formatSize(d.sizeBytes)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={`${PATH}/fichier/${d.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm">
                          Ouvrir
                        </a>
                        {isAdmin && (
                          <>
                            <form action={toggleDocument}>
                              <input type="hidden" name="id" value={d.id} />
                              <input type="hidden" name="active" value={d.active ? "0" : "1"} />
                              <button type="submit" className="btn btn-secondary text-xs">
                                {d.active ? "Masquer" : "Publier"}
                              </button>
                            </form>
                            <form action={deleteDocument}>
                              <input type="hidden" name="id" value={d.id} />
                              <ConfirmSubmitButton confirmMessage={`Supprimer « ${d.title} » ?`} className="btn-danger text-xs">
                                Supprimer
                              </ConfirmSubmitButton>
                            </form>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}

        {isAdmin && (
          <details className="card p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--accent)]">+ Ajouter un document</summary>
            <form action={addDocument} className="mt-3 space-y-2">
              <input name="title" placeholder="Titre (ex. Feuille de réclamation)" className="input w-full" required />
              <input name="description" placeholder="Description (facultatif)" className="input w-full" />
              <input name="category" list="doc-categories" placeholder="Catégorie" defaultValue={DOCUMENT_CATEGORIES[0]} className="input" />
              <input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" className="input w-full" required />
              <p className="text-xs text-[var(--muted)]">PDF, image, Word ou Excel · 10 Mo maximum.</p>
              <SubmitButton className="btn btn-primary" pendingLabel="Envoi…">
                Ajouter le document
              </SubmitButton>
            </form>
            <datalist id="doc-categories">
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </details>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Questions fréquentes</h2>
        <FaqList items={faq} editById={editById} />
        {isAdmin && (
          <details className="card p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--accent)]">+ Ajouter une question</summary>
            <form action={saveFaq} className="mt-3 space-y-2">
              <FaqFields />
              <SubmitButton className="btn btn-primary" pendingLabel="Ajout…">
                Ajouter la question
              </SubmitButton>
            </form>
            <datalist id="faq-categories">
              {FAQ_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </details>
        )}
      </section>

      <section className="card p-4 space-y-1">
        <p className="text-sm font-semibold">🤖 Assistant règlement : bientôt</p>
        <p className="text-xs text-[var(--muted)]">
          Prochainement, vous pourrez poser votre question en langage courant et recevoir une réponse appuyée sur les
          règlements officiels. En attendant, cherchez dans la FAQ ci-dessus ou contactez votre répartiteur.
        </p>
      </section>

      {isAdmin && (
        <p className="text-xs text-[var(--muted)]">
          Les questions « Brouillon » et les documents « Masqué » ne sont visibles que des administrateurs.
        </p>
      )}
    </div>
  );
}
