import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./Icon";
import { useStore } from "../store/useStore";
import { ask } from "../store/useConfirm";
import { LAYER } from "../lib/layers";
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
      z={LAYER.sheetOverSheet}
      title={editing ? "Editar variação" : "Nova variação"}
      variant="full"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          {editing && (
            <button
              onClick={async () => {
                const ok = await ask({
                  title: `Excluir “${editing.name}”?`,
                  message:
                    "Os blocos que usam essa variação continuam na semana, só ficam sem ela.",
                  confirmLabel: "Excluir variação",
                  destructive: true,
                });
                if (!ok) return;
                deleteVariant(habitId, editing.id);
                onClose();
              }}
              className="press flex items-center gap-1.5 rounded-md2 border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400"
            >
              <Icon name="trash" size={16} /> Excluir
            </button>
          )}
          <button
            onClick={save}
            disabled={!name.trim()}
            className="press flex-1 rounded-md2 bg-accent py-3 text-sm font-semibold text-ink-950 disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      }
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
            className="field"
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
            placeholder={
              "Supino reto 4x10\nDesenvolvimento 3x12\nTríceps corda 4x12"
            }
            className="w-full resize-none rounded-md2 bg-ink-800 px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25"
          />
          <p className="text-[11px] text-white/35">
            Uma linha por exercício. Deixe vazio se não se aplica (ex:
            modalidade do jiu).
          </p>
        </div>
      </div>
    </Sheet>
  );
}
