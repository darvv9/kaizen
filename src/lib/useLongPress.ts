import { useCallback, useEffect, useRef, useState } from "react";

const HOLD_MS = 450;
/** Deslizou mais que isso? Era rolagem, não toque longo. */
const MOVE_TOLERANCE = 8;

interface Options {
  onLongPress: () => void;
  onClick?: () => void;
}

/**
 * Segurar abre o menu; tocar faz a ação normal. O `onClick` só dispara quando o
 * toque longo não disparou — senão soltar o dedo executaria as duas coisas.
 */
export function useLongPress({ onLongPress, onClick }: Options) {
  const timer = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const fired = useRef(false);
  const [pressing, setPressing] = useState(false);

  const stop = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setPressing(false);
  }, []);

  useEffect(() => stop, [stop]);

  return {
    pressing,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        fired.current = false;
        origin.current = { x: e.clientX, y: e.clientY };
        setPressing(true);
        timer.current = window.setTimeout(() => {
          timer.current = null;
          setPressing(false);
          fired.current = true;
          onLongPress();
        }, HOLD_MS);
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (timer.current === null) return;
        if (
          Math.abs(e.clientX - origin.current.x) > MOVE_TOLERANCE ||
          Math.abs(e.clientY - origin.current.y) > MOVE_TOLERANCE
        ) {
          stop();
        }
      },
      onPointerUp: stop,
      onPointerCancel: stop,
      onClick: (e: React.MouseEvent) => {
        if (fired.current) {
          fired.current = false;
          e.preventDefault();
          return;
        }
        onClick?.();
      },
    },
  };
}
