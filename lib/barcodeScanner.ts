// Escaneo de códigos de barras (EAN-13/UPC de productos envasados) con la cámara.
// Usa @zxing/browser, que funciona también en Safari/iOS (no soporta el
// BarcodeDetector nativo).
"use client";

import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

let reader: BrowserMultiFormatReader | null = null;

function ensureReader(): BrowserMultiFormatReader {
  if (!reader) reader = new BrowserMultiFormatReader();
  return reader;
}

// Abre un overlay a pantalla completa con la cámara y devuelve una Promise que
// resuelve con el código de barras leído, o con null si el usuario cancela.
export function scanBarcode(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Este navegador no permite acceder a la cámara.");
      resolve(null);
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "scan-overlay";
    overlay.innerHTML = `
      <video class="scan-video" playsinline autoplay muted></video>
      <div class="scan-frame"></div>
      <p class="scan-hint">Apunta al código de barras del producto</p>
      <button class="btn secondary scan-cancel">Cancelar</button>
    `;
    document.body.appendChild(overlay);

    const video = overlay.querySelector(".scan-video") as HTMLVideoElement;
    const cancelBtn = overlay.querySelector(".scan-cancel") as HTMLButtonElement;
    let done = false;
    let controls: IScannerControls | null = null;

    function finish(result: string | null) {
      if (done) return;
      done = true;
      if (controls) controls.stop();
      overlay.remove();
      resolve(result);
    }

    cancelBtn.addEventListener("click", () => finish(null));

    const rdr = ensureReader();

    rdr
      .decodeFromConstraints(
        { audio: false, video: { facingMode: "environment" } },
        video,
        (result) => {
          if (result) finish(result.getText());
        }
      )
      .then((c) => {
        controls = c;
      })
      .catch((err) => {
        console.error("Error abriendo la cámara", err);
        overlay.remove();
        alert("No se pudo acceder a la cámara. Revisa los permisos.");
        resolve(null);
      });
  });
}
