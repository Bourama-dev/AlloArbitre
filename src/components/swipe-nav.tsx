"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

/**
 * Balayage horizontal pour passer à la page précédente / suivante (ex. semaine
 * d'avant / d'après), comme dans un fil d'actualité. Ignoré quand le geste
 * démarre sur un champ de saisie ou dans une zone qui défile horizontalement.
 */
export function SwipeNav({
  prevHref,
  nextHref,
  children,
}: {
  prevHref: string;
  nextHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number; t: number; ignore: boolean } | null>(null);

  return (
    <div
      onTouchStart={(e) => {
        const t = e.touches[0];
        const target = e.target as HTMLElement;
        start.current = {
          x: t.clientX,
          y: t.clientY,
          t: Date.now(),
          ignore: !!target.closest("input, select, textarea, button, [data-no-swipe], .overflow-x-auto"),
        };
      }}
      onTouchEnd={(e) => {
        const s = start.current;
        start.current = null;
        if (!s || s.ignore) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        if (Math.abs(dx) < 90 || Math.abs(dy) > 45 || Date.now() - s.t > 600) return;
        try {
          navigator.vibrate?.(6);
        } catch {
          /* sans effet */
        }
        router.push(dx < 0 ? nextHref : prevHref);
      }}
    >
      {children}
    </div>
  );
}
