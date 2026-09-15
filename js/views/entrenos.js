import { store } from "../storage.js";
import { ensureWeekPlan } from "../state.js";

export function renderEntrenos(root) {
  const plan = ensureWeekPlan();

  root.innerHTML = `
    <div class="header">
      <h1>Entrenos</h1>
      <span class="date">Plantilla semanal</span>
    </div>
    <div class="card flat">
      <p class="label" style="margin-bottom:4px">Define lo que entrenas cada día. Se repite cada semana — edítalo cuando cambies de rutina.</p>
    </div>
    <div class="card" id="week-card"></div>
  `;

  const weekCard = root.querySelector("#week-card");

  function draw() {
    weekCard.innerHTML = plan
      .map(
        (d, i) => `
      <div class="day-row">
        <span class="day-name">${d.day.slice(0, 3)}</span>
        <div class="stack" style="flex:1">
          <input type="text" class="d-name" data-i="${i}" placeholder="Descanso" value="${escAttr(d.name)}" style="margin-bottom:6px" />
          <textarea class="d-notes" data-i="${i}" placeholder="Notas (ej. piernas + core, 45 min)" style="margin-bottom:6px">${escHtml(d.notes)}</textarea>
          <label class="label" style="display:block;margin-bottom:4px">Ejercicios (opcional, uno por línea)</label>
          <textarea class="d-exercises" data-i="${i}" placeholder="Sentadilla&#10;Zancadas&#10;Prensa">${escHtml((d.exercises || []).join("\n"))}</textarea>
        </div>
      </div>`
      )
      .join("");

    weekCard.querySelectorAll(".d-name").forEach((el) =>
      el.addEventListener("input", (e) => {
        plan[e.target.dataset.i].name = e.target.value;
        store.setWeekPlan(plan);
      })
    );
    weekCard.querySelectorAll(".d-notes").forEach((el) =>
      el.addEventListener("input", (e) => {
        plan[e.target.dataset.i].notes = e.target.value;
        store.setWeekPlan(plan);
      })
    );
    weekCard.querySelectorAll(".d-exercises").forEach((el) =>
      el.addEventListener("input", (e) => {
        plan[e.target.dataset.i].exercises = e.target.value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        store.setWeekPlan(plan);
      })
    );
  }

  draw();
}

function escAttr(v) {
  return (v || "").replace(/"/g, "&quot;");
}
function escHtml(v) {
  return (v || "").replace(/</g, "&lt;");
}
