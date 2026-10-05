import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AlloArbitre - Désignation des arbitres",
    short_name: "AlloArbitre",
    description: "Gestion des désignations d'arbitres de basket - CD45",
    start_url: "/matchs",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7f9",
    theme_color: "#ea580c",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
