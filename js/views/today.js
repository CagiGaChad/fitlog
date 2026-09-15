import { store, todayKey, isoDayIndex } from "../storage.js";
import { activeGoals, sumLog } from "../macros.js";
import { ensureWeekPlan, hasProfile } from "../state.js";

export function renderToday(root) {
  if (!hasProfile()) {
    root.innerHTML = `
      <div class="header"><h1>Hoy</h1></div>
      <div class="card amber">
        <h3>Configura tu perfil</h3>
        <p class="label" style="margin:8px 0 14px">Para calcular tus calorías y macros diarios, primero necesito tu peso, altura y objetivo.</p>
        <button class="btn block" id="go-settings">Ir a ajustes</button>
      </div>
    `;
    root.querySelector("#go-settings").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("fitlog:goto", { detail: "ajustes" }));
    });
    return;
  }

  const dateKey = todayKey();
  const profile = store.getProfile();
  const goals = activeGoals(profile);

  const totals = sumLog(store.getLog(dateKey));
  const plan = ensureWeekPlan();
  const todayPlan = plan[isoDayIndex()];
  const exerciseNames = todayPlan.exercises || [];

  let exerciseChecks = null;
  if (exerciseNames.length > 0) {
    const prev = store.getExerciseChecks(dateKey) || [];
    const prevByName = new Map(prev.map((e) => [e.name, e.done]));
    exerciseChecks = exerciseNames.map((name) => ({ name, done: prevByName.get(name) || false }));
    store.setExerciseChecks(dateKey, exerciseChecks);
  }
  const done =
    exerciseNames.length > 0 ? exerciseChecks.every((e) => e.done) : store.isWorkoutDone(dateKey);

  const dateLabel = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  root.innerHTML = `
    <div class="header">
      <h1>Hoy</h1>
      <span class="date">${capitalize(dateLabel)}</span>
    </div>

    <div class="card">
      <h3>Macros de hoy</h3>
      ${macroBar("Calorías", totals.calories, goals.calories, "kcal")}
      ${macroBar("Proteína", totals.protein, goals.protein, "g")}
      ${macroBar("Carbohidratos", totals.carbs, goals.carbs, "g")}
      ${macroBar("Grasas", totals.fat, goals.fat, "g")}
    </div>

    <div class="card amber">
      <div class="row">
        <div class="stack">
          <h3 style="color:var(--text)">${todayPlan.name || "Descanso"}</h3>
          ${todayPlan.notes ? `<span class="label">${escHtml(todayPlan.notes)}</span>` : ""}
        </div>
        ${
          exerciseNames.length === 0 && todayPlan.name
            ? `<button class="check ${done ? "done" : ""}" id="toggle-done">✓</button>`
            : ""
        }
      </div>
      ${
        exerciseNames.length > 0
          ? `<div class="exercise-list">
              ${exerciseChecks
                .map(
                  (e, i) => `
                <div class="exercise-row">
                  <span>${escHtml(e.name)}</span>
                  <button class="check ${e.done ? "done" : ""}" data-i="${i}">✓</button>
                </div>`
                )
                .join("")}
            </div>`
          : ""
      }
    </div>
  `;

  const toggle = root.querySelector("#toggle-done");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const newDone = !store.isWorkoutDone(dateKey);
      store.setWorkoutDone(dateKey, newDone);
      renderToday(root);
    });
  }

  root.querySelectorAll(".exercise-row .check").forEach((btn) => {
    btn.addEventListener("click", () => {
      const checks = store.getExerciseChecks(dateKey);
      checks[+btn.dataset.i].done = !checks[+btn.dataset.i].done;
      store.setExerciseChecks(dateKey, checks);
      renderToday(root);
    });
  });
}

function macroBar(label, current, goal, unit) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const over = goal > 0 && current > goal;
  return `
    <div class="macro-row">
      <div class="row">
        <span>${label}</span>
        <span class="mono">${Math.round(current)} / ${Math.round(goal)} ${unit}</span>
      </div>
      <div class="bar-track"><div class="bar-fill ${over ? "over" : ""}" style="width:${pct}%"></div></div>
    </div>
  `;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function escHtml(v) {
  return (v || "").replace(/</g, "&lt;");
}
