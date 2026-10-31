import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kiroshi Vault // Cyberpunk TCG",
    short_name: "Kiroshi Vault",
    description:
      "Night City collection tracker, deck builder, match log, and opening-hand tester for the Cyberpunk Trading Card Game.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#04060a",
    theme_color: "#04060a",
    categories: ["games", "utilities", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    display_override: ["standalone", "fullscreen"],
  };
}
