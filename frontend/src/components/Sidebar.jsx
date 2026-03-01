import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "registry", label: "Registre", icon: ListChecks },
  { id: "add", label: "Ajouter", icon: PlusCircle },
  { id: "classification", label: "AI Act", icon: ShieldCheck },
];

export default function Sidebar({ page, onNavigate, collapsed, onToggle }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col
                   bg-white/80 dark:bg-surface-1/90 backdrop-blur-2xl
                   border-r border-slate-200/60 dark:border-white/[0.06]
                   transition-all duration-300 ease-out
                   ${collapsed ? "w-[68px]" : "w-[260px]"}`}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/25">
          <Sparkles size={16} className="text-white" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-400/20 to-transparent" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-hidden"
          >
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight tracking-tight">
              AI Risk Register
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
              Governance & Compliance
            </p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-200 overflow-hidden
                          ${active
                            ? "text-white"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.04]"
                          }`}
              title={collapsed ? label : undefined}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <Icon size={18} className={`relative z-10 flex-shrink-0 ${active ? "text-white" : ""}`} />
              {!collapsed && <span className="relative z-10">{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100 dark:border-white/[0.04]">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-xl
                     text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                     hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
    </aside>
  );
}
