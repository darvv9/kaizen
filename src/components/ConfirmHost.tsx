import { AnimatePresence, motion } from "framer-motion";
import { useConfirm } from "../store/useConfirm";
import { LAYER } from "../lib/layers";

export function ConfirmHost() {
  const request = useConfirm((s) => s.request);
  const resolve = useConfirm((s) => s.resolve);

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          key={request.id}
          style={{ zIndex: LAYER.confirm }}
          className="fixed inset-0 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => resolve(false)}
          />
          <motion.div
            className="relative z-10 w-full max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="glass overflow-hidden rounded-lg2 border border-white/10">
              <div className="px-5 py-4 text-center">
                <div className="text-[15px] font-semibold text-white">{request.title}</div>
                {request.message && (
                  <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                    {request.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => resolve(true)}
                className={`w-full border-t border-white/10 py-3.5 text-[15px] font-semibold ${
                  request.destructive ? "text-red-400" : "text-white"
                }`}
              >
                {request.confirmLabel ?? "Confirmar"}
              </button>
            </div>
            <button
              onClick={() => resolve(false)}
              className="glass mt-2 w-full rounded-lg2 border border-white/10 py-3.5 text-[15px] font-semibold text-white"
            >
              Cancelar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
