import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sheet } from "./Sheet";
import { useStore } from "../store/useStore";
import {
  DURATION_OPTIONS,
  parseTime,
  prettyDuration,
  prettyMinutes,
  prettyTime,
} from "../lib/time";
import { WEEKDAYS_MON_FIRST, WEEKDAY_SHORT_MON_FIRST } from "../lib/date";
import type { RoutineSlot, Weekday } from "../types";
import { contrastInk } from "../lib/color";

interface Props {
  open: boolean;
  weekday: Weekday;
  defaultStart?: string;
  startAsNewHabit?: boolean;
  editing: RoutineSlot | null;
  onClose: () => void;
}

export function SlotSheet({
  open,
  weekday,
  defaultStart = "09:00",
  startAsNewHabit = false,
  editing,
  onClose,
}: Props) {
  const data = useStore((s) => s.data);
  const addRoutineSlot = useStore((s) => s.addRoutineSlot);
  const updateRoutineSlot = useStore((s) => s.updateRoutineSlot);
  const deleteRoutineSlot = useStore((s) => s.deleteRoutineSlot);
  const addHabit = useStore((s) => s.addHabit);

  const [creatingHabit, setCreatingHabit] = useState(false);
  const [habitId, setHabitId] = useState("");
  const [days, setDays] = useState<Weekday[]>([weekday]);
  const [startTime, setStartTime] = useState(defaultStart);
  const [duration, setDuration] = useState(60);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newXp, setNewXp] = useState(20);

  useEffect(() => {
    if (!open) return;
    setCreatingHabit(startAsNewHabit);
    setHabitId(editing?.habitId ?? data.habits[0]?.id ?? "");
    setDays([editing?.weekday ?? weekday]);
    setStartTime(editing?.startTime ?? defaultStart);
    setDuration(editing?.durationMinutes ?? 60);
    setNewName("");
    setNewCat(data.categories[0]?.id ?? "");
    setNewXp(20);
  }, [open]);

  const cats = [...data.categories].sort((a, b) => a.order - b.order);

  function toggleDay(day: Weekday) {
    if (editing) {
      setDays([day]);
      return;
    }
    setDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day]
    );
  }

  function save() {
    let hid = habitId;
    if (creatingHabit) {
      const name = newName.trim();
      if (!name || !newCat) return;
      hid = addHabit({ categoryId: newCat, name, xp: newXp });
    }
    if (!hid || days.length === 0) return;

    if (editing) {
      updateRoutineSlot(editing.id, {
        habitId: hid,
        weekday: days[0],
        startTime,
        durationMinutes: duration,
      });
    } else {
      for (const day of days) {
        addRoutineSlot({
          habitId: hid,
          weekday: day,
          startTime,
          durationMinutes: duration,
        });
      }
    }
    onClose();
  }

  return (
    <Sheet
      open={open}
      title={editing ? "Editar bloco" : "Novo bloco"}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="flex gap-2">
          <TabBtn active={!creatingHabit} onClick={() => setCreatingHabit(false)}>
            Existente
          </TabBtn>
          <TabBtn active={creatingHabit} onClick={() => setCreatingHabit(true)}>
            Nova atividade
          </TabBtn>
        </div>

        {!creatingHabit ? (
          <Field label="Atividade">
            <div className="max-h-44 space-y-3 overflow-y-auto">
              {cats.map((cat) => {
                const list = data.habits.filter(
                  (h) => h.categoryId === cat.id && !h.archived
                );
                if (list.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="mb-1.5 text-xs text-white/40">
                      {cat.icon} {cat.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {list.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => setHabitId(h.id)}
                          className="rounded-full px-3 py-1.5 text-sm transition"
                          style={{
                            backgroundColor:
                              habitId === h.id ? cat.color : "rgba(255,255,255,0.06)",
                            color:
                              habitId === h.id
                                ? contrastInk(cat.color)
                                : "rgba(255,255,255,0.5)",
                          }}
                        >
                          {h.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Field>
        ) : (
          <>
            <Field label="Nome">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Treino de força"
                className="w-full rounded-xl bg-ink-800 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />
            </Field>
            <Field label="Categoria">
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setNewCat(c.id)}
                    className="rounded-full px-3 py-1.5 text-sm"
                    style={{
                      backgroundColor:
                        newCat === c.id ? c.color : "rgba(255,255,255,0.06)",
                      color:
                        newCat === c.id ? contrastInk(c.color) : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`XP: ${newXp}`}>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={newXp}
                onChange={(e) => setNewXp(Number(e.target.value))}
                className="w-full accent-white"
              />
            </Field>
          </>
        )}

        <Field label={editing ? "Dia" : "Dias"}>
          <div className="flex gap-1.5">
            {WEEKDAYS_MON_FIRST.map((day, i) => {
              const active = days.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`flex-1 rounded-xl py-2 text-[11px] font-semibold transition ${
                    active ? "bg-white text-ink-950" : "bg-ink-800 text-white/45"
                  }`}
                >
                  {WEEKDAY_SHORT_MON_FIRST[i]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label={`Horário · ${prettyTime(startTime)} → ${prettyMinutes(
            parseTime(startTime) + duration
          )}`}
        >
          <input
            type="time"
            step={900}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl bg-ink-800 px-4 py-3 text-white outline-none [color-scheme:dark]"
          />
        </Field>

        <Field label="Duração">
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  duration === d ? "bg-white text-ink-950" : "bg-ink-800 text-white/50"
                }`}
              >
                {prettyDuration(d)}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex gap-3 pt-1">
          {editing && (
            <button
              onClick={() => {
                if (confirm("Excluir este bloco da rotina?")) {
                  deleteRoutineSlot(editing.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400"
            >
              <span aria-hidden>🗑</span> Excluir
            </button>
          )}
          <button
            onClick={save}
            className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-ink-950 shadow-glow"
          >
            {editing
              ? "Salvar"
              : days.length > 1
              ? `Adicionar em ${days.length} dias`
              : "Adicionar"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
        active ? "bg-white/10 text-white" : "text-white/40"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <label className="block text-xs font-medium uppercase tracking-wide text-white/45">
        {label}
      </label>
      {children}
    </motion.div>
  );
}
