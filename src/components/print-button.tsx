"use client";

export function PrintButton({ label = "Imprimer / PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary">
      {label}
    </button>
  );
}
