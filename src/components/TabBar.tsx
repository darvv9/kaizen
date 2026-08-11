import { motion } from "framer-motion";
import { Icon } from "./Icon";
import type { IconName } from "../icons/names";
import { useNav } from "../store/useNav";
import { LAYER } from "../lib/layers";

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
    <nav
      className="safe-bottom absolute inset-x-0 bottom-0 px-3 pt-2"
      style={{ zIndex: LAYER.tabbar }}
    >
      <div className="glass flex items-center justify-around rounded-lg2 border border-white/[0.08] px-1 py-1.5">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-md2 py-2"
            >
              {active && (
                <motion.span
                  layoutId="tab-active"
                  transition={{ type: "spring", stiffness: 520, damping: 40 }}
                  className="absolute inset-0 rounded-md2 bg-white/[0.08]"
                />
              )}
              <Icon
                name={item.icon}
                size={20}
                className={`relative ${active ? "text-white" : "text-white/45"}`}
              />
              <span
                className={`relative text-[9px] font-medium ${
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
