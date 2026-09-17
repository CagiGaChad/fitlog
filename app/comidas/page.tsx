"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { store, todayKey, dateKeyForOffset } from "@/lib/storage";
import { searchOpenFoodFacts, getProductByBarcode } from "@/lib/foodApi";
import { scanBarcode } from "@/lib/barcodeScanner";
import { uid } from "@/lib/state";
import type { Food, LogEntry } from "@/lib/types";

const MEALS = ["Desayuno", "Comida", "Merienda", "Cena", "Otro"];

function getRecentFoods(): Food[] {
  const seen = new Set<string>();
  const recents: Food[] = [];
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
        id: `recent_${key}`,
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

type ModalState = { type: "quantity"; food: Food } | { type: "custom"; barcode?: string } | null;

export default function ComidasPage() {
  const [ready, setReady] = useState(false);
  const [currentDate, setCurrentDate] = useState(todayKey());
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Food[] | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [favorites, setFavorites] = useState<Food[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(store.getFavorites());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setEntries(store.getLog(currentDate));
  }, [currentDate, ready]);

  const recents = useMemo(() => {
    if (!ready) return [];
    return getRecentFoods().filter((f) => !favorites.some((fav) => fav.name.toLowerCase() === f.name.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getRecentFoods reads storage directly; `entries` triggers a recompute after logging a food, it isn't read in the body.
  }, [ready, favorites, entries]);

  useEffect(() => {
    if (!ready) return;
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setSearchMessage(null);
      return;
    }
    setSearching(true);
    setSearchMessage(null);
    const timer = setTimeout(async () => {
      const custom = store.getCustomFoods().filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
      const remote = await searchOpenFoodFacts(q);
      const results = [...custom, ...(remote || [])];

      setSearching(false);
      if (remote === null && custom.length === 0) {
        setSearchMessage("No hay conexión para buscar en la base externa. Prueba con un alimento propio.");
        setSearchResults([]);
        return;
      }
      if (results.length === 0) {
        setSearchMessage("Sin resultados. Puedes crear el alimento como propio.");
        setSearchResults([]);
        return;
      }
      setSearchResults(results);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, ready]);

  function refreshFavorites() {
    setFavorites(store.getFavorites());
  }

  function toggleFavorite(food: Food) {
    if (store.isFavorite(food.name)) store.removeFavorite(food.name);
    else store.addFavorite(food);
    refreshFavorites();
  }

  function addToLog(food: Food, grams: number, meal: string) {
    const factor = grams / 100;
    const entry: LogEntry = {
      id: uid(),
      foodName: food.name,
      grams,
      meal,
      kcal: Math.round(food.kcal100 * factor),
      protein: Math.round(food.protein100 * factor),
      carbs: Math.round(food.carbs100 * factor),
      fat: Math.round(food.fat100 * factor),
    };
    const updated = [...store.getLog(currentDate), entry];
    store.setLog(currentDate, updated);
    setEntries(updated);
    setModal(null);
  }

  function deleteEntry(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    const updated = store.getLog(currentDate).filter((e) => e.id !== id);
    store.setLog(currentDate, updated);
    setEntries(updated);
  }

  function saveCustomFood(food: Food) {
    store.addCustomFood(food);
    setModal({ type: "quantity", food });
  }

  async function handleScan() {
    const barcode = await scanBarcode();
    if (!barcode) return;

    const known = store.findCustomFoodByBarcode(barcode);
    if (known) {
      setModal({ type: "quantity", food: known });
      return;
    }

    setScanMessage(`Buscando producto del código ${barcode}…`);
    const product = await getProductByBarcode(barcode);

    if (product) {
      setScanMessage(null);
      setModal({ type: "quantity", food: product });
    } else if (product === null) {
      setScanMessage("Sin conexión para consultar el código de barras.");
    } else {
      setScanMessage(
        `Código ${barcode} no encontrado en Open Food Facts. Créalo como alimento propio (se guardará para la próxima vez que lo escanees).`
      );
      setModal({ type: "custom", barcode });
    }
  }

  if (!ready) return null;

  const isToday = currentDate === todayKey();
  const byMeal = MEALS.map((m) => ({ meal: m, items: entries.filter((e) => e.meal === m) })).filter(
    (g) => g.items.length > 0
  );
  const showingSearch = query.trim().length >= 2;
  const listToShow = showingSearch ? searchResults : null;

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-[30px]">Comidas</h1>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="!w-auto !bg-transparent !border-0 !p-0 text-dim font-mono text-[13px]"
        />
      </div>

      <Card>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Buscar alimento (ej. pechuga de pollo)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={handleScan}
            title="Escanear código de barras"
            className="shrink-0 h-[42px] w-[42px] rounded-[10px] border border-line text-lg"
          >
            📷
          </button>
        </div>

        {scanMessage && <p className="text-dim text-sm mb-2">{scanMessage}</p>}

        {showingSearch ? (
          searching ? (
            <p className="text-dim text-sm">Buscando…</p>
          ) : searchMessage ? (
            <p className="text-dim text-sm">{searchMessage}</p>
          ) : (
            <FoodList foods={listToShow || []} favorites={favorites} onPick={(f) => setModal({ type: "quantity", food: f })} onToggleFav={toggleFavorite} />
          )
        ) : (
          <>
            {favorites.length > 0 && (
              <>
                <p className="text-dim text-[13px] mt-1.5 mb-1">Favoritos</p>
                <FoodList foods={favorites} favorites={favorites} onPick={(f) => setModal({ type: "quantity", food: f })} onToggleFav={toggleFavorite} />
              </>
            )}
            {recents.length > 0 && (
              <>
                <p className="text-dim text-[13px] mt-3.5 mb-1">Recientes</p>
                <FoodList foods={recents} favorites={favorites} onPick={(f) => setModal({ type: "quantity", food: f })} onToggleFav={toggleFavorite} />
              </>
            )}
          </>
        )}

        <button onClick={() => setModal({ type: "custom" })} className="w-full text-dim py-2.5 mt-1 font-medium border-t border-line">
          + Crear alimento propio
        </button>
      </Card>

      {isToday ? (
        <p className="text-dim text-sm text-center py-6">
          Lo que registres hoy aparece en la pestaña <span className="text-text">Hoy</span>.
        </p>
      ) : entries.length === 0 ? (
        <div className="text-dim text-sm text-center py-8">Todavía no has registrado nada este día.</div>
      ) : (
        byMeal.map((g) => (
          <Card key={g.meal} variant="flat">
            <h3 className="mb-1">{g.meal}</h3>
            {g.items.map((e) => (
              <button
                key={e.id}
                onClick={() => deleteEntry(e.id)}
                className="w-full flex items-center justify-between py-2 border-b border-line last:border-0 text-left"
              >
                <span>
                  {e.foodName} <span className="text-dim text-[13px]">· {e.grams}g</span>
                </span>
                <span className="font-mono text-dim text-[13px]">{e.kcal} kcal</span>
              </button>
            ))}
          </Card>
        ))
      )}

      {modal?.type === "quantity" && (
        <QuantityModal food={modal.food} onClose={() => setModal(null)} onAdd={addToLog} />
      )}
      {modal?.type === "custom" && (
        <CustomFoodModal barcode={modal.barcode} onClose={() => setModal(null)} onSave={saveCustomFood} />
      )}
    </>
  );
}

function FoodList({
  foods,
  favorites,
  onPick,
  onToggleFav,
}: {
  foods: Food[];
  favorites: Food[];
  onPick: (f: Food) => void;
  onToggleFav: (f: Food) => void;
}) {
  return (
    <div>
      {foods.map((f, i) => {
        const isFav = favorites.some((fav) => fav.name.toLowerCase() === f.name.toLowerCase());
        return (
          <div key={f.id + i} className="flex items-center justify-between py-2 border-b border-line last:border-0">
            <button onClick={() => onPick(f)} className="flex-1 text-left">
              <span>
                {f.name}
                {f.source === "custom" && <span className="ml-1.5 text-[11px] text-dim border border-line rounded px-1.5 py-0.5">propio</span>}
              </span>
            </button>
            <span className="font-mono text-dim text-[13px] mr-2">{f.kcal100} kcal/100g</span>
            <button
              onClick={() => onToggleFav(f)}
              className="text-xl leading-none"
              style={{ color: isFav ? "#f4c430" : "var(--text-dim)" }}
            >
              {isFav ? "★" : "☆"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function QuantityModal({
  food,
  onClose,
  onAdd,
}: {
  food: Food;
  onClose: () => void;
  onAdd: (food: Food, grams: number, meal: string) => void;
}) {
  const [grams, setGrams] = useState("100");
  const [meal, setMeal] = useState(MEALS[0]);
  const g = parseFloat(grams) || 0;
  const factor = g / 100;

  return (
    <Modal onClose={onClose}>
      <h2 className="text-[22px] mb-3">{food.name}</h2>
      <label className="block text-dim text-[13px] mb-1.5">Cantidad (g)</label>
      <input type="number" inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} className="mb-3" />
      <label className="block text-dim text-[13px] mb-1.5">Comida</label>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {MEALS.map((m) => (
          <button
            key={m}
            onClick={() => setMeal(m)}
            className={`px-3 py-2 rounded-[8px] text-[13px] border ${
              meal === m ? "bg-accent border-accent text-white" : "border-line text-dim"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="text-dim text-sm mb-4">
        {Math.round(food.kcal100 * factor)} kcal · P {Math.round(food.protein100 * factor)}g · C{" "}
        {Math.round(food.carbs100 * factor)}g · G {Math.round(food.fat100 * factor)}g
      </p>
      <button
        onClick={() => g > 0 && onAdd(food, g, meal)}
        className="w-full bg-accent text-white rounded-[10px] py-3 font-semibold"
      >
        Añadir
      </button>
    </Modal>
  );
}

function CustomFoodModal({
  barcode,
  onClose,
  onSave,
}: {
  barcode?: string;
  onClose: () => void;
  onSave: (food: Food) => void;
}) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  function handleSave() {
    const kcal100 = parseFloat(kcal) || 0;
    if (!name.trim() || !kcal100) {
      alert("Pon al menos nombre y calorías.");
      return;
    }
    const food: Food = {
      id: uid(),
      source: "custom",
      name: name.trim(),
      kcal100,
      protein100: parseFloat(protein) || 0,
      carbs100: parseFloat(carbs) || 0,
      fat100: parseFloat(fat) || 0,
      ...(barcode ? { barcode } : {}),
    };
    onSave(food);
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-[22px] mb-3">Alimento propio</h2>
      {barcode && <p className="text-dim text-sm mb-3">Código de barras: {barcode}</p>}
      <label className="block text-dim text-[13px] mb-1.5">Nombre</label>
      <input type="text" placeholder="Batido de proteína" value={name} onChange={(e) => setName(e.target.value)} className="mb-3" />
      <label className="block text-dim text-[13px] mb-1.5">Kcal por 100g</label>
      <input type="number" inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} className="mb-3" />
      <label className="block text-dim text-[13px] mb-1.5">Proteína por 100g (g)</label>
      <input type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} className="mb-3" />
      <label className="block text-dim text-[13px] mb-1.5">Carbohidratos por 100g (g)</label>
      <input type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="mb-3" />
      <label className="block text-dim text-[13px] mb-1.5">Grasas por 100g (g)</label>
      <input type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} className="mb-4" />
      <button onClick={handleSave} className="w-full bg-accent text-white rounded-[10px] py-3 font-semibold">
        Guardar y añadir a comidas
      </button>
    </Modal>
  );
}
