import { useEffect, useState } from "react";
import { media } from "../data/media";

export type MediaUrlState = "idle" | "loading" | "ready" | "missing" | "error";

/**
 * Object URL do vídeo, revogada no cleanup.
 *
 * A URL vive numa variável local do efeito de propósito: revogar a que está no
 * state faz o vídeo sumir no StrictMode (monta → desmonta → monta) só em dev.
 */
export function useMediaUrl(id: string | null): { url: string | null; state: MediaUrlState } {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<MediaUrlState>("idle");

  useEffect(() => {
    if (!id) {
      setUrl(null);
      setState("idle");
      return;
    }

    let cancelled = false;
    let created: string | null = null;
    setState("loading");

    media
      .get(id)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setState("missing");
          return;
        }
        created = URL.createObjectURL(blob);
        setUrl(created);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
      setUrl(null);
    };
  }, [id]);

  return { url, state };
}
