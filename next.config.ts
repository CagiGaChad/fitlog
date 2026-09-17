import type { NextConfig } from "next";

// Se despliega en https://cagigachad.github.io/fitlog/ (GitHub Pages, repo "fitlog"),
// así que en producción necesita basePath/assetPrefix; en local (dev) va en la raíz.
const isProd = process.env.NODE_ENV === "production";
const repoBasePath = "/fitlog";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? repoBasePath : "",
  assetPrefix: isProd ? repoBasePath : "",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? repoBasePath : "",
  },
};

export default nextConfig;
