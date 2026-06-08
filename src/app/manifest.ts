import type { MetadataRoute } from "next";

/** PWA manifest. Icons live in /public/images (copied from the static site). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Jazy's House — African Fashion & Good Food",
    short_name: "Jazy's House",
    description:
      "African handmade fashion, superfoods & authentic African catering.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en",
    categories: ["shopping", "food", "lifestyle"],
    background_color: "#faf6f0",
    theme_color: "#c0563d",
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/images/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
