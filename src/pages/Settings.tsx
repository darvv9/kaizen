import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { useFeedback } from "../store/useFeedback";
import { Sheet } from "../components/Sheet";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../data/defaults";
import { isLightColor } from "../lib/color";
import type { Habit } from "../types";

export function Settings() {
  const data = useStore((s) => s.data);
  const addHabit = useStore((s) => s.addHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const addCategory = useStore((s) => s.addCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetData = useStore((s) => s.resetData);
  const push = useFeedback((s) => s.push);

  const [habitSheet, setHabitSheet] = useState(false);
  const [catSheet, setCatSheet] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cats = [...data.categories].sort((a, b) => a.order - b.order);

  function openNewHabit() {
    setEditing(null);
    setHabitSheet(true);
  }
  function openEditHabit(h: Habit) {
    setEditing(h);
    setHabitSheet(true);
  }

  function handleExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaizen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push("Backup exportado", "xp");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      push(ok ? "Backup restaurado" : "Arquivo inválido", ok ? "level" : "xp");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">Ajustes</div>
        <h1 className="text-2xl font-bold text-white">Biblioteca</h1>
        <p className="mt-1 text-sm text-white/45">
          Atividades e categorias. Horários ficam na aba Rotina.
        </p>
      </header>

      <div className="flex gap-3">
        <button
          onClick={openNewHabit}
          className="flex-1 rounded-2xl bg-accent py-3 text-sm font-semibold text-ink-950 shadow-glow"
        >
          + Hábito
        </button>
        <button
          onClick={() => setCatSheet(true)}
          className="flex-1 rounded-2xl bg-ink-700 py-3 text-sm font-semibold text-white"
        >
          + Categoria
        </button>
      </div>

      <div className="space-y-5">
        {cats.map((cat) => {
          const habits = data.habits.filter((h) => h.categoryId === cat.id);
          return (
            <section key={cat.id} className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-semibold text-white">{cat.name}</span>
                <span
                  className="ml-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <button
                  onClick={() => {
                    if (confirm(`Excluir categoria "${cat.name}" e seus hábitos?`)) {
                      deleteCategory(cat.id);
                    }
                  }}
                  className="ml-auto text-xs text-white/40 hover:text-red-400"
                >
                  excluir
                </button>
              </div>
              <div className="space-y-2">
                {habits.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => openEditHabit(h)}
                    className="flex w-full items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-left"
                  >
                    <span className="flex-1 text-sm text-white/90">{h.name}</span>
                    <span className="text-xs text-white/40">
                      {data.routineSlots.filter((s) => s.habitId === h.id).length} na rotina
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: `${cat.color}1f`, color: cat.color }}
                    >
                      +{h.xp}
                    </span>
                  </button>
                ))}
                {habits.length === 0 && (
                  <div className="px-1 py-2 text-xs text-white/35">Sem hábitos ainda.</div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-white/80">Backup</h2>
        <p className="text-xs leading-relaxed text-white/45">
          Seus dados ficam salvos só neste dispositivo. Exporte um backup para não
          perder nada (a sincronização na nuvem chega no futuro).
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 rounded-xl bg-ink-700 py-2.5 text-sm font-medium text-white"
          >
            Exportar
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-xl bg-ink-700 py-2.5 text-sm font-medium text-white"
          >
            Importar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        <button
          onClick={() => {
            if (confirm("Resetar tudo para o padrão? Isso apaga seu progresso.")) {
              resetData();
              push("App resetado", "xp");
            }
          }}
          className="w-full rounded-xl border border-red-500/30 py-2.5 text-sm font-medium text-red-400"
        >
          Resetar tudo
        </button>
      </section>

      <p className="pb-4 text-center text-xs text-white/25">Kaizen · 改善</p>

      <HabitSheet
        open={habitSheet}
        editing={editing}
        onClose={() => setHabitSheet(false)}
        onSave={(payload) => {
          if (editing) {
            updateHabit(editing.id, payload);
          } else {
            addHabit(payload);
          }
          setHabitSheet(false);
        }}
        onDelete={
          editing
            ? () => {
                deleteHabit(editing.id);
                setHabitSheet(false);
              }
            : undefined
        }
      />

      <CategorySheet
        open={catSheet}
        onClose={() => setCatSheet(false)}
        onSave={(payload) => {
          addCategory(payload);
          setCatSheet(false);
        }}
      />
    </div>
  );
}

interface HabitPayload {
  categoryId: string;
  name: string;
  xp: number;
  target: number;
}

function HabitSheet({
  open,
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  editing: Habit | null;
  onClose: () => void;
  onSave: (p: HabitPayload) => void;
  onDelete?: () => void;
}) {
  const cats = useStore((s) => [...s.data.categories].sort((a, b) => a.order - b.order));

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(cats[0]?.id ?? "");
  const [xp, setXp] = useState(20);

  const lastKey = useRef<string>("");
  const key = `${open}-${editing?.id ?? "new"}`;
  if (open && key !== lastKey.current) {
    lastKey.current = key;
    setName(editing?.name ?? "");
    setCategoryId(editing?.categoryId ?? cats[0]?.id ?? "");
    setXp(editing?.xp ?? 20);
  }

  const valid = name.trim().length > 0 && categoryId;

  return (
    <Sheet open={open} title={editing ? "Editar hábito" : "Novo hábito"} onClose={onClose}>
      <div className="space-y-5">
        <Field label="Nome">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Treino de força"
            className="w-full rounded-xl bg-ink-800 px-4 py-3 text-white outline-none placeholder:text-white/30"
          />
        </Field>

        <Field label="Categoria">
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="rounded-full px-3 py-1.5 text-sm transition"
                style={{
                  backgroundColor:
                    categoryId === c.id ? c.color : "rgba(255,255,255,0.06)",
                  color:
                    categoryId === c.id
                      ? isLightColor(c.color)
                        ? "#08080a"
                        : "#ffffff"
                      : "rgba(255,255,255,0.5)",
                }}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Recompensa: ${xp} XP`}>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </Field>

        <p className="text-xs leading-relaxed text-white/40">
          Para definir dias e horários, use a aba Rotina depois de salvar.
        </p>

        <div className="flex gap-3 pt-1">
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400"
            >
              Excluir
            </button>
          )}
          <button
            disabled={!valid}
            onClick={() => onSave({ categoryId, name, xp, target: 1 })}
            className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function CategorySheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (p: { name: string; color: string; icon: string }) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);

  const lastOpen = useRef(false);
  if (open && !lastOpen.current) {
    lastOpen.current = true;
    setName("");
    setColor(CATEGORY_COLORS[0]);
    setIcon(CATEGORY_ICONS[0]);
  }
  if (!open) lastOpen.current = false;

  return (
    <Sheet open={open} title="Nova categoria" onClose={onClose}>
      <div className="space-y-5">
        <Field label="Nome">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Meditação"
            className="w-full rounded-xl bg-ink-800 px-4 py-3 text-white outline-none placeholder:text-white/30"
          />
        </Field>

        <Field label="Ícone">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                  icon === ic ? "bg-accent" : "bg-ink-800"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Cor">
          <div className="flex flex-wrap gap-2.5">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-ink-850 transition"
                style={{
                  backgroundColor: c,
                  // @ts-expect-error css var
                  "--tw-ring-color": color === c ? c : "transparent",
                }}
              />
            ))}
          </div>
        </Field>

        <button
          disabled={!name.trim()}
          onClick={() => onSave({ name, color, icon })}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:opacity-40"
        >
          Criar categoria
        </button>
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
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
