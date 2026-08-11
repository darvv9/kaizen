import { AnimatePresence, motion } from "framer-motion";
import { Overlay } from "./Overlay";
import { useFeedback } from "../store/useFeedback";
import { LAYER } from "../lib/layers";

export function Feedback() {
  const toasts = useFeedback((s) => s.toasts);

  return (
    <Overlay>
      <div
        style={{ zIndex: LAYER.toast, paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
        className="pointer-events-none fixed inset-x-0 top-0 flex flex-col items-center gap-2 px-4"
      >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`glass max-w-full truncate rounded-full border px-4 py-2 text-sm font-semibold shadow-glow ${
              t.tone === "error"
                ? "border-red-500/30 text-red-300"
                : "border-white/10 text-white"
            }`}
          >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Overlay>
  );
}
