export type Sex = "hombre" | "mujer";
export type GoalType = "perder" | "mantener" | "ganar";
export type ActivityId = "sedentario" | "ligero" | "moderado" | "activo" | "muy_activo";

export interface Overrides {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface Profile {
  weight: number;
  height: number;
  age: number;
  sex: Sex;
  activity: ActivityId;
  goalType: GoalType;
  overrides: Overrides | null;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmr: number;
  tdee: number;
}

export type FoodSource = "off" | "custom" | "recent";

export interface Food {
  id: string;
  source: FoodSource;
  name: string;
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
  barcode?: string;
}

export interface LogEntry {
  id: string;
  foodName: string;
  grams: number;
  meal: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface ExerciseCheck {
  name: string;
  done: boolean;
}

export interface Workout {
  id: string;
  name: string;
  notes: string;
  exercises: string[];
}

export interface WeekDay {
  day: string;
  workouts: Workout[];
}

export type WeekPlan = WeekDay[];

// Forma antigua (un único entreno por día) guardada por versiones previas de la app.
export interface LegacyWeekDay {
  day: string;
  name: string;
  notes: string;
  exercises: string[];
}
