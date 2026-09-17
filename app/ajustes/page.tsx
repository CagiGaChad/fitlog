"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { store, todayKey } from "@/lib/storage";
import { ACTIVITY_LEVELS, GOALS, calcGoals } from "@/lib/macros";
import type { ActivityId, Goals, GoalType, Profile, Sex } from "@/lib/types";

interface FormState {
  weight: string;
  height: string;
  age: string;
  sex: Sex;
  activity: ActivityId;
  goalType: GoalType;
}

interface OverrideForm {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const DEFAULT_FORM: FormState = {
  weight: "",
  height: "",
  age: "",
  sex: "hombre",
  activity: "moderado",
  goalType: "mantener",
};

export default function AjustesPage() {
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [overrides, setOverrides] = useState<OverrideForm>({ calories: "", protein: "", carbs: "", fat: "" });
  const [preview, setPreview] = useState<Goals | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = store.getProfile();
    if (p) {
      setForm({
        weight: String(p.weight ?? ""),
        height: String(p.height ?? ""),
        age: String(p.age ?? ""),
        sex: p.sex,
        activity: p.activity,
        goalType: p.goalType,
      });
      if (p.overrides) {
        setOverrides({
          calories: p.overrides.calories != null ? String(p.overrides.calories) : "",
          protein: p.overrides.protein != null ? String(p.overrides.protein) : "",
          carbs: p.overrides.carbs != null ? String(p.overrides.carbs) : "",
          fat: p.overrides.fat != null ? String(p.overrides.fat) : "",
        });
      }
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  function currentForm() {
    return {
      weight: parseFloat(form.weight) || 0,
      height: parseFloat(form.height) || 0,
      age: parseInt(form.age, 10) || 0,
      sex: form.sex,
      activity: form.activity,
      goalType: form.goalType,
    };
  }

  function handleCalc() {
    const f = currentForm();
    if (!f.weight || !f.height || !f.age) {
      setPreviewError(true);
      setPreview(null);
      return;
    }
    setPreviewError(false);
    const goals = calcGoals(f);
    setPreview(goals);
    setOverrides({
      calories: String(goals.calories),
      protein: String(goals.protein),
      carbs: String(goals.carbs),
      fat: String(goals.fat),
    });
  }

  function handleSave() {
    const f = currentForm();
    const parsedOverrides = {
      calories: parseFloat(overrides.calories) || null,
      protein: parseFloat(overrides.protein) || null,
      carbs: parseFloat(overrides.carbs) || null,
      fat: parseFloat(overrides.fat) || null,
    };
    const hasOverrides = Object.values(parsedOverrides).some((v) => v != null);
    const profile: Profile = { ...f, overrides: hasOverrides ? parsedOverrides : null };
    store.setProfile(profile);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  function handleExport() {
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
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("Esto sobrescribirá tus datos actuales con los del archivo. ¿Continuar?")) return;
    try {
      const data = JSON.parse(await file.text());
      store.importAll(data);
      alert("Datos restaurados. La app se va a recargar.");
      location.reload();
    } catch {
      alert("El archivo no es una copia de seguridad válida.");
    }
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="text-[30px]">Ajustes</h1>
      </div>

      <Card>
        <h3 className="mb-3">Tus datos</h3>
        <Field label="Peso (kg)">
          <input
            type="number"
            inputMode="decimal"
            value={form.weight}
            placeholder="75"
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
          />
        </Field>
        <Field label="Altura (cm)">
          <input
            type="number"
            inputMode="decimal"
            value={form.height}
            placeholder="178"
            onChange={(e) => setForm({ ...form, height: e.target.value })}
          />
        </Field>
        <Field label="Edad">
          <input
            type="number"
            inputMode="numeric"
            value={form.age}
            placeholder="28"
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />
        </Field>
        <Field label="Sexo">
          <Segmented
            options={[
              { value: "hombre", label: "Hombre" },
              { value: "mujer", label: "Mujer" },
            ]}
            value={form.sex}
            onChange={(v) => setForm({ ...form, sex: v as Sex })}
          />
        </Field>
        <Field label="Nivel de actividad">
          <select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value as ActivityId })}>
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Objetivo">
          <Segmented
            options={GOALS.map((g) => ({ value: g.id, label: g.label }))}
            value={form.goalType}
            onChange={(v) => setForm({ ...form, goalType: v as GoalType })}
          />
        </Field>
        <button onClick={handleCalc} className="w-full bg-accent text-white rounded-[10px] py-3 font-semibold mt-1">
          Calcular objetivos
        </button>
      </Card>

      {previewError && (
        <Card variant="danger">
          <p className="text-dim text-sm">Rellena peso, altura y edad para calcular.</p>
        </Card>
      )}
      {preview && (
        <Card variant="amber">
          <h3>Objetivo diario calculado</h3>
          <div className="flex gap-6 mt-2">
            <Stat label="Calorías" value={String(preview.calories)} />
            <Stat label="Proteína" value={`${preview.protein}g`} />
          </div>
          <div className="flex gap-6 mt-2.5">
            <Stat label="Carbos" value={`${preview.carbs}g`} />
            <Stat label="Grasas" value={`${preview.fat}g`} />
          </div>
          <p className="text-dim text-[13px] mt-2.5">
            TDEE estimado: {preview.tdee} kcal/día · TMB: {preview.bmr} kcal
          </p>
        </Card>
      )}

      <Card variant="flat">
        <h3 className="mb-1">Ajustar manualmente</h3>
        <p className="text-dim text-sm mb-3">
          Si quieres afinar los números calculados, cámbialos aquí. Se guardan como tu objetivo real.
        </p>
        <Field label="Calorías (kcal)">
          <input
            type="number"
            value={overrides.calories}
            placeholder="calculado automáticamente"
            onChange={(e) => setOverrides({ ...overrides, calories: e.target.value })}
          />
        </Field>
        <Field label="Proteína (g)">
          <input
            type="number"
            value={overrides.protein}
            placeholder="calculado automáticamente"
            onChange={(e) => setOverrides({ ...overrides, protein: e.target.value })}
          />
        </Field>
        <Field label="Carbohidratos (g)">
          <input
            type="number"
            value={overrides.carbs}
            placeholder="calculado automáticamente"
            onChange={(e) => setOverrides({ ...overrides, carbs: e.target.value })}
          />
        </Field>
        <Field label="Grasas (g)">
          <input
            type="number"
            value={overrides.fat}
            placeholder="calculado automáticamente"
            onChange={(e) => setOverrides({ ...overrides, fat: e.target.value })}
          />
        </Field>
        <button onClick={handleSave} className="w-full bg-surface-2 border border-line rounded-[10px] py-3 font-semibold">
          {savedFlash ? "Guardado ✓" : "Guardar"}
        </button>
      </Card>

      <Card variant="flat">
        <h3 className="mb-1">Copia de seguridad</h3>
        <p className="text-dim text-sm mb-3">
          Descarga tus datos (comidas, entrenos, peso, perfil) por si cambias de móvil o el navegador borra los datos.
          Restaura desde un archivo guardado.
        </p>
        <button onClick={handleExport} className="w-full bg-surface-2 border border-line rounded-[10px] py-3 font-semibold mb-2.5">
          Descargar copia de seguridad
        </button>
        <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        <button onClick={() => importInputRef.current?.click()} className="w-full text-dim py-2 font-medium">
          Restaurar copia de seguridad
        </button>
      </Card>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-dim text-[13px] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-dim text-[13px]">{label}</span>
      <span className="font-mono text-xl">{value}</span>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-2 rounded-[8px] text-[13px] border ${
            value === o.value ? "bg-accent border-accent text-white" : "border-line text-dim"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
