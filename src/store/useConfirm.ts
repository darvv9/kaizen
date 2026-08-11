import { create } from "zustand";

export interface ConfirmRequest {
  title: string;
  /** O que exatamente vai acontecer — nomes e números, não "tem certeza?". */
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

interface ConfirmState {
  request: (ConfirmRequest & { id: number }) | null;
  ask: (request: ConfirmRequest) => Promise<boolean>;
  resolve: (ok: boolean) => void;
}

let resolver: ((ok: boolean) => void) | null = null;
let counter = 0;

/**
 * Substitui o `confirm()` do navegador, que no iPhone abre um alerta do Safari
 * com o domínio do site e entrega o disfarce de app.
 */
export const useConfirm = create<ConfirmState>((set) => ({
  request: null,

  ask: (request) =>
    new Promise<boolean>((resolve) => {
      resolver?.(false);
      resolver = resolve;
      set({ request: { ...request, id: ++counter } });
    }),

  resolve: (ok) => {
    const pending = resolver;
    resolver = null;
    set({ request: null });
    pending?.(ok);
  },
}));

/** `if (await ask({ ... })) ...` — funciona dentro ou fora de componente. */
export function ask(request: ConfirmRequest): Promise<boolean> {
  return useConfirm.getState().ask(request);
}
