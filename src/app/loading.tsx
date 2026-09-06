export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-[var(--muted)] gap-3 text-sm">
      <span className="spinner" aria-hidden />
      Chargement…
    </div>
  );
}
