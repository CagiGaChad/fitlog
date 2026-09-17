"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { store, todayKey, dateKeyForOffset, isoDayIndex } from "@/lib/storage";
import { activeGoals, sumLog } from "@/lib/macros";
import { ensureWeekPlan, hasProfile, uid } from "@/lib/state";
import type { WeightEntry } from "@/lib/types";

type Section = "peso" | "macros" | "entrenos";

function formatDateLabel(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  const s = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ProgresoPage() {
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<Section>("peso");

  useEffect(() => setReady(true), []);
  if (!ready) return null;

  return (
    <>
      <div className="mb-4">
        <h1 className="text-[30px]">Progreso</h1>
      </div>
      <div className="flex gap-1.5 mb-4">
        {(
          [
            { id: "peso", label: "Peso" },
            { id: "macros", label: "Macros" },
            { id: "entrenos", label: "Entrenos" },
          ] as { id: Section; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={`px-3 py-2 rounded-[8px] text-[13px] border ${
              section === t.id ? "bg-accent border-accent text-white" : "border-line text-dim"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === "peso" && <PesoSection />}
      {section === "macros" && <MacrosSection />}
      {section === "entrenos" && <EntrenosSection />}
    </>
  );
}

function PesoSection() {
  const [log, setLog] = useState<WeightEntry[]>([]);
  const [date, setDate] = useState(todayKey());
  const [weight, setWeight] = useState("");

  useEffect(() => {
    setLog(store.getWeightLog());
  }, []);

  function handleAdd() {
    const w = parseFloat(weight);
    if (!date || !w) return;
    store.addWeightEntry({ id: uid(), date, weight: w });
    setLog(store.getWeightLog());
    setWeight("");
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro de peso?")) return;
    store.deleteWeightEntry(id);
    setLog(store.getWeightLog());
  }

  const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Card>
        <h3 className="mb-3">Registrar peso</h3>
        <label className="block text-dim text-[13px] mb-1.5">Fecha</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mb-3" />
        <label className="block text-dim text-[13px] mb-1.5">Peso (kg)</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="75.4"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="mb-3"
        />
        <button onClick={handleAdd} className="w-full bg-accent text-white rounded-[10px] py-3 font-semibold">
          Añadir
        </button>
      </Card>

      {log.length > 1 && (
        <Card variant="flat">
          <h3 className="mb-2">Evolución</h3>
          <LineChart values={log.map((e) => e.weight)} />
        </Card>
      )}

      <Card variant="flat">
        <h3 className="mb-2">Historial</h3>
        {log.length === 0 && <div className="text-dim text-sm py-2">Todavía no has registrado tu peso.</div>}
        {sorted.map((e) => (
          <button
            key={e.id}
            onClick={() => handleDelete(e.id)}
            className="w-full flex items-center justify-between py-2.5 border-b border-line last:border-0 text-left"
          >
            <span>{formatDateLabel(e.date)}</span>
            <span className="font-mono text-dim">{e.weight} kg</span>
          </button>
        ))}
      </Card>
    </>
  );
}

function MacrosSection() {
  const [ok, setOk] = useState(false);
  const [goalsCal, setGoalsCal] = useState(0);
  const [data, setData] = useState<{ date: string; calories: number }[]>([]);
  const DAYS = 14;

  useEffect(() => {
    if (!hasProfile()) {
      setOk(false);
      return;
    }
    setOk(true);
    const goals = activeGoals(store.getProfile()!);
    setGoalsCal(goals.calories);
    const d = [];
    for (let offset = -(DAYS - 1); offset <= 0; offset++) {
      const dk = dateKeyForOffset(offset);
      d.push({ date: dk, calories: sumLog(store.getLog(dk)).calories });
    }
    setData(d);
  }, []);

  if (!ok) {
    return (
      <Card variant="amber">
        <h3>Configura tu perfil</h3>
        <p className="text-dim text-sm mt-2">
          Necesitas tus objetivos calculados en Ajustes para ver el historial de macros.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3>Calorías · últimos {DAYS} días</h3>
      <div className="mt-2.5">
        <BarChart data={data} goal={goalsCal} />
      </div>
      <p className="text-dim text-[13px] mt-2">Objetivo: {goalsCal} kcal/día · en rojo los días por encima</p>
    </Card>
  );
}

interface WorkoutDetail {
  name: string;
  exercises: { name: string; done: boolean }[] | null;
}

function EntrenosSection() {
  const DAYS = 28;
  const [cells, setCells] = useState<{ date: string; status: "none" | "partial" | "done" }[]>([]);
  const [details, setDetails] = useState<{ date: string; workouts: WorkoutDetail[] }[]>([]);

  useEffect(() => {
    const plan = ensureWeekPlan();
    const c: { date: string; status: "none" | "partial" | "done" }[] = [];
    const d: { date: string; workouts: WorkoutDetail[] }[] = [];

    for (let offset = -(DAYS - 1); offset <= 0; offset++) {
      const dk = dateKeyForOffset(offset);
      const dayIndex = isoDayIndex(new Date(dk + "T00:00:00"));
      const workouts = plan[dayIndex].workouts;

      let doneWorkouts = 0;
      let startedWorkouts = 0;
      const dayDetails: WorkoutDetail[] = [];

      for (const w of workouts) {
        if (w.exercises.length > 0) {
          const checks = store.getExerciseChecks(dk, w.id);
          const doneCount = checks ? checks.filter((e) => e.done).length : 0;
          if (doneCount > 0) {
            startedWorkouts++;
            dayDetails.push({ name: w.name || "Entreno", exercises: checks });
          }
          if (checks && checks.length > 0 && doneCount === checks.length) doneWorkouts++;
        } else if (store.isWorkoutDone(dk, w.id)) {
          doneWorkouts++;
          startedWorkouts++;
          dayDetails.push({ name: w.name || "Entreno", exercises: null });
        }
      }

      let status: "none" | "partial" | "done" = "none";
      if (workouts.length > 0 && startedWorkouts > 0) {
        status = doneWorkouts === workouts.length ? "done" : "partial";
      }
      c.push({ date: dk, status });
      if (dayDetails.length > 0) d.push({ date: dk, workouts: dayDetails });
    }
    setCells(c);
    setDetails(d);
  }, []);

  return (
    <>
      <Card>
        <h3>Últimos {DAYS} días</h3>
        <div className="streak-grid">
          {cells.map((c) => (
            <span key={c.date} className={`streak-cell ${c.status}`} title={c.date} />
          ))}
        </div>
        <div className="flex gap-3.5 mt-2.5">
          <span className="text-dim text-[13px] flex items-center">
            <span className="streak-dot done" />
            Completo
          </span>
          <span className="text-dim text-[13px] flex items-center">
            <span className="streak-dot partial" />
            Parcial
          </span>
          <span className="text-dim text-[13px] flex items-center">
            <span className="streak-dot" />
            Nada
          </span>
        </div>
      </Card>

      <Card variant="flat">
        <h3 className="mb-2">Detalle reciente</h3>
        {details.length === 0 && <div className="text-dim text-sm py-2">Todavía no hay entrenos registrados.</div>}
        {details
          .slice()
          .reverse()
          .slice(0, 10)
          .map((d) => (
            <div key={d.date} className="mb-3 last:mb-0">
              <span className="text-dim text-[13px] font-mono block mb-1">{formatDateLabel(d.date)}</span>
              {d.workouts.map((w, wi) => (
                <div key={wi} className="mb-1.5 last:mb-0">
                  {w.exercises ? (
                    <>
                      <span className="block text-[14px] text-dim">{w.name}</span>
                      {w.exercises.map((e, i) => (
                        <span key={i} className="block text-[14px]">
                          {e.done ? "✓" : "✗"} {e.name}
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="text-[14px]">✓ {w.name}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
      </Card>
    </>
  );
}
