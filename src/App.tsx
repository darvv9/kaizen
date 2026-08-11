import { useEffect } from "react";
import { TabBar, type TabId } from "./components/TabBar";
import { Feedback } from "./components/Feedback";
import { ConfirmHost } from "./components/ConfirmHost";
import { useNav } from "./store/useNav";
import { useStore } from "./store/useStore";
import { shouldNagToday } from "./lib/physique";
import { syncBadge } from "./lib/badge";
import { LAYER } from "./lib/layers";
import { Today } from "./pages/Today";
import { Week } from "./pages/Week";
import { Physique } from "./pages/Physique";
import { Settings } from "./pages/Settings";

interface PageConfig {
  Component: () => JSX.Element;
  /** Ocupa a altura toda da tela (sem scroll da página). */
  fill?: boolean;
}

const PAGES: Record<TabId, PageConfig> = {
  today: { Component: Today },
  week: { Component: Week, fill: true },
  physique: { Component: Physique },
  settings: { Component: Settings },
};

export default function App() {
  const tab = useNav((s) => s.tab);
  const { Component: Page, fill } = PAGES[tab];
  usePhysiqueBadge();

  return (
    <div className="relative isolate mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-ink-950">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{
          zIndex: LAYER.background,
          background:
            "radial-gradient(120% 70% at 50% -20%, rgba(255,255,255,0.10), transparent 65%)",
        }}
      />

      {/* Faixa sólida sob a status bar: o conteúdo some por baixo dela em vez
          de encostar no relógio do iPhone. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          zIndex: LAYER.chrome,
          height: "calc(var(--safe-top) + 0.75rem)",
          background:
            "linear-gradient(to bottom, #08080a 0, #08080a calc(100% - 0.75rem), rgba(8,8,10,0) 100%)",
        }}
      />

      {fill ? (
        <main
          className="page-x pt-chrome pb-chrome relative flex min-h-0 flex-1 flex-col overflow-hidden"
          style={{ zIndex: LAYER.content }}
        >
          <div key={tab} className="flex min-h-0 flex-1 flex-col animate-fade">
            <Page />
          </div>
        </main>
      ) : (
        <main
          className="page-x pt-chrome pb-chrome relative flex-1 overflow-y-auto overscroll-contain"
          style={{ zIndex: LAYER.content }}
        >
          <div key={tab} className="animate-fade">
            <Page />
          </div>
        </main>
      )}

      <TabBar />
      <Feedback />
      <ConfirmHost />
    </div>
  );
}

/** Sem servidor o badge só atualiza com o app aberto — sincroniza no que dá. */
function usePhysiqueBadge() {
  const data = useStore((s) => s.data);
  const enabled = data.physique.badgeEnabled === true;

  useEffect(() => {
    const update = () => {
      if (!enabled) {
        syncBadge(0);
        return;
      }
      syncBadge(shouldNagToday(useStore.getState().data) ? 1 : 0);
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [enabled, data.physique.entries.length, data.physique.intervalDays]);
}
