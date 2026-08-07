import { Icon } from "./Icon";
import type { IconName } from "../icons/names";
import { useNav } from "../store/useNav";

export type TabId = "today" | "week" | "physique" | "settings";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "today", label: "Hoje", icon: "today" },
  { id: "week", label: "Semana", icon: "week" },
  { id: "physique", label: "Físico", icon: "physique" },
  { id: "settings", label: "Ajustes", icon: "settings" },
];

export function TabBar() {
  const tab = useNav((s) => s.tab);
  const setTab = useNav((s) => s.setTab);

  return (
    <nav className="safe-bottom pointer-events-auto fixed inset-x-0 bottom-0 z-50 px-3 pt-2">
      <div className="glass mx-auto flex max-w-md items-center justify-around rounded-[26px] border border-white/[0.08] px-1 py-1.5 shadow-2xl">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2"
            >
              {active && <span className="absolute inset-0 rounded-2xl bg-white/[0.08]" />}
              <Icon
                name={item.icon}
                size={20}
                className={`relative ${active ? "text-white" : "text-white/45"}`}
              />
              <span
                className={`relative text-[9px] font-medium transition-colors ${
                  active ? "text-white" : "text-white/45"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
