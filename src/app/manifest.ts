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
    scope: "/",
    id: "/",
    categories: ["games", "utilities", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    display_override: ["standalone", "fullscreen"],
  };
}
