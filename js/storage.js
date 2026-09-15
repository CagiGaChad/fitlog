// Envoltorio simple sobre localStorage. Todo el estado del usuario vive en el propio iPhone.

const KEYS = {
  profile: "fitlog_profile",
  customFoods: "fitlog_custom_foods",
  week: "fitlog_week_plan",
  logPrefix: "fitlog_log_", // + YYYY-MM-DD
  donePrefix: "fitlog_done_", // + YYYY-MM-DD -> boolean (entreno sin lista de ejercicios)
  exercisesPrefix: "fitlog_exercises_", // + YYYY-MM-DD -> [{name, done}] (entreno con lista de ejercicios)
  weightLog: "fitlog_weight_log",
  favorites: "fitlog_favorite_foods",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error leyendo", key, e);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error guardando", key, e);
  }
}

export const store = {
  getProfile() {
    return read(KEYS.profile, null);
  },
  setProfile(profile) {
    write(KEYS.profile, profile);
  },

  getCustomFoods() {
    return read(KEYS.customFoods, []);
  },
  addCustomFood(food) {
    const foods = read(KEYS.customFoods, []);
    foods.unshift(food);
    write(KEYS.customFoods, foods);
  },

  getWeekPlan() {
    return read(KEYS.week, null);
  },
  setWeekPlan(plan) {
    write(KEYS.week, plan);
  },

  getLog(dateKey) {
    return read(KEYS.logPrefix + dateKey, []);
  },
  setLog(dateKey, entries) {
    write(KEYS.logPrefix + dateKey, entries);
  },

  isWorkoutDone(dateKey) {
    return read(KEYS.donePrefix + dateKey, false);
  },
  setWorkoutDone(dateKey, done) {
    write(KEYS.donePrefix + dateKey, done);
  },

  getExerciseChecks(dateKey) {
    return read(KEYS.exercisesPrefix + dateKey, null);
  },
  setExerciseChecks(dateKey, list) {
    write(KEYS.exercisesPrefix + dateKey, list);
  },

  getWeightLog() {
    return read(KEYS.weightLog, []);
  },
  addWeightEntry(entry) {
    const log = read(KEYS.weightLog, []);
    log.push(entry);
    log.sort((a, b) => a.date.localeCompare(b.date));
    write(KEYS.weightLog, log);
  },
  deleteWeightEntry(id) {
    const log = read(KEYS.weightLog, []).filter((e) => e.id !== id);
    write(KEYS.weightLog, log);
  },

  getFavorites() {
    return read(KEYS.favorites, []);
  },
  isFavorite(name) {
    return read(KEYS.favorites, []).some((f) => f.name.toLowerCase() === name.toLowerCase());
  },
  addFavorite(food) {
    const favs = read(KEYS.favorites, []);
    if (favs.some((f) => f.name.toLowerCase() === food.name.toLowerCase())) return;
    favs.unshift({
      name: food.name,
      source: food.source,
      kcal100: food.kcal100,
      protein100: food.protein100,
      carbs100: food.carbs100,
      fat100: food.fat100,
    });
    write(KEYS.favorites, favs);
  },
  removeFavorite(name) {
    const favs = read(KEYS.favorites, []).filter((f) => f.name.toLowerCase() !== name.toLowerCase());
    write(KEYS.favorites, favs);
  },

  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("fitlog_")) data[key] = localStorage.getItem(key);
    }
    return data;
  },
  importAll(data) {
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith("fitlog_")) localStorage.setItem(key, value);
    });
  },
};

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// dateKey de hoy desplazado N días (offset negativo = días atrás).
export function dateKeyForOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return todayKey(d);
}

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// 0 = Lunes ... 6 = Domingo (getDay() de JS usa 0=Domingo, lo convertimos)
export function isoDayIndex(d = new Date()) {
  const jsDay = d.getDay(); // 0 domingo .. 6 sabado
  return jsDay === 0 ? 6 : jsDay - 1;
}
