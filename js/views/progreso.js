import { store, dateKeyForOffset, todayKey } from "../storage.js";
import { activeGoals, sumLog } from "../macros.js";
import { hasProfile, uid } from "../state.js";

let section = "peso";

export function renderProgreso(root) {
  root.innerHTML = `
    <div class="header"><h1>Progreso</h1></div>
    <div class="segmented" id="p-tabs" style="margin-bottom:14px">
      <button data-val="peso" class="${section === "peso" ? "active" : ""}">Peso</button>
      <button data-val="macros" class="${section === "macros" ? "active" : ""}">Macros</button>
      <button data-val="entrenos" class="${section === "entrenos" ? "active" : ""}">Entrenos</button>
    </div>
    <div id="p-body"></div>
  `;

  root.querySelectorAll("#p-tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      section = b.dataset.val;
      renderProgreso(root);
    })
  );

  const body = root.querySelector("#p-body");
  if (section === "peso") renderPeso(body);
  else if (section === "macros") renderMacrosHistory(body);
  else renderEntrenosHistory(body);
}

function renderPeso(container) {
  const log = store.getWeightLog();

  container.innerHTML = `
    <div class="card">
      <h3>Registrar peso</h3>
      <div class="field"><label>Fecha</label><input type="date" id="w-date" value="${todayKey()}" /></div>
      <div class="field"><label>Peso (kg)</label><input type="number" id="w-value" inputmode="decimal" placeholder="75.4" /></div>
      <button class="btn block" id="w-add">Añadir</button>
    </div>
    ${
      log.length > 1
        ? `<div class="card flat"><h3>Evolución</h3><div id="w-chart" style="margin-top:8px"></div></div>`
        : ""
    }
    <div class="card flat">
      <h3>Historial</h3>
      <div id="w-list">${log.length === 0 ? '<div class="empty">Todavía no has registrado tu peso.</div>' : ""}</div>
    </div>
  `;

  if (log.length > 1) {
    drawLineChart(
      container.querySelector("#w-chart"),
      log.map((e) => e.weight)
    );
  }
  drawWeightList();

  container.querySelector("#w-add").addEventListener("click", () => {
    const date = container.querySelector("#w-date").value;
    const weight = parseFloat(container.querySelector("#w-value").value);
    if (!date || !weight) return;
    store.addWeightEntry({ id: uid(), date, weight });
    renderPeso(container);
  });

  function drawWeightList() {
    const listEl = container.querySelector("#w-list");
    if (log.length === 0) return;
    const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date));
    listEl.innerHTML = sorted
      .map(
        (e) => `
      <div class="food-item" data-id="${e.id}">
        <span class="name">${formatDateLabel(e.date)}</span>
        <span class="kcal">${e.weight} kg</span>
      </div>`
      )
      .join("");
    listEl.querySelectorAll(".food-item").forEach((el) =>
      el.addEventListener("click", () => {
        if (!confirm("¿Eliminar este registro de peso?")) return;
        store.deleteWeightEntry(el.dataset.id);
        renderPeso(container);
      })
    );
  }
}

function renderMacrosHistory(container) {
  if (!hasProfile()) {
    container.innerHTML = `
      <div class="card amber">
        <h3>Configura tu perfil</h3>
        <p class="label" style="margin:8px 0">Necesitas tus objetivos calculados en Ajustes para ver el historial de macros.</p>
      </div>`;
    return;
  }

  const goals = activeGoals(store.getProfile());
  const days = 14;
  const data = [];
  for (let offset = -(days - 1); offset <= 0; offset++) {
    const dk = dateKeyForOffset(offset);
    data.push({ date: dk, calories: sumLog(store.getLog(dk)).calories });
  }

  container.innerHTML = `
    <div class="card">
      <h3>Calorías · últimos ${days} días</h3>
      <div id="m-chart" style="margin-top:10px"></div>
      <p class="label" style="margin-top:8px">Objetivo: ${goals.calories} kcal/día · en rojo los días por encima</p>
    </div>
  `;
  drawBarChart(container.querySelector("#m-chart"), data, goals.calories);
}

function renderEntrenosHistory(container) {
  const days = 28;
  const cells = [];
  const details = [];

  for (let offset = -(days - 1); offset <= 0; offset++) {
    const dk = dateKeyForOffset(offset);
    const exChecks = store.getExerciseChecks(dk);
    const doneBool = store.isWorkoutDone(dk);
    let status = "none";

    if (exChecks && exChecks.length > 0) {
      const doneCount = exChecks.filter((e) => e.done).length;
      status = doneCount === 0 ? "none" : doneCount === exChecks.length ? "done" : "partial";
      if (doneCount > 0) details.push({ date: dk, exercises: exChecks });
    } else if (doneBool) {
      status = "done";
      details.push({ date: dk, exercises: null });
    }
    cells.push({ date: dk, status });
  }

  container.innerHTML = `
    <div class="card">
      <h3>Últimos ${days} días</h3>
      <div class="streak-grid">${cells
        .map((c) => `<span class="streak-cell ${c.status}" title="${c.date}"></span>`)
        .join("")}</div>
      <div class="row" style="margin-top:10px;gap:14px;justify-content:flex-start">
        <span class="label"><span class="streak-dot done"></span>Completo</span>
        <span class="label"><span class="streak-dot partial"></span>Parcial</span>
        <span class="label"><span class="streak-dot none"></span>Nada</span>
      </div>
    </div>
    <div class="card flat">
      <h3>Detalle reciente</h3>
      ${
        details.length === 0
          ? '<div class="empty">Todavía no hay entrenos registrados.</div>'
          : details
              .slice()
              .reverse()
              .slice(0, 10)
              .map(
                (d) => `
          <div class="stack" style="margin-bottom:12px">
            <span class="label mono">${formatDateLabel(d.date)}</span>
            ${
              d.exercises
                ? d.exercises
                    .map((e) => `<span style="font-size:14px">${e.done ? "✓" : "✗"} ${escHtml(e.name)}</span>`)
                    .join("")
                : `<span style="font-size:14px">✓ Entreno hecho</span>`
            }
          </div>`
              )
              .join("")
      }
    </div>
  `;
}

function drawLineChart(container, values) {
  const w = 300,
    h = 120,
    pad = 10;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const coords = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const path = coords.map((c, i) => (i === 0 ? "M" : "L") + c[0].toFixed(1) + "," + c[1].toFixed(1)).join(" ");
  const dots = coords
    .map((c) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2.5" style="fill:var(--accent)" />`)
    .join("");
  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:120px">
      <path d="${path}" fill="none" style="stroke:var(--accent)" stroke-width="2" />
      ${dots}
    </svg>
    <div class="row"><span class="label">${min.toFixed(1)} kg</span><span class="label">${max.toFixed(1)} kg</span></div>
  `;
}

function drawBarChart(container, data, goal) {
  const w = 300,
    h = 150,
    padTop = 6,
    padBottom = 16,
    gap = 3;
  const chartH = h - padTop - padBottom;
  const barW = (w - gap * (data.length - 1)) / data.length;
  const maxVal = Math.max(goal, ...data.map((d) => d.calories), 1) * 1.15;
  const goalY = padTop + chartH - (goal / maxVal) * chartH;

  const bars = data
    .map((d, i) => {
      const x = i * (barW + gap);
      const barH = (d.calories / maxVal) * chartH;
      const y = padTop + chartH - barH;
      const over = d.calories > goal;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(barW - 1, 1).toFixed(
        1
      )}" height="${barH.toFixed(1)}" rx="2" style="fill:${over ? "var(--danger)" : "var(--accent)"}" />`;
    })
    .join("");

  const labels = data
    .map((d, i) => {
      const x = i * (barW + gap) + barW / 2;
      const dow = new Date(d.date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "narrow" });
      return `<text x="${x.toFixed(1)}" y="${h - 4}" font-size="8" text-anchor="middle" style="fill:var(--text-dim)">${dow}</text>`;
    })
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:150px">
      <line x1="0" y1="${goalY.toFixed(1)}" x2="${w}" y2="${goalY.toFixed(1)}" style="stroke:var(--amber)" stroke-width="1" stroke-dasharray="3,3" />
      ${bars}${labels}
    </svg>
  `;
}

function formatDateLabel(dateKey) {
  const d = new Date(dateKey + "T00:00:00");
  return capitalize(d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }));
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function escHtml(v) {
  return (v || "").replace(/</g, "&lt;");
}
