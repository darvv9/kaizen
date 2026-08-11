import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useFeedback } from "../store/useFeedback";
import { ask } from "../store/useConfirm";
import { Sheet } from "../components/Sheet";
import { Icon } from "../components/Icon";
import { VariantSheet } from "../components/VariantSheet";
import { CATEGORY_COLORS } from "../data/defaults";
import { CATEGORY_ICON_NAMES, type IconName } from "../icons/names";
import { contrastInk } from "../lib/color";
import { storage } from "../data/storage";
import { media } from "../data/media";
import { formatBytes } from "../lib/physique";
import { requestNotificationPermission, supportsBadge } from "../lib/badge";
import type { AppData, Category, Habit, HabitVariant } from "../types";

/** O que some junto com uma atividade — o texto da confirmação sai daqui. */
function habitImpact(data: AppData, habitId: string) {
  const slots = data.routineSlots.filter((s) => s.habitId === habitId).length;
  return slots === 0
    ? "Ela não está em nenhum dia da semana."
    : `Sai de ${slots} ${slots === 1 ? "bloco" : "blocos"} da semana, com o histórico.`;
}

export function Settings() {
  const data = useStore((s) => s.data);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetData = useStore((s) => s.resetData);
  const push = useFeedback((s) => s.push);

  const [habitSheet, setHabitSheet] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [catSheet, setCatSheet] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [legacy, setLegacy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setLegacy(storage.hasLegacy()), []);

  const cats = [...data.categories].sort((a, b) => a.order - b.order);

  async function removeHabit(habit: Habit) {
    const ok = await ask({
      title: `Excluir “${habit.name}”?`,
      message: `${habitImpact(data, habit.id)} Não dá pra desfazer.`,
      confirmLabel: "Excluir atividade",
      destructive: true,
    });
    if (!ok) return;
    deleteHabit(habit.id);
    push(`${habit.name} excluída`, "success");
  }

  async function removeCategory(cat: Category) {
    const habits = data.habits.filter((h) => h.categoryId === cat.id);
    const slots = data.routineSlots.filter((s) =>
      habits.some((h) => h.id === s.habitId)
    ).length;
    const ok = await ask({
      title: `Excluir a categoria “${cat.name}”?`,
      message:
        habits.length === 0
          ? "Ela está vazia."
          : `Vão junto ${habits.length} ${
              habits.length === 1 ? "atividade" : "atividades"
            } e ${slots} ${slots === 1 ? "bloco" : "blocos"} da semana.`,
      confirmLabel: "Excluir tudo",
      destructive: true,
    });
    if (!ok) return;
    deleteCategory(cat.id);
    setCatSheet(false);
    push(`${cat.name} excluída`, "success");
  }

  function handleExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaizen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    push("Backup exportado", "success");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      push(ok ? "Backup restaurado" : "Arquivo inválido", ok ? "success" : "error");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Ajustes</div>
        <h1 className="text-xl font-bold text-white">Biblioteca</h1>
        <p className="mt-1 text-sm text-white/45">
          Atividades, variações e categorias. Dias e horários ficam na Semana.
        </p>
      </header>

      <div className="flex gap-3">
        <button
          disabled={cats.length === 0}
          onClick={() => {
            setEditingHabit(null);
            setHabitSheet(true);
          }}
          className="press flex flex-1 items-center justify-center gap-1.5 rounded-md2 bg-accent py-3 text-sm font-semibold text-ink-950 disabled:opacity-40"
        >
          <Icon name="plus" size={15} /> Atividade
        </button>
        <button
          onClick={() => {
            setEditingCat(null);
            setCatSheet(true);
          }}
          className="press flex flex-1 items-center justify-center gap-1.5 rounded-md2 bg-ink-700 py-3 text-sm font-semibold text-white"
        >
          <Icon name="plus" size={15} /> Categoria
        </button>
      </div>

      <div className="space-y-4">
        {cats.map((cat) => {
          const habits = data.habits.filter((h) => h.categoryId === cat.id);
          return (
            <section key={cat.id} className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Icon name={cat.icon} size={17} style={{ color: cat.color }} />
                <span className="min-w-0 flex-1 truncate font-semibold text-white">
                  {cat.name}
                </span>
                <button
                  onClick={() => {
                    setEditingCat(cat);
                    setCatSheet(true);
                  }}
                  aria-label={`Editar ${cat.name}`}
                  className="press flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/50"
                >
                  <Icon name="pencil" size={14} />
                </button>
                <button
                  onClick={() => removeCategory(cat)}
                  aria-label={`Excluir ${cat.name}`}
                  className="press flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/35 active:text-red-400"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {habits.map((h) => (
                  <div key={h.id} className="row gap-2">
                    <button
                      onClick={() => {
                        setEditingHabit(h);
                        setHabitSheet(true);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-white/90">
                        {h.name}
                      </span>
                      {h.variants.length > 0 && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: `${cat.color}1f`, color: cat.color }}
                        >
                          {h.variants.length}{" "}
                          {h.variants.length === 1 ? "variação" : "variações"}
                        </span>
                      )}
                      <span className="shrink-0 text-[11px] text-white/35">
                        {data.routineSlots.filter((s) => s.habitId === h.id).length} na semana
                      </span>
                    </button>
                    <button
                      onClick={() => removeHabit(h)}
                      aria-label={`Excluir ${h.name}`}
                      className="press -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/30 active:text-red-400"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
                {habits.length === 0 && (
                  <div className="px-1 py-2 text-xs text-white/35">Sem atividades ainda.</div>
                )}
              </div>
            </section>
          );
        })}

        {cats.length === 0 && (
          <div className="card px-6 py-8 text-center text-sm text-white/45">
            Sem categorias. Crie uma para começar a montar suas atividades.
          </div>
        )}
      </div>

      <PhysiqueSettings />

      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-white/80">Backup</h2>
        <p className="text-xs leading-relaxed text-white/45">
          Seus dados ficam só neste aparelho. O backup guarda a rotina e as datas dos vídeos —
          os vídeos em si não cabem no arquivo; para guardar um vídeo, use Baixar na tela Físico.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="press flex-1 rounded-md2 bg-ink-700 py-2.5 text-sm font-medium text-white"
          >
            Exportar
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="press flex-1 rounded-md2 bg-ink-700 py-2.5 text-sm font-medium text-white"
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
        {legacy && (
          <div className="flex items-center gap-2 rounded-md2 bg-white/[0.04] px-3 py-2.5">
            <span className="flex-1 text-[11px] leading-snug text-white/45">
              Dados da versão antiga continuam guardados neste aparelho.
            </span>
            <button
              onClick={async () => {
                const ok = await ask({
                  title: "Apagar os dados da versão antiga?",
                  message: "Não afeta a rotina atual.",
                  confirmLabel: "Apagar",
                  destructive: true,
                });
                if (!ok) return;
                storage.clearLegacy();
                setLegacy(false);
              }}
              className="press shrink-0 text-[11px] font-medium text-white/40"
            >
              Apagar
            </button>
          </div>
        )}
        <button
          onClick={async () => {
            const ok = await ask({
              title: "Resetar o Kaizen?",
              message: "Sua rotina volta ao padrão de fábrica. Os vídeos ficam.",
              confirmLabel: "Resetar tudo",
              destructive: true,
            });
            if (!ok) return;
            resetData();
            push("App resetado", "success");
          }}
          className="press w-full rounded-md2 border border-red-500/30 py-2.5 text-sm font-medium text-red-400"
        >
          Resetar tudo
        </button>
      </section>

      <p className="pb-2 text-center text-xs text-white/25">
        Kaizen · 改善
        <span className="mt-1 block text-[10px] tabular-nums text-white/20">
          versão {__BUILD_ID__}
        </span>
      </p>

      <HabitSheet
        open={habitSheet}
        editing={editingHabit}
        onClose={() => setHabitSheet(false)}
      />

      <CategorySheet
        open={catSheet}
        editing={editingCat}
        onClose={() => setCatSheet(false)}
        onDelete={removeCategory}
      />
    </div>
  );
}

const INTERVAL_OPTIONS = [7, 14, 21, 30];

function PhysiqueSettings() {
  const physique = useStore((s) => s.data.physique);
  const setPhysiqueInterval = useStore((s) => s.setPhysiqueInterval);
  const clearPhysiqueEntries = useStore((s) => s.clearPhysiqueEntries);
  const setBadgeEnabled = useStore((s) => s.setBadgeEnabled);
  const push = useFeedback((s) => s.push);
  const [used, setUsed] = useState<number | null>(null);
  const badgeEnabled = physique.badgeEnabled === true;

  useEffect(() => {
    media
      .usedBytes()
      .then(setUsed)
      .catch(() => setUsed(null));
  }, [physique.entries.length]);

  return (
    <section className="card space-y-3 p-4">
      <h2 className="text-sm font-semibold text-white/80">Físico</h2>
      <div className="space-y-2">
        <span className="block text-xs font-medium uppercase tracking-wide text-white/45">
          Pedir vídeo a cada
        </span>
        <div className="flex flex-wrap gap-2">
          {INTERVAL_OPTIONS.map((days) => (
            <button
              key={days}
              onClick={() => setPhysiqueInterval(days)}
              className={`press rounded-full px-3 py-1.5 text-sm font-medium ${
                physique.intervalDays === days
                  ? "bg-accent text-ink-950"
                  : "bg-ink-800 text-white/50"
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>
      {supportsBadge() && (
        <div className="space-y-2">
          <button
            onClick={async () => {
              if (badgeEnabled) {
                setBadgeEnabled(false);
                return;
              }
              const ok = await requestNotificationPermission();
              if (!ok) {
                push("Permissão de notificação negada", "error");
                return;
              }
              setBadgeEnabled(true);
            }}
            className="row"
          >
            <span className="flex-1 text-sm text-white/85">Aviso no ícone do app</span>
            <span
              className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${
                badgeEnabled ? "bg-accent" : "bg-ink-600"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white transition-transform ${
                  badgeEnabled ? "translate-x-4" : ""
                }`}
                style={badgeEnabled ? { backgroundColor: "#08080a" } : undefined}
              />
            </span>
          </button>
          <p className="text-[11px] leading-relaxed text-white/35">
            Bolinha no ícone quando o vídeo vencer. Só funciona com o Kaizen instalado na tela
            de início, e atualiza quando você abre o app — notificação de verdade precisaria de
            um servidor.
          </p>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-white/40">
        {physique.entries.length} vídeo(s)
        {used !== null && used > 0 ? ` · ${formatBytes(used)} neste aparelho` : ""}.
      </p>
      {physique.entries.length > 0 && (
        <button
          onClick={async () => {
            const ok = await ask({
              title: "Apagar todos os vídeos?",
              message: `${physique.entries.length} vídeo(s) saem deste aparelho. Não dá pra desfazer.`,
              confirmLabel: "Apagar tudo",
              destructive: true,
            });
            if (!ok) return;
            const ids = clearPhysiqueEntries();
            await media.removeMany(ids).catch(() => {});
            setUsed(0);
            push("Vídeos apagados", "success");
          }}
          className="press w-full rounded-md2 border border-red-500/30 py-2.5 text-sm font-medium text-red-400"
        >
          Apagar todos os vídeos
        </button>
      )}
    </section>
  );
}

function HabitSheet({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: Habit | null;
  onClose: () => void;
}) {
  const data = useStore((s) => s.data);
  const addHabit = useStore((s) => s.addHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const addVariant = useStore((s) => s.addVariant);

  const cats = [...data.categories].sort((a, b) => a.order - b.order);
  const habit = data.habits.find((h) => h.id === editing?.id) ?? null;

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [variantSheet, setVariantSheet] = useState(false);
  const [editingVariant, setEditingVariant] = useState<HabitVariant | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setCategoryId(editing?.categoryId ?? cats[0]?.id ?? "");
    setVariantSheet(false);
    setEditingVariant(null);
  }, [open]);

  const valid = name.trim().length > 0 && categoryId;

  function save() {
    if (!valid) return;
    if (editing) updateHabit(editing.id, { name: name.trim(), categoryId });
    else addHabit({ categoryId, name });
    onClose();
  }

  async function remove() {
    if (!editing) return;
    const ok = await ask({
      title: `Excluir “${editing.name}”?`,
      message: `${habitImpact(data, editing.id)} Não dá pra desfazer.`,
      confirmLabel: "Excluir atividade",
      destructive: true,
    });
    if (!ok) return;
    deleteHabit(editing.id);
    onClose();
  }

  return (
    <>
      <Sheet
        open={open}
        title={editing ? "Editar atividade" : "Nova atividade"}
        onClose={onClose}
      >
        <div className="space-y-5">
          <Field label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Academia"
              className="field"
            />
          </Field>

          <Field label="Categoria">
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className="press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                  style={{
                    backgroundColor:
                      categoryId === c.id ? c.color : "rgba(255,255,255,0.06)",
                    color:
                      categoryId === c.id ? contrastInk(c.color) : "rgba(255,255,255,0.5)",
                  }}
                >
                  <Icon name={c.icon} size={13} />
                  {c.name}
                </button>
              ))}
            </div>
          </Field>

          {habit ? (
            <Field label="Variações">
              <div className="flex flex-wrap gap-2">
                {habit.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setEditingVariant(v);
                      setVariantSheet(true);
                    }}
                    className="press rounded-full bg-ink-800 px-3 py-1.5 text-sm text-white/75"
                  >
                    {v.name}
                    {v.items.length > 0 && (
                      <span className="ml-1.5 text-[11px] text-white/35">
                        {v.items.length}
                      </span>
                    )}
                  </button>
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
              {habit.variants.length === 0 && (
                <button
                  onClick={() => {
                    addVariant(habit.id, "Treino A");
                    addVariant(habit.id, "Treino B");
                    addVariant(habit.id, "Treino C");
                  }}
                  className="mt-1 text-[11px] font-medium text-white/45 underline underline-offset-2"
                >
                  criar Treino A · B · C
                </button>
              )}
              <p className="text-[11px] leading-relaxed text-white/35">
                Ex: Treino A/B/C na academia, No-gi/Gi no jiu. A composição de cada uma fica
                guardada aqui.
              </p>
            </Field>
          ) : (
            <p className="text-xs leading-relaxed text-white/40">
              Salve para configurar as variações (Treino A/B/C, No-gi/Gi).
            </p>
          )}

          <div className="flex gap-3 pt-1">
            {editing && (
              <button
                onClick={remove}
                className="press flex items-center gap-1.5 rounded-md2 border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400"
              >
                <Icon name="trash" size={16} /> Excluir
              </button>
            )}
            <button
              disabled={!valid}
              onClick={save}
              className="press flex-1 rounded-md2 bg-accent py-3 text-sm font-semibold text-ink-950 disabled:opacity-40"
            >
              Salvar
            </button>
          </div>
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

function CategorySheet({
  open,
  editing,
  onClose,
  onDelete,
}: {
  open: boolean;
  editing: Category | null;
  onClose: () => void;
  onDelete: (cat: Category) => void;
}) {
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);

  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<IconName>(CATEGORY_ICON_NAMES[0]);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setColor(editing?.color ?? CATEGORY_COLORS[0]);
    setIcon(editing?.icon ?? CATEGORY_ICON_NAMES[0]);
  }, [open]);

  function save() {
    if (!name.trim()) return;
    if (editing) updateCategory(editing.id, { name: name.trim(), color, icon });
    else addCategory({ name, color, icon });
    onClose();
  }

  return (
    <Sheet
      open={open}
      title={editing ? "Editar categoria" : "Nova categoria"}
      onClose={onClose}
    >
      <div className="space-y-5">
        <Field label="Nome">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Academia"
            className="field"
          />
        </Field>

        <Field label="Ícone">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ICON_NAMES.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                aria-label={ic}
                className={`press flex h-11 w-11 items-center justify-center rounded-md2 ${
                  icon === ic ? "bg-accent text-ink-950" : "bg-ink-800 text-white/70"
                }`}
              >
                <Icon name={ic} size={20} />
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
                aria-label={`Cor ${c}`}
                className="press h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-ink-850"
                style={{
                  backgroundColor: c,
                  // @ts-expect-error css var
                  "--tw-ring-color": color === c ? c : "transparent",
                }}
              />
            ))}
          </div>
        </Field>

        <div className="flex gap-3 pt-1">
          {editing && (
            <button
              onClick={() => onDelete(editing)}
              className="press flex items-center gap-1.5 rounded-md2 border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400"
            >
              <Icon name="trash" size={16} /> Excluir
            </button>
          )}
          <button
            disabled={!name.trim()}
            onClick={save}
            className="press flex-1 rounded-md2 bg-accent py-3 text-sm font-semibold text-ink-950 disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-wide text-white/45">
        {label}
      </label>
      {children}
    </div>
  );
}
