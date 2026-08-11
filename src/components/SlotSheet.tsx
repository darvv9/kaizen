import { useEffect, useMemo, useState } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./Icon";
import { VariantSheet } from "./VariantSheet";
import { useStore } from "../store/useStore";
import { ask } from "../store/useConfirm";
import { destructive } from "../store/undo";
import {
  DURATION_OPTIONS,
  parseTime,
  prettyDuration,
  prettyMinutes,
  prettyTime,
} from "../lib/time";
import { WEEKDAYS_MON_FIRST, WEEKDAY_SHORT_MON_FIRST } from "../lib/date";
import type { HabitVariant, RoutineSlot, Weekday } from "../types";
import { contrastInk } from "../lib/color";
import { DEFAULT_GYM_VARIANTS, DEFAULT_JIU_VARIANTS } from "../data/defaults";
import { LongPressChip } from "./LongPressChip";

/** Kits de variação oferecidos na criação — os dois casos reais do app. */
const VARIANT_PRESETS = [
  { id: "none", label: "Sem variação", variants: [] as { name: string; items: string[] }[] },
  { id: "gym", label: "Treino A · B · C", variants: DEFAULT_GYM_VARIANTS },
  { id: "jiu", label: "No-gi · Gi · Livre", variants: DEFAULT_JIU_VARIANTS },
];

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
  const deleteHabit = useStore((s) => s.deleteHabit);
  const addHabit = useStore((s) => s.addHabit);
  const addVariant = useStore((s) => s.addVariant);
  const deleteVariant = useStore((s) => s.deleteVariant);

  const [creatingHabit, setCreatingHabit] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [habitId, setHabitId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [days, setDays] = useState<Weekday[]>([weekday]);
  const [startTime, setStartTime] = useState(defaultStart);
  const [duration, setDuration] = useState(60);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [preset, setPreset] = useState("none");
  const [variantSheet, setVariantSheet] = useState(false);
  const [editingVariant, setEditingVariant] = useState<HabitVariant | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    setCreatingHabit(startAsNewHabit);
    setSwapping(false);
    setHabitId(editing?.habitId ?? data.habits[0]?.id ?? "");
    setVariantId(editing?.variantId ?? "");
    setDays([editing?.weekday ?? weekday]);
    setStartTime(editing?.startTime ?? defaultStart);
    setDuration(editing?.durationMinutes ?? 60);
    setNewName("");
    setNewCat(data.categories[0]?.id ?? "");
    setPreset("none");
    setVariantSheet(false);
    setEditingVariant(null);
  }, [open]);

  const cats = [...data.categories].sort((a, b) => a.order - b.order);
  const habit = data.habits.find((h) => h.id === habitId);
  const category = data.categories.find((c) => c.id === habit?.categoryId);
  const variants = creatingHabit ? [] : (habit?.variants ?? []);

  /** Mesma ordem e mesmo visual da paleta da Semana. */
  const options = useMemo(() => {
    const order = new Map(data.categories.map((c) => [c.id, c.order]));
    return data.habits
      .filter((h) => !h.archived)
      .map((h) => ({
        habit: h,
        category: data.categories.find((c) => c.id === h.categoryId),
      }))
      .sort(
        (a, b) =>
          (order.get(a.habit.categoryId) ?? 99) -
          (order.get(b.habit.categoryId) ?? 99),
      );
  }, [data.habits, data.categories]);

  /* Editando um bloco a atividade já está escolhida: mostrar a lista inteira só
     faria o sheet virar uma página rolável. */
  const showPicker = !creatingHabit && (!editing || swapping);

  /* Botão desabilitado avisa que falta algo; botão que não faz nada ao ser
     tocado parece app quebrado. */
  const canSave = creatingHabit
    ? Boolean(newName.trim() && newCat)
    : Boolean(habitId);

  function pickHabit(id: string) {
    setHabitId(id);
    setVariantId("");
    setSwapping(false);
  }

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
        : [...prev, day],
    );
  }

  function save() {
    let hid = habitId;
    let vid = variantId;
    if (creatingHabit) {
      const name = newName.trim();
      if (!name || !newCat) return;
      hid = addHabit({ categoryId: newCat, name });
      const kit = VARIANT_PRESETS.find((p) => p.id === preset);
      const created = (kit?.variants ?? []).map((v) =>
        addVariant(hid, v.name, [...v.items]),
      );
      vid = created[0] ?? "";
    }
    if (!hid || days.length === 0) return;

    const payload = {
      habitId: hid,
      startTime,
      durationMinutes: duration,
      ...(vid ? { variantId: vid } : {}),
    };

    if (editing) {
      updateRoutineSlot(editing.id, { ...payload, weekday: days[0] });
    } else {
      for (const day of days) addRoutineSlot({ ...payload, weekday: day });
    }
    onClose();
  }

  /** Segurar num chip da lista de atividades exclui aquela atividade. */
  async function removeHabitById(id: string) {
    const target = data.habits.find((h) => h.id === id);
    if (!target) return;
    const count = data.routineSlots.filter((s) => s.habitId === id).length;
    const extra =
      target.variants.length > 0
        ? ` e as ${target.variants.length} variações`
        : "";
    const ok = await ask({
      title: `Excluir “${target.name}” do app?`,
      message:
        count === 0
          ? `Sai da biblioteca${extra}.`
          : `Saem os ${count} ${count === 1 ? "bloco" : "blocos"} da semana${extra}, com o histórico.`,
      confirmLabel: "Excluir do app inteiro",
      destructive: true,
    });
    if (!ok) return;
    if (habitId === id) setHabitId("");
    destructive(`${target.name} excluída`, () => deleteHabit(id));
  }

  /** Segurar num chip de variação exclui a variação (com desfazer). */
  async function removeVariant(v: HabitVariant) {
    if (!habit) return;
    const ok = await ask({
      title: `Excluir a variação “${v.name}”?`,
      message:
        "Os blocos que usam ela continuam na semana, só ficam sem variação.",
      confirmLabel: "Excluir variação",
      destructive: true,
    });
    if (!ok) return;
    if (variantId === v.id) setVariantId("");
    destructive(`${v.name} excluída`, () => deleteVariant(habit.id, v.id));
  }

  /** Some com o bloco, mas a atividade continua na biblioteca. */
  async function removeSlot() {
    if (!editing) return;
    const ok = await ask({
      title: "Tirar da semana?",
      message: `“${habit?.name ?? "Este bloco"}” sai deste horário. A atividade continua na sua biblioteca.`,
      confirmLabel: "Tirar da semana",
      destructive: true,
    });
    if (!ok) return;
    deleteRoutineSlot(editing.id);
    onClose();
  }

  /** Some com a atividade inteira: biblioteca, blocos, variações e histórico. */
  async function removeHabit() {
    if (!habit) return;
    const count = data.routineSlots.filter(
      (s) => s.habitId === habit.id,
    ).length;
    const extra =
      habit.variants.length > 0
        ? ` e as ${habit.variants.length} variações (${habit.variants
            .map((v) => v.name)
            .join(", ")})`
        : "";
    const ok = await ask({
      title: `Excluir a atividade “${habit.name}” do app?`,
      message: `Não é só este bloco: saem os ${count} ${
        count === 1 ? "bloco" : "blocos"
      } da semana${extra}. Pra tirar só deste horário, use “Tirar da semana”.`,
      confirmLabel: "Excluir do app inteiro",
      destructive: true,
    });
    if (!ok) return;
    const name = habit.name;
    destructive(`${name} excluída`, () => deleteHabit(habit.id));
    onClose();
  }

  return (
    <>
      <Sheet
        open={open}
        title={editing ? "Editar bloco" : "Novo bloco"}
        onClose={onClose}
        /* Só duas ações aqui, e nenhuma delas apaga a atividade do app: o
         "Excluir atividade" mora lá em cima, junto da atividade que ele
         apaga. Antes os dois eram botões gêmeos e dava pra trocar um pelo
         outro sem perceber. */
        footer={
          <div className="space-y-2">
            <button
              onClick={save}
              disabled={!canSave}
              className="press w-full rounded-md2 bg-white py-3 text-sm font-semibold text-ink-950 disabled:opacity-40"
            >
              {editing
                ? "Salvar"
                : days.length > 1
                  ? `Adicionar em ${days.length} dias`
                  : "Adicionar"}
            </button>

            {editing && (
              <button
                onClick={removeSlot}
                className="press flex w-full items-center justify-center gap-1.5 rounded-md2 border border-white/10 py-2.5 text-[13px] font-semibold text-white/60"
              >
                <Icon name="close" size={14} /> Tirar da semana
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          {creatingHabit ? (
            <>
              <Field
                label="Nova atividade"
                action={
                  options.length > 0
                    ? {
                        label: "Usar existente",
                        onPress: () => setCreatingHabit(false),
                      }
                    : undefined
                }
              >
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Academia"
                  className="field"
                />
              </Field>
              <Field label="Categoria">
                <div className="flex flex-wrap gap-2">
                  {cats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setNewCat(c.id)}
                      className="press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                      style={{
                        backgroundColor:
                          newCat === c.id ? c.color : "rgba(255,255,255,0.06)",
                        color:
                          newCat === c.id
                            ? contrastInk(c.color)
                            : "rgba(255,255,255,0.5)",
                      }}
                    >
                      <Icon name={c.icon} size={13} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </Field>

              {/* A atividade só existe depois de salvar, então aqui a variação
                  é uma escolha de kit — sem isso, criar "Academia" nunca dava
                  chance de escolher Treino A/B/C na mesma tela. */}
              <Field label="Variações">
                <div className="flex flex-wrap gap-2">
                  {VARIANT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={`press rounded-full px-3 py-1.5 text-sm font-medium ${
                        preset === p.id
                          ? "bg-white text-ink-950"
                          : "bg-ink-800 text-white/50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] leading-relaxed text-white/35">
                  Dá pra mudar depois: cada variação é editável, e segurar em cima
                  exclui.
                </p>
              </Field>
            </>
          ) : showPicker ? (
            <Field
              label="Atividade"
              action={
                editing
                  ? { label: "Cancelar", onPress: () => setSwapping(false) }
                  : undefined
              }
            >
              <div className="flex flex-wrap gap-2">
                {options.map(({ habit: h, category: cat }) => {
                  const color = cat?.color ?? "#ffffff";
                  const on = habitId === h.id;
                  return (
                    <LongPressChip
                      key={h.id}
                      onSelect={() => pickHabit(h.id)}
                      onLongPress={() => removeHabitById(h.id)}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
                      style={
                        on
                          ? {
                              backgroundColor: color,
                              borderColor: color,
                              color: contrastInk(color),
                            }
                          : {
                              backgroundColor: `${color}14`,
                              borderColor: `${color}40`,
                              color: "rgba(255,255,255,0.78)",
                            }
                      }
                    >
                      {cat && <Icon name={cat.icon} size={13} />}
                      {h.name}
                    </LongPressChip>
                  );
                })}
                <button
                  onClick={() => setCreatingHabit(true)}
                  className="press flex items-center gap-1 rounded-full border border-dashed border-white/25 px-3 py-1.5 text-sm text-white/55"
                >
                  <Icon name="plus" size={13} /> Nova
                </button>
              </div>
              <p className="text-[11px] text-white/30">
                Segure numa atividade pra excluir.
              </p>
            </Field>
          ) : (
            <Field
              label="Atividade"
              action={{ label: "Trocar", onPress: () => setSwapping(true) }}
            >
              <div className="row">
                {category && (
                  <Icon
                    name={category.icon}
                    size={17}
                    style={{ color: category.color }}
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                  {habit?.name ?? "—"}
                </span>
                <button
                  onClick={removeHabit}
                  disabled={!habit}
                  aria-label={`Excluir ${habit?.name ?? ""} do app`}
                  className="press -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/30 active:text-red-400 disabled:opacity-30"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-white/30">
                A lixeira apaga “{habit?.name ?? "a atividade"}” do app inteiro.
                Pra tirar só deste horário, use “Tirar da semana” ali embaixo.
              </p>
            </Field>
          )}

          {/* Sempre visível com uma atividade escolhida: sem isso, uma atividade
            recém-criada não tem como ganhar Treino A/B/C sem ir nos Ajustes. */}
          {habit && !creatingHabit && (
            <Field label="Variação">
              <div className="flex flex-wrap gap-2">
                {variants.length > 0 && (
                  <button
                    onClick={() => setVariantId("")}
                    className={`press rounded-full px-3 py-1.5 text-sm font-medium ${
                      variantId === ""
                        ? "bg-white text-ink-950"
                        : "bg-ink-800 text-white/50"
                    }`}
                  >
                    Nenhuma
                  </button>
                )}
                {variants.map((v) => (
                  <LongPressChip
                    key={v.id}
                    onSelect={() => setVariantId(v.id)}
                    onLongPress={() => removeVariant(v)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      variantId === v.id
                        ? "bg-white text-ink-950"
                        : "bg-ink-800 text-white/50"
                    }`}
                  >
                    {v.name}
                  </LongPressChip>
                ))}
                <button
                  onClick={() => {
                    setEditingVariant(null);
                    setVariantSheet(true);
                  }}
                  className="press flex items-center gap-1 rounded-full border border-dashed border-white/25 px-3 py-1.5 text-sm text-white/55"
                >
                  <Icon name="plus" size={13} /> Nova
                </button>
              </div>
              {variants.length === 0 ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const ids = DEFAULT_GYM_VARIANTS.map((v) =>
                        addVariant(habit.id, v.name, [...v.items]),
                      );
                      setVariantId(ids[0]);
                    }}
                    className="press text-[11px] font-medium text-white/45 underline underline-offset-2"
                  >
                    criar Treino A · B · C
                  </button>
                  <button
                    onClick={() => {
                      const ids = DEFAULT_JIU_VARIANTS.map((v) =>
                        addVariant(habit.id, v.name, [...v.items]),
                      );
                      setVariantId(ids[0]);
                    }}
                    className="press text-[11px] font-medium text-white/45 underline underline-offset-2"
                  >
                    criar No-gi · Gi · Livre
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-white/30">
                  Toque pra escolher, segure pra excluir a variação.
                </p>
              )}
            </Field>
          )}

          <Field label={editing ? "Dia" : "Dias"}>
            <div className="flex gap-1.5">
              {WEEKDAYS_MON_FIRST.map((day, i) => {
                const active = days.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`flex-1 rounded-md2 py-2 text-[11px] font-semibold ${
                      active
                        ? "bg-white text-ink-950"
                        : "bg-ink-800 text-white/45"
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
              parseTime(startTime) + duration,
            )}`}
          >
            <input
              type="time"
              step={900}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="field [color-scheme:dark]"
            />
          </Field>

          <Field label="Duração">
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`press rounded-full px-3 py-1.5 text-sm font-medium ${
                    duration === d
                      ? "bg-white text-ink-950"
                      : "bg-ink-800 text-white/50"
                  }`}
                >
                  {prettyDuration(d)}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Sheet>

      {habit && (
        <VariantSheet
          open={variantSheet}
          habitId={habit.id}
          editing={editingVariant}
          onClose={() => setVariantSheet(false)}
        />
      )}
    </>
  );
}

function Field({
  label,
  action,
  children,
}: {
  label: string;
  /** Ação secundária no canto do rótulo (Trocar, Cancelar). */
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="block text-xs font-medium uppercase tracking-wide text-white/45">
          {label}
        </label>
        {action && (
          <button
            onClick={action.onPress}
            className="press shrink-0 text-xs font-semibold text-white/60"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
