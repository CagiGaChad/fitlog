import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/fitlog" : "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FitLog",
    short_name: "FitLog",
    description: "Registro personal de comidas, macros y entrenamientos",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#151513",
    theme_color: "#151513",
    orientation: "portrait",
    icons: [
      { src: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${basePath}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
  };
}
