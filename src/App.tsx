import { useState, useEffect } from "react";
import { TabBar, type TabId } from "./components/TabBar";
import { Feedback } from "./components/Feedback";
import { useNav } from "./store/useNav";
import { Today } from "./pages/Today";
import { Progress } from "./pages/Progress";
import { Achievements } from "./pages/Achievements";
import { Routine } from "./pages/Routine";
import { Settings } from "./pages/Settings";

interface PageConfig {
  Component: () => JSX.Element;
  /** Ocupa a altura toda da tela (sem scroll da página). */
  fill?: boolean;
}

const PAGES: Record<TabId, PageConfig> = {
  routine: { Component: Routine, fill: true },
  today: { Component: Today },
  progress: { Component: Progress },
  achievements: { Component: Achievements },
  settings: { Component: Settings },
};

export default function App() {
  const [tab, setTab] = useState<TabId>("routine");
  const targetTab = useNav((s) => s.targetTab);
  const clearTabTarget = useNav((s) => s.clearTabTarget);
  const { Component: Page, fill } = PAGES[tab];

  useEffect(() => {
    if (targetTab) {
      setTab(targetTab);
      clearTabTarget();
    }
  }, [targetTab, clearTabTarget]);

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
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
