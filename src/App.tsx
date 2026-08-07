import { useEffect } from "react";
import { TabBar, type TabId } from "./components/TabBar";
import { Feedback } from "./components/Feedback";
import { useNav } from "./store/useNav";
import { useStore } from "./store/useStore";
import { shouldNagToday } from "./lib/physique";
import { syncBadge } from "./lib/badge";
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
    <div className="relative mx-auto flex h-[100dvh] max-w-md flex-col bg-ink-950">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,0.10), transparent 60%)",
        }}
      />
      <Feedback />
      {fill ? (
        <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div key={tab} className="flex min-h-0 flex-1 flex-col animate-fade-up">
            <Page />
          </div>
        </main>
      ) : (
        <main className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <div key={tab} className="animate-fade-up">
            <Page />
          </div>
        </main>
      )}
      <TabBar />
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
