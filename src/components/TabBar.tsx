export type TabId = "today" | "routine" | "progress" | "achievements" | "settings";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "today", label: "Hoje", icon: "◎" },
  { id: "routine", label: "Rotina", icon: "▦" },
  { id: "progress", label: "Stats", icon: "▲" },
  { id: "achievements", label: "Medalhas", icon: "✦" },
  { id: "settings", label: "Ajustes", icon: "⚙" },
];

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom px-3 pt-2 pointer-events-auto">
      <div className="glass mx-auto flex max-w-md items-center justify-around rounded-[26px] border border-white/[0.08] px-1 py-1.5 shadow-2xl">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2"
            >
              {isActive && (
                <span className="absolute inset-0 rounded-2xl bg-white/[0.08]" />
              )}
              <span
                className={`relative text-base leading-none transition-colors ${
                  isActive ? "text-white" : "text-white/45"
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`relative text-[9px] font-medium transition-colors ${
                  isActive ? "text-white" : "text-white/45"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
