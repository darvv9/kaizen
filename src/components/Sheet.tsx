import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Overlay } from "./Overlay";
import { LAYER } from "../lib/layers";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Sobe o empilhamento quando um sheet abre por cima de outro. */
  z?: number;
  /**
   * `sheet` abraça o conteúdo e fica preso embaixo (poucos campos).
   * `full` é tela cheia, do topo ao fim — formulário longo não cabe num sheet
   * e vira um painel de 90% da tela com cara de coisa flutuando.
   */
  variant?: "sheet" | "full";
  /** Ações fixas no rodapé — não rolam junto com o formulário. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Sheet({
  open,
  title,
  onClose,
  z = LAYER.sheet,
  variant = "sheet",
  footer,
  children,
}: Props) {
  const controls = useDragControls();
  const full = variant === "full";

  return (
    <Overlay>
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
            <div
              className={`absolute inset-0 bg-black/60 ${full ? "" : "backdrop-blur-sm"}`}
              onClick={onClose}
            />
            <motion.div
              style={
                full
                  ? { height: "100dvh", paddingTop: "var(--safe-top)" }
                  : { maxHeight: "calc(100dvh - var(--safe-top) - 1.5rem)" }
              }
              className={`sheet-surface relative z-10 flex w-full max-w-md flex-col ${
                full
                  ? ""
                  : "rounded-t-xl2 border-t border-white/[0.09] shadow-sheet"
              }`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              /* Tela cheia não arrasta: é uma tela, não um cartão solto.
                 No sheet, só o cabeçalho arrasta — se o painel inteiro
                 arrastasse, rolar a lista de dentro puxaria ele junto. */
              drag={full ? false : "y"}
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 110 || info.velocity.y > 700) onClose();
              }}
            >
              <div
                onPointerDown={full ? undefined : (e) => controls.start(e)}
                style={full ? undefined : { touchAction: "none" }}
                className={`shrink-0 px-5 pt-3 ${
                  full ? "border-b border-white/[0.07] pb-3" : "pb-3"
                }`}
              >
                {!full && (
                  <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
                )}
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 truncate text-[17px] font-bold text-white">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="press shrink-0 rounded-full bg-white/10 px-3 py-1 text-sm text-white/70"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <div
                className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 ${
                  footer ? "pb-4" : "pb-[calc(var(--safe-bottom)+1.5rem)]"
                }`}
              >
                {children}
              </div>

              {footer && (
                <div className="shrink-0 border-t border-white/[0.07] px-5 pb-[calc(var(--safe-bottom)+1rem)] pt-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Overlay>
  );
}
