import { renderToday } from "./views/today.js";
import { renderComidas } from "./views/comidas.js";
import { renderEntrenos } from "./views/entrenos.js";
import { renderProgreso } from "./views/progreso.js";
import { renderAjustes } from "./views/ajustes.js";

const app = document.getElementById("app");
const tabButtons = document.querySelectorAll(".tab");

const VIEWS = {
  today: () => renderToday(app),
  comidas: () => renderComidas(app),
  entrenos: () => renderEntrenos(app),
  progreso: () => renderProgreso(app),
  ajustes: () => renderAjustes(app, () => goTo("today")),
};

function goTo(tab) {
  tabButtons.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  VIEWS[tab]();
  localStorage.setItem("fitlog_last_tab", tab);
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => goTo(btn.dataset.tab));
});

document.addEventListener("fitlog:goto", (e) => goTo(e.detail));

const startTab = localStorage.getItem("fitlog_last_tab") || "today";
goTo(startTab);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => console.error("SW error", err));
  });
}
