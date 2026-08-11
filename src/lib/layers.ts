/**
 * Um lugar só decide o que fica na frente de quê.
 *
 * Regra: quem cria empilhamento próprio (a grade da semana, por exemplo) usa
 * `isolate` e resolve seus z-index internamente — nunca com números daqui.
 */
export const LAYER = {
  /** Fundo da tela (gradiente, colunas da grade). */
  background: 0,
  /** Conteúdo da página. */
  content: 10,
  /** Faixa da status bar e cabeçalhos fixos. */
  chrome: 20,
  /** Barra de abas. */
  tabbar: 30,
  /** Sheet + seu fundo escuro. */
  sheet: 40,
  /** Sheet aberto por cima de outro sheet. */
  sheetOverSheet: 50,
  /** Confirmação destrutiva: sempre acima de qualquer sheet. */
  confirm: 55,
  /** Toast: nunca fica escondido atrás de nada. */
  toast: 60,
} as const;
