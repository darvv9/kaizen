# Kaizen

App de rotina pessoal (PWA) com estética minimalista dark estilo Apple, animações fluidas e gamificação (XP, níveis, streaks, anéis de progresso). Instalável na tela de início do iPhone.

O nome do app é **Kaizen** (puro, sem sufixos como "routine" ou "do Davi"). Use sempre apenas "Kaizen".

## Stack

- Vite + React + TypeScript
- Tailwind CSS (tema dark, tokens em `tailwind.config.js`)
- Framer Motion (animações estilo Apple)
- Zustand + middleware `persist` (estado global)
- vite-plugin-pwa (manifest, service worker, ícone, instalável no iOS)

## Arquitetura de dados (IMPORTANTE)

- **Hoje:** persistência 100% local no dispositivo via `src/data/storage.ts`, que é um adapter isolado. Toda a UI e o store consomem esse adapter, nunca o `localStorage` direto.
- **Futuro:** o usuário terá mais dispositivos Apple e vai querer **sincronização na nuvem**. Quando isso acontecer, basta trocar a implementação de `src/data/storage.ts` por um backend (ex: Supabase) sem precisar mexer na UI nem no store. Manter essa camada isolada é um requisito explícito do projeto.
- Há export/import de backup em JSON nos Ajustes para não perder dados antes da nuvem existir.

## Estrutura

- `src/store/useStore.ts` - Zustand store + persist; lógica de XP, níveis, streaks e conclusão diária.
- `src/data/storage.ts` - adapter de persistência (ponto único pra trocar por nuvem).
- `src/data/defaults.ts` - categorias e hábitos iniciais.
- `src/lib/` - utilitários (datas, gamificação).
- `src/components/` - componentes reutilizáveis (ProgressRing, HabitCard, TabBar, etc).
- `src/pages/` - telas (Today, **Routine**, Progress, Achievements, Settings).

## Rotina (core)

- A aba **Rotina** é a tela inicial do app: abre direto na grade da semana inteira (seg–dom, colunas fixas).
- Cada bloco (`RoutineSlot`) liga um hábito a um dia + horário + duração.
- Interação da grade (`src/components/WeekGrid.tsx`, gestos com Pointer Events):
  - tocar numa atividade da paleta (`ActivityPalette`) e depois num horário → cria o bloco ali;
  - sem atividade selecionada, tocar num horário vazio abre o `SlotSheet` já com dia/hora preenchidos;
  - arrastar o bloco muda dia e horário (snap de 15 min); puxar a base muda a duração;
  - tocar no bloco abre o `SlotSheet` (editar/excluir).
- A escala vertical é adaptativa (`src/lib/weekGrid.ts`): a janela de horas cresce só o necessário e o
  `pxPerMin` tenta caber a semana inteira na tela. Mudanças aqui afetam legibilidade e área de toque.
- A tela **Hoje** lista os blocos do dia ordenados por horário; conclusão é por slot (`slotLogs`).
- **Ajustes** guarda a biblioteca de atividades/categorias; horários ficam só na Rotina.

## Convenções

- Idioma da interface: português (pt-BR).
- Sem comentários óbvios no código.
- Datas de log no formato `YYYY-MM-DD` (chave do dia local).
