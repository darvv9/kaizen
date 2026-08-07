import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./Icon";
import { useStore } from "../store/useStore";
import type { HabitVariant } from "../types";

interface Props {
  open: boolean;
  habitId: string;
  editing: HabitVariant | null;
  onClose: () => void;
}

export function VariantSheet({ open, habitId, editing, onClose }: Props) {
  const addVariant = useStore((s) => s.addVariant);
  const updateVariant = useStore((s) => s.updateVariant);
  const deleteVariant = useStore((s) => s.deleteVariant);

  const [name, setName] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setText((editing?.items ?? []).join("\n"));
  }, [open]);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const items = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (editing) updateVariant(habitId, editing.id, { name: trimmed, items });
    else addVariant(habitId, trimmed, items);
    onClose();
  }

  return (
    <Sheet
      open={open}
      z={62}
      title={editing ? "Editar variação" : "Nova variação"}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-white/45">
            Nome
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Treino A"
            className="w-full rounded-xl bg-ink-800 px-4 py-3 text-white outline-none placeholder:text-white/30"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-white/45">
            Composição
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder={"Supino reto 4x10\nDesenvolvimento 3x12\nTríceps corda 4x12"}
            className="w-full resize-none rounded-xl bg-ink-800 px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25"
          />
          <p className="text-[11px] text-white/35">
            Uma linha por exercício. Deixe vazio se não se aplica (ex: modalidade do jiu).
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          {editing && (
            <button
              onClick={() => {
                if (confirm(`Excluir a variação "${editing.name}"?`)) {
                  deleteVariant(habitId, editing.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400"
            >
              <Icon name="trash" size={16} /> Excluir
            </button>
          )}
          <button
            onClick={save}
            disabled={!name.trim()}
            className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </div>
    </Sheet>
  );
}
