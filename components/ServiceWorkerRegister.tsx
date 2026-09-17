"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(`${basePath}/sw.js`).catch((err) => console.error("SW error", err));
    });
  }, []);

  return null;
}
