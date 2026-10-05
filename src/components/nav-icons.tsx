import type { ReactNode, SVGProps } from "react";

export type NavIconName =
  | "matchs"
  | "fbi"
  | "arbitres"
  | "dispos"
  | "plus"
  | "controles"
  | "stats"
  | "export"
  | "reglement"
  | "admin"
  | "compte"
  | "logout";

const PATHS: Record<NavIconName, ReactNode> = {
  // ballon
  matchs: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  // synchronisation
  fbi: (
    <>
      <path d="M20 7H8a4 4 0 0 0-4 4v1" />
      <path d="m16 3 4 4-4 4" />
      <path d="M4 17h12a4 4 0 0 0 4-4v-1" />
      <path d="m8 21-4-4 4-4" />
    </>
  ),
  arbitres: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .6 3.2 2.3 3.5 5.2" />
    </>
  ),
  dispos: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  plus: (
    <>
      <circle cx="5.5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18.5" cy="12" r="1.4" />
    </>
  ),
  controles: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.4 3 7.9 7.5 9.5 4.5-1.6 7.5-5.1 7.5-9.5V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  stats: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </>
  ),
  export: (
    <>
      <path d="M12 3v12M7.5 8 12 3.5 16.5 8" />
      <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
    </>
  ),
  reglement: (
    <>
      <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
      <path d="M14.5 3.5V7.5H18.5M9 12h6M9 16h6" />
    </>
  ),
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </>
  ),
  compte: (
    <>
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 20.5c.8-4 3.7-6 7.5-6s6.7 2 7.5 6" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H6.5A2 2 0 0 0 4.5 6v12a2 2 0 0 0 2 2H10" />
      <path d="M15 8l4 4-4 4M19 12H9" />
    </>
  ),
};

export function NavIcon({ name, ...props }: { name: NavIconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
