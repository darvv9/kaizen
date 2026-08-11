# Kaizen

App de rotina pessoal (PWA) com estética minimalista dark estilo Apple e animações fluidas. Instalável na tela de início do iPhone.

O nome do app é **Kaizen** (puro, sem sufixos como "routine" ou "do Davi"). Use sempre apenas "Kaizen".

O foco é concreto: **ver os dias que tem academia e os dias que tem jiu-jitsu**, limpar o checklist do dia e acompanhar a evolução física por vídeo. Nada de XP, níveis ou medalhas — a gamificação foi removida de propósito.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (tema dark, tokens em `tailwind.config.js`)
- Framer Motion (animações estilo Apple)
- Zustand (a persistência é manual: cada action chama `persist()`, não é o middleware `persist`)
- vite-plugin-pwa (manifest, service worker, ícone, instalável no iOS)

## Arquitetura de dados (IMPORTANTE)

Dois adapters isolados, com responsabilidades separadas:

- **`src/data/storage.ts`** — metadados (rotina, logs, datas dos vídeos). Síncrono, localStorage, chave `kaizen:data:v2`. A chave `kaizen:data:v1` (schema antigo, com XP/medalhas) é lida uma vez para converter e depois **fica congelada**: nunca é sobrescrita nem apagada automaticamente.
- **`src/data/media.ts`** — blobs de vídeo. Assíncrono, IndexedDB (`kaizen-media`). **O store nunca importa este módulo**; quem orquestra os dois é a página Físico. Vídeo nunca entra no `AppData`, só o `mediaId`.

Toda a UI consome esses adapters, nunca `localStorage`/`indexedDB` direto. **Futuro:** quando houver sync entre dispositivos Apple, troca-se a implementação dos adapters por um backend (ex: Supabase) sem mexer na UI nem no store. Manter essa camada isolada é requisito explícito do projeto.

`src/data/migrate.ts` normaliza qualquer dado salvo para o schema atual, seção por seção (`normalizeCategory`, `normalizeHabit`, `normalizeSlot`, `normalizePhysique`). **Campo novo no schema exige um normalizador correspondente** — o que não for normalizado é descartado silenciosamente na carga e no import. Nunca gere rotina dentro do migrate: seed é responsabilidade exclusiva de `createDefaultData()`.

Há export/import de backup em JSON nos Ajustes. O backup leva as datas dos vídeos, **não** os vídeos.

## Estrutura

- `src/store/useStore.ts` — Zustand store + todas as mutações de dados.
- `src/store/useNav.ts` — aba atual.
- `src/data/` — adapters de persistência, migração e dados iniciais.
- `src/lib/` — utilitários puros (datas, horários, grade da semana, variações, físico).
- `src/icons/` — ícones SVG + `names.ts` (lista, ícones de categoria, mapa emoji→ícone).
- `src/components/` — componentes reutilizáveis.
- `src/pages/` — as 4 telas: **Today**, **Week**, **Physique**, **Settings**.

## Telas

- **Hoje** (inicial) — checklist do dia. Header compacto (data, sequência, anel de progresso pequeno), card de cobrança do vídeo quando vence, e a lista ocupando o resto. Marcar = `toggleSlot` (`slotLogs`).
- **Semana** — a grade seg–dom inteira numa tela só, editável: toque numa atividade da paleta e depois num horário para criar; arraste o bloco para mudar dia/horário (snap de 15 min); puxe a base para mudar a duração; toque para editar. Gestos com Pointer Events puros em `WeekGrid.tsx`; a matemática está em `src/lib/weekGrid.ts` — mexer ali afeta legibilidade e área de toque.
  - A grade é **sempre o dia inteiro** (`FULL_DAY`, 00h–24h) e rola dentro de uma caixa de tamanho fixo. `pxPerMinute()` escala pela **janela padrão** (7h–22h), que é o que aparece de cara; `initialScrollTop()` posiciona o scroll na abertura, recuando se houver bloco antes das 7h. Nada de janela calculada pelos extremos: um bloco às 23h não pode achatar o dia todo.
  - Arrastar um bloco até ~44px da borda liga o auto-scroll (loop de `requestAnimationFrame`, porque `pointermove` não dispara com o dedo parado). Ao rolar, a origem do gesto é compensada (`g.y -= moved`), senão o bloco escorrega em relação ao dedo.
- **Físico** — vídeos com data em IndexedDB, contagem regressiva do próximo (padrão 14 dias), histórico, salvar/excluir.
- **Ajustes** — biblioteca de atividades, variações e categorias, com exclusão de verdade em cada linha; intervalo do vídeo; backup.

## Regras de interface (o que faz parecer app e não site)

- **Nada de seleção de texto.** `body` tem `user-select: none` e `-webkit-touch-callout: none`; só `input`/`textarea`/`select` reabrem a seleção. Nunca reative em texto comum.
- **Animação só responde a toque.** O que o dedo encostou pode reagir (`.press`, o check do HabitCard, o sheet subindo, o toast). Conteúdo que aparece sozinho **não** desliza: troca de aba é `animate-fade` (só opacidade) e nenhum card usa `initial={{ y }}` nem `layout`.
- **Uma escala de cantos:** `rounded-sm2` (bloco) → `md2` (campo, linha, botão) → `lg2` (card, barra de abas) → `xl2` (sheet). Nada de `rounded-[26px]` avulso.
- **Empilhamento vem de `src/lib/layers.ts`.** Nenhum `z-50` chutado. Quem tem z-index interno (a grade) usa `isolate` e resolve dentro da própria caixa.
- **Todo overlay vai por portal** (`<Overlay>` → `document.body`): `Sheet`, `ConfirmHost` e `Feedback`, sempre os três juntos — se um ficar dentro do `#root` ele se empilha em outro contexto e a escala de `LAYER` deixa de valer entre eles. **Wrapper de página nunca leva `z-index`**: `position: relative` + `z-index` cria stacking context e prende o overlay filho atrás da barra de abas (foi exatamente esse o bug do "botão aparece atrás").
- **Ação principal do sheet fica no rodapé fixo** (prop `footer` do `Sheet`), fora da área que rola. Botão que sobe junto com o formulário é cara de site.
- **Espaço da barra de abas** sai de `--chrome-bottom` (classe `.pb-chrome`), nunca de um `pb-32` adivinhado. Margem lateral: `.page-x`.
- **Nunca use `confirm()`/`alert()`** — no iPhone abre um alerta do Safari com o domínio e entrega o disfarce. Use `ask()` de `src/store/useConfirm.ts`, e escreva o que vai acontecer com nome e número ("Sai de 2 blocos da semana"), não "tem certeza?".

## Excluir vs. tirar da rotina

Duas ações diferentes, com nomes diferentes na tela — não misturar:

- **Tirar da semana** (`deleteRoutineSlot`) — apaga um bloco; a atividade continua na biblioteca.
- **Excluir atividade** (`deleteHabit`) — some do app inteiro: biblioteca, todos os blocos, as variações e o histórico. Disponível nos Ajustes (lixeira na linha e dentro do sheet), na lixeira ao lado da atividade no sheet do bloco e **segurando o chip na paleta da Semana** (`useLongPress`, 450 ms, cancela se o dedo deslizar — a paleta rola na horizontal).
- **Excluir categoria** (`deleteCategory`) — leva junto as atividades e os blocos dela; a confirmação diz quantos.

**As duas nunca podem virar botões gêmeos.** No sheet do bloco, "Tirar da semana" fica no rodapé com as ações do bloco; "Excluir atividade" é uma lixeira **junto da atividade**, com a explicação da diferença embaixo. Lado a lado, do mesmo tamanho, dá pra apagar a Academia inteira achando que estava tirando o treino de segunda — foi o que aconteceu.

**Toda exclusão de rotina passa por `destructive()`** (`src/store/undo.ts`): ele guarda o `AppData` anterior e oferece "Desfazer" no toast por 6s. Funciona porque cada mutação do store cria um objeto novo, então a referência de antes serve de snapshot. Não vale pra vídeo — blob apagado do IndexedDB não volta.

## Variações

`Habit.variants` (`HabitVariant { id, name, items }`) serve tanto Academia (Treino A/B/C, `items` = exercícios) quanto Jiu-Jitsu (No-gi/Gi/Livre, `items` vazio).

Variação se cria em dois lugares: nos Ajustes e **no próprio sheet do bloco** (chip "Nova" + atalho "criar Treino A · B · C"). Sem o segundo, uma atividade recém-criada não teria como ganhar A/B/C sem sair da tela Semana. O atalho usa `DEFAULT_GYM_VARIANTS` (`src/data/defaults.ts`), que é a mesma composição da rotina de fábrica — quem apagou a Academia sem querer recupera os exercícios num toque.

- `RoutineSlot.variantId` é o padrão daquele bloco na semana.
- `AppData.slotVariants[slotId][dayKey]` é o override de um dia só ("hoje fiz o B").
- Resolver **sempre** por `resolveVariantId()` / `variantOf()` (`src/lib/variants.ts`), que toleram id órfão.
- Ao trocar o hábito de um bloco, o `variantId` é zerado (senão um bloco de Jiu exibe "Treino B").

## Ícones

Sem emoji em lugar nenhum do app. Todos os ícones são arquivos `.svg` em `src/icons/`, inlinados pelo componente `<Icon name size />`:

- `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.75"`, caps/joins `round`, sem `width`/`height` no arquivo.
- `currentColor` é obrigatório — é o que faz a cor herdar da classe (TabBar, `contrastInk()` sobre fundo claro).
- Ícone novo: criar o `.svg` **e** adicionar o nome em `src/icons/names.ts`.
- `Category.icon` guarda o nome do ícone; dados antigos com emoji são convertidos no migrate por `EMOJI_TO_ICON`.
- `public/icons/` é só do PWA (favicon, apple-touch, 192/512) — não misturar.

## Notificação do vídeo

Sem servidor não existe push. O que existe: card na tela Hoje quando vence e badge no ícone (`navigator.setAppBadge`, iOS 16.4+, só com o app instalado e permissão concedida), atualizado **quando o app roda**. Push de verdade exigiria VAPID + backend — casa com a nota de nuvem acima.

## Convenções

- Idioma da interface: português (pt-BR).
- Sem comentários óbvios no código.
- Datas de log no formato `YYYY-MM-DD` (chave do dia local, via `dayKey()`); comparação de datas sempre por `parseDayKey()`.
