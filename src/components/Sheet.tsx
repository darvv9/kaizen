import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { LAYER } from "../lib/layers";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Sobe o empilhamento quando um sheet abre por cima de outro. */
  z?: number;
  children: React.ReactNode;
}

export function Sheet({ open, title, onClose, z = LAYER.sheet, children }: Props) {
  const controls = useDragControls();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={{ zIndex: z }}
          className="fixed inset-0 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            /* Teto do sheet medido a partir da status bar, não um 88% chutado:
               por mais campo que tenha dentro, ele nunca sobe até o relógio. */
            style={{ maxHeight: "calc(100dvh - var(--safe-top) - 1.5rem)" }}
            className="glass relative z-10 flex w-full max-w-md flex-col rounded-t-xl2 border-t border-white/10 shadow-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            drag="y"
            /* Só o cabeçalho arrasta. Se o painel inteiro arrastasse, rolar a
               lista de dentro puxaria o sheet junto — a sensação de "flutuando". */
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 700) onClose();
            }}
          >
            <div
              onPointerDown={(e) => controls.start(e)}
              style={{ touchAction: "none" }}
              className="shrink-0 px-5 pb-3 pt-3"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 truncate text-[17px] font-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="press shrink-0 rounded-full bg-white/10 px-3 py-1 text-sm text-white/70"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(var(--safe-bottom)+1.5rem)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
