import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useFeedback } from "../store/useFeedback";
import { ask } from "../store/useConfirm";
import { Icon } from "../components/Icon";
import { media, QUOTA_ERROR } from "../data/media";
import { useMediaUrl } from "../lib/useMediaUrl";
import {
  formatBytes,
  physiqueStatus,
  physiqueStatusLabel,
  prettyDayKey,
  relativeDays,
  daysBetween,
} from "../lib/physique";
import { dayKey } from "../lib/date";
import type { PhysiqueEntry } from "../types";

const BIG_FILE_MB = 80;

export function Physique() {
  const data = useStore((s) => s.data);
  const addPhysiqueEntry = useStore((s) => s.addPhysiqueEntry);
  const deletePhysiqueEntry = useStore((s) => s.deletePhysiqueEntry);
  const push = useFeedback((s) => s.push);

  const pickRef = useRef<HTMLInputElement>(null);
  const recordRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [used, setUsed] = useState<number | null>(null);

  const entries = data.physique.entries;
  const current = entries.find((e) => e.id === selectedId) ?? entries[0] ?? null;
  const rest = entries.filter((e) => e.id !== current?.id);
  const status = physiqueStatus(data);

  async function refreshUsage() {
    try {
      setUsed(await media.usedBytes());
    } catch {
      setUsed(null);
    }
  }

  useEffect(() => {
    refreshUsage();
    // Blobs sem entrada correspondente (falha no meio, backup de outro aparelho).
    media
      .list()
      .then((all) => {
        const keep = new Set(useStore.getState().data.physique.entries.map((e) => e.mediaId));
        const orphans = all.filter((m) => !keep.has(m.id)).map((m) => m.id);
        if (orphans.length > 0) return media.removeMany(orphans).then(refreshUsage);
      })
      .catch(() => {});
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;

    setBusy(true);
    try {
      const durationSec = await readDuration(file);
      const mediaId = await media.put(file, durationSec !== undefined ? { durationSec } : {});
      addPhysiqueEntry({
        mediaId,
        durationSec,
        sizeBytes: file.size,
      });
      setSelectedId(null);
      push("Vídeo salvo", "success");
      if (file.size > BIG_FILE_MB * 1024 * 1024) {
        push("Vídeo grande — 1080p e 15s bastam", "info");
      }
      refreshUsage();
    } catch (err) {
      push(
        err instanceof Error && err.message === QUOTA_ERROR
          ? "Sem espaço. Apague um vídeo antigo."
          : "Não deu pra salvar o vídeo.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: PhysiqueEntry) {
    const ok = await ask({
      title: "Excluir este vídeo?",
      message: `${prettyDayKey(entry.date)} sai do histórico e do aparelho.`,
      confirmLabel: "Excluir vídeo",
      destructive: true,
    });
    if (!ok) return;
    const mediaId = deletePhysiqueEntry(entry.id);
    setSelectedId(null);
    if (mediaId) {
      try {
        await media.remove(mediaId);
      } catch {
        // metadado já saiu; blob órfão é limpo na próxima abertura
      }
    }
    refreshUsage();
  }

  async function share(entry: PhysiqueEntry) {
    try {
      const blob = await media.get(entry.mediaId);
      if (!blob) {
        push("Vídeo não está neste aparelho", "error");
        return;
      }
      const ext = blob.type.includes("quicktime") ? "mov" : "mp4";
      const file = new File([blob], `kaizen-${entry.date}.${ext}`, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // cancelar a share sheet cai aqui: não é erro
    }
  }

  const statusTone =
    status.state === "late"
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : status.state === "ok"
      ? "border-white/10 bg-white/[0.06] text-white/60"
      : "border-white/25 bg-white/10 text-white";

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Físico</div>
          <h1 className="text-xl font-bold leading-tight text-white">Evolução</h1>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${statusTone}`}
        >
          {physiqueStatusLabel(status)}
        </span>
      </header>

      {current ? (
        <section className="card overflow-hidden">
          <VideoPlayer mediaId={current.mediaId} />
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold capitalize text-white">
                {prettyDayKey(current.date)}
              </div>
              <div className="text-xs text-white/45">
                {relativeDays(daysBetween(current.date, dayKey()))}
                {current.sizeBytes ? ` · ${formatBytes(current.sizeBytes)}` : ""}
              </div>
            </div>
            <button
              onClick={() => share(current)}
              aria-label="Salvar vídeo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70"
            >
              <Icon name="share" size={16} />
            </button>
            <button
              onClick={() => remove(current)}
              aria-label="Excluir vídeo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-red-400"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        </section>
      ) : (
        <section className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Icon name="film" size={28} className="text-white/30" />
          <p className="text-sm leading-relaxed text-white/50">
            Grave um vídeo curto do seu shape. A cada {data.physique.intervalDays} dias o app
            pede um novo — é assim que dá pra ver a diferença.
          </p>
        </section>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => pickRef.current?.click()}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md2 bg-accent py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:opacity-50"
        >
          <Icon name="plus" size={15} />
          {busy ? "Salvando…" : "Adicionar vídeo"}
        </button>
        <button
          onClick={() => recordRef.current?.click()}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 rounded-md2 bg-ink-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Icon name="camera" size={16} />
          Gravar
        </button>
        <input
          ref={pickRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFile}
        />
        <input
          ref={recordRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {rest.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-white/80">Anteriores</h2>
          {rest.map((entry) => {
            const position = entries.indexOf(entry);
            const newer = entries[position - 1];
            return (
              <HistoryRow
                key={entry.id}
                entry={entry}
                gap={newer ? daysBetween(entry.date, newer.date) : null}
                index={entries.length - position}
                onSelect={() => setSelectedId(entry.id)}
              />
            );
          })}
        </section>
      )}

      <p className="pb-2 text-center text-[11px] leading-relaxed text-white/30">
        {used !== null && used > 0 ? `Vídeos: ${formatBytes(used)} · ` : ""}
        os vídeos ficam só neste aparelho e não entram no backup — use o botão de salvar para
        guardar em Arquivos ou Fotos.
      </p>
    </div>
  );
}

function VideoPlayer({ mediaId }: { mediaId: string }) {
  const { url, state } = useMediaUrl(mediaId);

  if (state === "ready" && url) {
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className="aspect-[9/16] max-h-[52vh] w-full bg-black object-contain"
      />
    );
  }

  return (
    <div className="flex aspect-[9/16] max-h-[42vh] w-full items-center justify-center bg-white/[0.03] text-xs text-white/40">
      {state === "loading" && "Carregando…"}
      {state === "missing" && "Vídeo não está neste aparelho"}
      {state === "error" && "Não deu pra abrir o vídeo"}
    </div>
  );
}

function HistoryRow({
  entry,
  gap,
  index,
  onSelect,
}: {
  entry: PhysiqueEntry;
  gap: number | null;
  index: number;
  onSelect: () => void;
}) {
  const { url, state } = useMediaUrl(entry.mediaId);

  return (
    <button
      onClick={onSelect}
      className="card flex w-full items-center gap-3 p-2.5 text-left"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md2 bg-black">
        {state === "ready" && url ? (
          <video
            src={`${url}#t=0.5`}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon name="film" size={18} className="text-white/25" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium capitalize text-white/90">
          {prettyDayKey(entry.date)}
        </span>
        <span className="block text-[11px] text-white/40">
          #{index}
          {gap !== null ? ` · ${gap} dias depois` : ""}
        </span>
      </span>
      <Icon name="chevron-right" size={15} className="shrink-0 text-white/25" />
    </button>
  );
}

/** Duração do vídeo sem bloquear o salvamento se o metadado não vier. */
function readDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = (value?: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => done(undefined), 3000);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      done(Number.isFinite(video.duration) ? Math.round(video.duration) : undefined);
    };
    video.onerror = () => {
      clearTimeout(timer);
      done(undefined);
    };
    video.src = url;
  });
}
