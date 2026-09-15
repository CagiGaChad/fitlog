import { store, todayKey, dateKeyForOffset } from "../storage.js";
import { searchOpenFoodFacts, getProductByBarcode } from "../foodApi.js";
import { scanBarcode } from "../barcodeScanner.js";
import { uid } from "../state.js";

const MEALS = ["Desayuno", "Comida", "Merienda", "Cena", "Otro"];
let currentDate = todayKey();
let searchTimer = null;

export function renderComidas(root) {
  root.innerHTML = `
    <div class="header">
      <h1>Comidas</h1>
      <input type="date" id="date-pick" value="${currentDate}" style="width:auto;background:none;border:none;color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:13px" />
    </div>

    <div class="card">
      <div class="row" style="gap:8px;margin-bottom:8px">
        <div class="field" style="margin-bottom:0;flex:1">
          <input type="text" id="search-input" placeholder="Buscar alimento (ej. pechuga de pollo)" />
        </div>
        <button class="icon-btn" id="btn-scan" title="Escanear código de barras">📷</button>
      </div>
      <div id="search-results"></div>
      <button class="btn ghost" id="btn-custom">+ Crear alimento propio</button>
    </div>

    <div id="log-list"></div>
  `;

  root.querySelector("#date-pick").addEventListener("change", (e) => {
    currentDate = e.target.value;
    drawLog();
  });

  const input = root.querySelector("#search-input");
  const resultsBox = root.querySelector("#search-results");

  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      renderQuickLists();
      return;
    }
    resultsBox.innerHTML = `<p class="label">Buscando…</p>`;
    searchTimer = setTimeout(async () => {
      const custom = store.getCustomFoods().filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
      const remote = await searchOpenFoodFacts(q);
      const results = [...custom, ...(remote || [])];

      if (remote === null && custom.length === 0) {
        resultsBox.innerHTML = `<p class="label">No hay conexión para buscar en la base externa. Prueba con un alimento propio.</p>`;
        return;
      }
      if (results.length === 0) {
        resultsBox.innerHTML = `<p class="label">Sin resultados. Puedes crear el alimento como propio.</p>`;
        return;
      }
      renderFoodRows(resultsBox, results);
    }, 400);
  });

  root.querySelector("#btn-custom").addEventListener("click", () => openCustomFoodModal());
  root.querySelector("#btn-scan").addEventListener("click", handleScan);

  async function handleScan() {
    const barcode = await scanBarcode();
    if (!barcode) return;

    const known = store.findCustomFoodByBarcode(barcode);
    if (known) {
      openQuantityModal(known);
      return;
    }

    resultsBox.innerHTML = `<p class="label">Buscando producto del código ${barcode}…</p>`;
    const product = await getProductByBarcode(barcode);

    if (product) {
      resultsBox.innerHTML = "";
      openQuantityModal(product);
    } else if (product === null) {
      resultsBox.innerHTML = `<p class="label">Sin conexión para consultar el código de barras.</p>`;
    } else {
      resultsBox.innerHTML = `<p class="label">Código ${barcode} no encontrado en Open Food Facts. Créalo como alimento propio (se guardará para la próxima vez que lo escanees).</p>`;
      openCustomFoodModal({ barcode });
    }
  }

  function renderFoodRows(container, foods) {
    container.innerHTML = foods.map((f, i) => foodRowHtml(f, i)).join("");
    const byIndex = new Map(foods.map((f, i) => [String(i), f]));
    container.querySelectorAll(".food-item").forEach((el) =>
      el.addEventListener("click", () => openQuantityModal(byIndex.get(el.dataset.i)))
    );
    container.querySelectorAll(".star").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const food = byIndex.get(btn.dataset.i);
        if (store.isFavorite(food.name)) {
          store.removeFavorite(food.name);
          btn.classList.remove("active");
        } else {
          store.addFavorite(food);
          btn.classList.add("active");
        }
      })
    );
  }

  function renderQuickLists() {
    const favs = store.getFavorites();
    const recents = getRecentFoods().filter((f) => !favs.some((fav) => fav.name.toLowerCase() === f.name.toLowerCase()));
    if (favs.length === 0 && recents.length === 0) {
      resultsBox.innerHTML = "";
      return;
    }
    const combined = [...favs, ...recents];
    resultsBox.innerHTML =
      (favs.length > 0 ? `<p class="label" style="margin:6px 0 4px">Favoritos</p>${favs.map((f, i) => foodRowHtml(f, i)).join("")}` : "") +
      (recents.length > 0
        ? `<p class="label" style="margin:14px 0 4px">Recientes</p>${recents.map((f, i) => foodRowHtml(f, favs.length + i)).join("")}`
        : "");

    const byIndex = new Map(combined.map((f, i) => [String(i), f]));
    resultsBox.querySelectorAll(".food-item").forEach((el) =>
      el.addEventListener("click", () => openQuantityModal(byIndex.get(el.dataset.i)))
    );
    resultsBox.querySelectorAll(".star").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const food = byIndex.get(btn.dataset.i);
        if (store.isFavorite(food.name)) {
          store.removeFavorite(food.name);
        } else {
          store.addFavorite(food);
        }
        renderQuickLists();
      })
    );
  }

  function getRecentFoods() {
    const seen = new Set();
    const recents = [];
    for (let offset = 0; offset >= -13 && recents.length < 8; offset--) {
      const dk = dateKeyForOffset(offset);
      const entries = store.getLog(dk);
      for (let i = entries.length - 1; i >= 0 && recents.length < 8; i--) {
        const e = entries[i];
        const key = e.foodName.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const factor = e.grams > 0 ? 100 / e.grams : 0;
        recents.push({
          name: e.foodName,
          source: "recent",
          kcal100: Math.round(e.kcal * factor),
          protein100: Math.round(e.protein * factor),
          carbs100: Math.round(e.carbs * factor),
          fat100: Math.round(e.fat * factor),
        });
      }
    }
    return recents;
  }

  renderQuickLists();

  function drawLog() {
    const entries = store.getLog(currentDate);
    root.querySelector("#date-pick").value = currentDate;

    if (entries.length === 0) {
      root.querySelector("#log-list").innerHTML = `<div class="empty">Todavía no has registrado nada este día.</div>`;
      return;
    }

    const byMeal = MEALS.map((m) => ({ meal: m, items: entries.filter((e) => e.meal === m) })).filter(
      (g) => g.items.length > 0
    );

    root.querySelector("#log-list").innerHTML = byMeal
      .map(
        (g) => `
      <div class="card flat">
        <h3>${g.meal}</h3>
        ${g.items
          .map(
            (e) => `
          <div class="food-item" data-id="${e.id}">
            <span class="name">${escHtml(e.foodName)} <span class="label">· ${e.grams}g</span></span>
            <span class="kcal">${e.kcal} kcal</span>
          </div>`
          )
          .join("")}
      </div>`
      )
      .join("");

    root.querySelectorAll("#log-list .food-item").forEach((el) =>
      el.addEventListener("click", () => {
        if (!confirm("¿Eliminar este registro?")) return;
        const updated = store.getLog(currentDate).filter((e) => e.id !== el.dataset.id);
        store.setLog(currentDate, updated);
        drawLog();
        if (!input.value.trim()) renderQuickLists();
        document.dispatchEvent(new CustomEvent("fitlog:log-changed"));
      })
    );
  }

  function openQuantityModal(food) {
    const modal = buildModal(`
      <h2>${escHtml(food.name)}</h2>
      <div class="field">
        <label>Cantidad (g)</label>
        <input type="number" id="q-grams" value="100" inputmode="decimal" />
      </div>
      <div class="field">
        <label>Comida</label>
        <div class="segmented" id="q-meal">
          ${MEALS.map((m, i) => `<button data-val="${m}" class="${i === 0 ? "active" : ""}">${m}</button>`).join("")}
        </div>
      </div>
      <div id="q-preview" class="label" style="margin:10px 0 16px"></div>
      <button class="btn block" id="q-add">Añadir</button>
    `);

    const gramsInput = modal.querySelector("#q-grams");
    const preview = modal.querySelector("#q-preview");
    const mealBtns = modal.querySelectorAll("#q-meal button");
    mealBtns.forEach((b) =>
      b.addEventListener("click", () => {
        mealBtns.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
      })
    );

    function updatePreview() {
      const g = parseFloat(gramsInput.value) || 0;
      const factor = g / 100;
      preview.textContent = `${Math.round(food.kcal100 * factor)} kcal · P ${Math.round(
        food.protein100 * factor
      )}g · C ${Math.round(food.carbs100 * factor)}g · G ${Math.round(food.fat100 * factor)}g`;
    }
    gramsInput.addEventListener("input", updatePreview);
    updatePreview();

    modal.querySelector("#q-add").addEventListener("click", () => {
      const g = parseFloat(gramsInput.value) || 0;
      if (g <= 0) return;
      const factor = g / 100;
      const entry = {
        id: uid(),
        foodName: food.name,
        grams: g,
        meal: modal.querySelector("#q-meal button.active").dataset.val,
        kcal: Math.round(food.kcal100 * factor),
        protein: Math.round(food.protein100 * factor),
        carbs: Math.round(food.carbs100 * factor),
        fat: Math.round(food.fat100 * factor),
      };
      const entries = store.getLog(currentDate);
      entries.push(entry);
      store.setLog(currentDate, entries);
      closeModal(modal);
      drawLog();
      if (!input.value.trim()) renderQuickLists();
      document.dispatchEvent(new CustomEvent("fitlog:log-changed"));
    });
  }

  function openCustomFoodModal({ barcode } = {}) {
    const modal = buildModal(`
      <h2>Alimento propio</h2>
      ${barcode ? `<p class="label" style="margin-bottom:12px">Código de barras: ${escHtml(barcode)}</p>` : ""}
      <div class="field"><label>Nombre</label><input type="text" id="c-name" placeholder="Batido de proteína" /></div>
      <div class="field"><label>Kcal por 100g</label><input type="number" id="c-kcal" inputmode="decimal" /></div>
      <div class="field"><label>Proteína por 100g (g)</label><input type="number" id="c-pro" inputmode="decimal" /></div>
      <div class="field"><label>Carbohidratos por 100g (g)</label><input type="number" id="c-carb" inputmode="decimal" /></div>
      <div class="field"><label>Grasas por 100g (g)</label><input type="number" id="c-fat" inputmode="decimal" /></div>
      <button class="btn block" id="c-save">Guardar y añadir a comidas</button>
    `);

    modal.querySelector("#c-save").addEventListener("click", () => {
      const name = modal.querySelector("#c-name").value.trim();
      const kcal100 = parseFloat(modal.querySelector("#c-kcal").value) || 0;
      if (!name || !kcal100) {
        alert("Pon al menos nombre y calorías.");
        return;
      }
      const food = {
        id: uid(),
        source: "custom",
        name,
        kcal100,
        protein100: parseFloat(modal.querySelector("#c-pro").value) || 0,
        carbs100: parseFloat(modal.querySelector("#c-carb").value) || 0,
        fat100: parseFloat(modal.querySelector("#c-fat").value) || 0,
      };
      if (barcode) food.barcode = barcode;
      store.addCustomFood(food);
      closeModal(modal);
      openQuantityModal(food);
    });
  }

  drawLog();
}

function buildModal(innerHtml) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `<div class="modal-sheet">${innerHtml}</div>`;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal(backdrop);
  });
  document.body.appendChild(backdrop);
  return backdrop;
}
function closeModal(modal) {
  modal.remove();
}
function foodRowHtml(f, i) {
  const fav = store.isFavorite(f.name);
  return `
    <div class="food-item" data-i="${i}">
      <span class="name">${escHtml(f.name)}${f.source === "custom" ? ' <span class="tag">propio</span>' : ""}</span>
      <div class="row" style="gap:2px">
        <span class="kcal">${f.kcal100} kcal/100g</span>
        <button class="star ${fav ? "active" : ""}" data-i="${i}">★</button>
      </div>
    </div>`;
}
function escHtml(v) {
  return (v || "").replace(/</g, "&lt;");
}
