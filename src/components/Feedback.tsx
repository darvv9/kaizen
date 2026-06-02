import { AnimatePresence, motion } from "framer-motion";
import { useFeedback } from "../store/useFeedback";
import { rankTitle } from "../lib/game";

export function Feedback() {
  const { toasts, levelUp, clearLevelUp } = useFeedback();

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={`glass rounded-full border border-white/10 px-4 py-2 text-sm font-semibold shadow-glow ${
                t.tone === "level"
                  ? "text-accent-soft"
                  : t.tone === "badge"
                  ? "text-amber-300"
                  : "text-white"
              }`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {levelUp !== null && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clearLevelUp}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="card relative flex flex-col items-center gap-3 px-10 py-10 text-center"
            >
              <Sparkles />
              <div className="text-6xl">⬆️</div>
              <div className="text-xs uppercase tracking-[0.25em] text-white/50">
                Subiu de nível
              </div>
              <div className="text-5xl font-bold text-white">Nível {levelUp}</div>
              <div className="text-accent-soft font-medium">{rankTitle(levelUp)}</div>
              <button
                onClick={clearLevelUp}
                className="mt-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-ink-950 shadow-glow"
              >
                Bora
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Sparkles() {
  const dots = Array.from({ length: 10 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((_, i) => {
        const angle = (i / dots.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-accent-soft"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * 120,
              y: Math.sin(angle) * 120,
              opacity: 0,
            }}
            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
