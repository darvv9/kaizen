import { useState, useEffect } from "react";
import { TabBar, type TabId } from "./components/TabBar";
import { Feedback } from "./components/Feedback";
import { useNav } from "./store/useNav";
import { Today } from "./pages/Today";
import { Progress } from "./pages/Progress";
import { Achievements } from "./pages/Achievements";
import { Routine } from "./pages/Routine";
import { Settings } from "./pages/Settings";

const PAGES: Record<TabId, () => JSX.Element> = {
  today: Today,
  routine: Routine,
  progress: Progress,
  achievements: Achievements,
  settings: Settings,
};

export default function App() {
  const [tab, setTab] = useState<TabId>("today");
  const targetTab = useNav((s) => s.targetTab);
  const clearTabTarget = useNav((s) => s.clearTabTarget);
  const Page = PAGES[tab];

  useEffect(() => {
    if (targetTab) {
      setTab(targetTab);
      clearTabTarget();
    }
  }, [targetTab, clearTabTarget]);

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col bg-ink-950">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,0.10), transparent 60%)",
        }}
      />
      <Feedback />
      <main className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div key={tab} className="animate-fade-up">
          <Page />
        </div>
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
