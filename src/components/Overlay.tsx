import { createPortal } from "react-dom";

/**
 * Tudo que flutua sai do fluxo da página e vai pro `body`.
 *
 * Sem isso, qualquer wrapper de página com `z-index` vira um stacking context e
 * prende o overlay lá dentro — foi assim que a barra de abas passou a cobrir o
 * rodapé dos sheets. Os três overlays (Sheet, ConfirmHost, Feedback) precisam
 * usar este portal juntos, senão eles se empilham em contextos diferentes e a
 * escala de `LAYER` deixa de valer entre eles.
 */
export function Overlay({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}
