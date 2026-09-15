// Escaneo de códigos de barras (EAN-13/UPC de productos envasados) con la cámara.
// Usa ZXing (vendorizado en js/vendor/zxing.min.js, expone window.ZXing) para
// que funcione también en Safari/iOS, que no soporta la BarcodeDetector nativa.

let reader = null;

function ensureReader() {
  if (!window.ZXing) throw new Error("Librería de escaneo no disponible");
  if (!reader) reader = new window.ZXing.BrowserMultiFormatReader();
  return reader;
}

// Abre un overlay a pantalla completa con la cámara y devuelve una Promise que
// resuelve con el código de barras leído, o con null si el usuario cancela.
export function scanBarcode() {
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

    const video = overlay.querySelector(".scan-video");
    const cancelBtn = overlay.querySelector(".scan-cancel");
    let done = false;
    let controls = null;

    function finish(result) {
      if (done) return;
      done = true;
      if (controls) controls.stop();
      overlay.remove();
      resolve(result);
    }

    cancelBtn.addEventListener("click", () => finish(null));

    let rdr;
    try {
      rdr = ensureReader();
    } catch (e) {
      overlay.remove();
      alert(e.message);
      resolve(null);
      return;
    }

    rdr
      .decodeFromConstraints(
        { audio: false, video: { facingMode: "environment" } },
        video,
        (result, err) => {
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
