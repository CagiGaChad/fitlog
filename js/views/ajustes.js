import { store, todayKey } from "../storage.js";
import { ACTIVITY_LEVELS, GOALS, calcGoals } from "../macros.js";

export function renderAjustes(root, onSaved) {
  const profile = store.getProfile() || {
    weight: "",
    height: "",
    age: "",
    sex: "hombre",
    activity: "moderado",
    goalType: "mantener",
    overrides: null,
  };

  root.innerHTML = `
    <div class="header">
      <h1>Ajustes</h1>
    </div>

    <div class="card">
      <h3>Tus datos</h3>
      <div class="field">
        <label>Peso (kg)</label>
        <input type="number" id="f-weight" inputmode="decimal" value="${esc(profile.weight)}" placeholder="75" />
      </div>
      <div class="field">
        <label>Altura (cm)</label>
        <input type="number" id="f-height" inputmode="decimal" value="${esc(profile.height)}" placeholder="178" />
      </div>
      <div class="field">
        <label>Edad</label>
        <input type="number" id="f-age" inputmode="numeric" value="${esc(profile.age)}" placeholder="28" />
      </div>
      <div class="field">
        <label>Sexo</label>
        <div class="segmented" id="f-sex">
          <button data-val="hombre" class="${profile.sex === "hombre" ? "active" : ""}">Hombre</button>
          <button data-val="mujer" class="${profile.sex === "mujer" ? "active" : ""}">Mujer</button>
        </div>
      </div>
      <div class="field">
        <label>Nivel de actividad</label>
        <select id="f-activity">
          ${ACTIVITY_LEVELS.map(
            (a) => `<option value="${a.id}" ${a.id === profile.activity ? "selected" : ""}>${a.label}</option>`
          ).join("")}
        </select>
      </div>
      <div class="field">
        <label>Objetivo</label>
        <div class="segmented" id="f-goal">
          ${GOALS.map(
            (g) => `<button data-val="${g.id}" class="${g.id === profile.goalType ? "active" : ""}">${g.label}</button>`
          ).join("")}
        </div>
      </div>
      <button class="btn block" id="btn-calc">Calcular objetivos</button>
    </div>

    <div id="goals-preview"></div>

    <div class="card flat">
      <h3>Ajustar manualmente</h3>
      <p class="label" style="margin:6px 0 12px">Si quieres afinar los números calculados, cámbialos aquí. Se guardan como tu objetivo real.</p>
      <div class="field">
        <label>Calorías (kcal)</label>
        <input type="number" id="o-cal" value="${esc(profile.overrides?.calories ?? "")}" placeholder="calculado automáticamente" />
      </div>
      <div class="field">
        <label>Proteína (g)</label>
        <input type="number" id="o-pro" value="${esc(profile.overrides?.protein ?? "")}" placeholder="calculado automáticamente" />
      </div>
      <div class="field">
        <label>Carbohidratos (g)</label>
        <input type="number" id="o-carb" value="${esc(profile.overrides?.carbs ?? "")}" placeholder="calculado automáticamente" />
      </div>
      <div class="field">
        <label>Grasas (g)</label>
        <input type="number" id="o-fat" value="${esc(profile.overrides?.fat ?? "")}" placeholder="calculado automáticamente" />
      </div>
      <button class="btn secondary block" id="btn-save">Guardar</button>
    </div>

    <div class="card flat">
      <h3>Copia de seguridad</h3>
      <p class="label" style="margin:6px 0 12px">Descarga tus datos (comidas, entrenos, peso, perfil) por si cambias de móvil o el navegador borra los datos. Restaura desde un archivo guardado.</p>
      <button class="btn secondary block" id="btn-export" style="margin-bottom:10px">Descargar copia de seguridad</button>
      <input type="file" id="import-file" accept="application/json" style="display:none" />
      <button class="btn ghost" id="btn-import">Restaurar copia de seguridad</button>
    </div>
  `;

  const sexBtns = root.querySelectorAll("#f-sex button");
  sexBtns.forEach((b) =>
    b.addEventListener("click", () => {
      sexBtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
    })
  );
  const goalBtns = root.querySelectorAll("#f-goal button");
  goalBtns.forEach((b) =>
    b.addEventListener("click", () => {
      goalBtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
    })
  );

  function currentForm() {
    return {
      weight: parseFloat(root.querySelector("#f-weight").value) || 0,
      height: parseFloat(root.querySelector("#f-height").value) || 0,
      age: parseInt(root.querySelector("#f-age").value) || 0,
      sex: root.querySelector("#f-sex button.active")?.dataset.val || "hombre",
      activity: root.querySelector("#f-activity").value,
      goalType: root.querySelector("#f-goal button.active")?.dataset.val || "mantener",
    };
  }

  root.querySelector("#btn-calc").addEventListener("click", () => {
    const form = currentForm();
    if (!form.weight || !form.height || !form.age) {
      root.querySelector("#goals-preview").innerHTML =
        `<div class="card danger" style="border-left-color: var(--danger)"><p class="label">Rellena peso, altura y edad para calcular.</p></div>`;
      return;
    }
    const goals = calcGoals(form);
    root.querySelector("#o-cal").value = goals.calories;
    root.querySelector("#o-pro").value = goals.protein;
    root.querySelector("#o-carb").value = goals.carbs;
    root.querySelector("#o-fat").value = goals.fat;

    root.querySelector("#goals-preview").innerHTML = `
      <div class="card amber">
        <h3>Objetivo diario calculado</h3>
        <div class="row" style="margin-top:8px">
          <div class="stack"><span class="label">Calorías</span><span class="value-lg">${goals.calories}</span></div>
          <div class="stack"><span class="label">Proteína</span><span class="value-lg">${goals.protein}g</span></div>
        </div>
        <div class="row" style="margin-top:10px">
          <div class="stack"><span class="label">Carbos</span><span class="value-lg">${goals.carbs}g</span></div>
          <div class="stack"><span class="label">Grasas</span><span class="value-lg">${goals.fat}g</span></div>
        </div>
        <p class="label" style="margin-top:10px">TDEE estimado: ${goals.tdee} kcal/día · TMB: ${goals.bmr} kcal</p>
      </div>
    `;
  });

  root.querySelector("#btn-save").addEventListener("click", () => {
    const form = currentForm();
    const overrides = {
      calories: parseFloat(root.querySelector("#o-cal").value) || null,
      protein: parseFloat(root.querySelector("#o-pro").value) || null,
      carbs: parseFloat(root.querySelector("#o-carb").value) || null,
      fat: parseFloat(root.querySelector("#o-fat").value) || null,
    };
    const hasOverrides = Object.values(overrides).some((v) => v != null);
    store.setProfile({ ...form, overrides: hasOverrides ? overrides : null });
    const btn = root.querySelector("#btn-save");
    if (btn) btn.textContent = "Guardado ✓";
    if (onSaved) onSaved();
    setTimeout(() => {
      const b = root.querySelector("#btn-save");
      if (b) b.textContent = "Guardar";
    }, 1200);
  });

  root.querySelector("#btn-export").addEventListener("click", () => {
    const data = store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitlog-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  const importFile = root.querySelector("#import-file");
  root.querySelector("#btn-import").addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", async () => {
    const file = importFile.files[0];
    importFile.value = "";
    if (!file) return;
    if (!confirm("Esto sobrescribirá tus datos actuales con los del archivo. ¿Continuar?")) return;
    try {
      const data = JSON.parse(await file.text());
      store.importAll(data);
      alert("Datos restaurados. La app se va a recargar.");
      location.reload();
    } catch (e) {
      alert("El archivo no es una copia de seguridad válida.");
    }
  });
}

function esc(v) {
  return v === null || v === undefined ? "" : v;
}
