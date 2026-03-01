import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";
import {
  assessUseCase,
  riskLevel,
  RISK_LEVEL_CONFIG,
  AI_ACT_CLASSES,
} from "../utils/rules";

const LEVEL_NEON = {
  Low: "#39ff14",
  Medium: "#ffb800",
  High: "#ff6b2b",
  Critical: "#ff2d55",
};

const ACT_NEON = {
  PROHIBITED: "#ff2d55",
  HIGH_RISK: "#ff6b2b",
  LIMITED_RISK: "#ffb800",
  MINIMAL_RISK: "#39ff14",
};

export default function RiskTable({
  useCases,
  risks,
  riskMap,
  controlMap,
  onView,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [actFilter, setActFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const categories = useMemo(
    () => ["all", ...new Set(risks.map((r) => r.category))],
    [risks],
  );

  const actClasses = ["all", "PROHIBITED", "HIGH_RISK", "LIMITED_RISK", "MINIMAL_RISK", "NOT_CLASSIFIED"];

  const rows = useMemo(() => {
    return useCases.map((uc) => {
      const assessments = assessUseCase(uc, risks);
      const maxScore = assessments.length ? Math.max(...assessments.map((a) => a.score)) : 0;
      const maxLevel = riskLevel(maxScore);
      const criticalCount = assessments.filter((a) => a.level === "Critical" || a.level === "High").length;
      return { ...uc, assessments, maxScore, maxLevel, criticalCount };
    });
  }, [useCases, risks]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (actFilter !== "all") {
        const cls = r.ai_act_class || "NOT_CLASSIFIED";
        if (cls !== actFilter) return false;
      }
      if (catFilter !== "all") {
        const hasCat = r.assessments.some((a) => riskMap[a.risk_id]?.category === catFilter);
        if (!hasCat) return false;
      }
      return true;
    });
  }, [rows, search, catFilter, actFilter, riskMap]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un systeme..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
                       bg-white dark:bg-surface-2/80 border border-slate-200/60 dark:border-white/[0.06]
                       placeholder:text-slate-400 dark:placeholder:text-slate-500
                       focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40
                       transition-all"
          />
        </div>

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2.5 rounded-xl text-sm font-medium
                       bg-white dark:bg-surface-2/80 border border-slate-200/60 dark:border-white/[0.06]
                       focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Toutes categories" : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={actFilter}
            onChange={(e) => setActFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium
                       bg-white dark:bg-surface-2/80 border border-slate-200/60 dark:border-white/[0.06]
                       focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
          >
            {actClasses.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Toutes classifications" : c === "NOT_CLASSIFIED" ? "Non classifie" : AI_ACT_CLASSES[c]?.label ?? c}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/70 dark:bg-surface-2/60 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Nom du Systeme</th>
                <th className="px-5 py-3.5">Modele</th>
                <th className="px-5 py-3.5 text-center">Exposition</th>
                <th className="px-5 py-3.5 text-center">Score Max</th>
                <th className="px-5 py-3.5 text-center">Niveau</th>
                <th className="px-5 py-3.5 text-center">AI Act</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-400 dark:text-slate-500">
                    Aucun systeme trouve.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const actInfo = AI_ACT_CLASSES[row.ai_act_class];
                  const neon = LEVEL_NEON[row.maxLevel];
                  const actNeon = ACT_NEON[row.ai_act_class];
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-t border-slate-100/60 dark:border-white/[0.03]
                                 hover:bg-slate-50/60 dark:hover:bg-white/[0.02]
                                 transition-colors cursor-pointer"
                      onClick={() => onView(row)}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{row.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">{row.name}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{row.model_type}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-mono font-bold">{row.exposure}</span>
                        <span className="text-slate-400">/5</span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-800 dark:text-white">{row.maxScore}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide"
                          style={{ backgroundColor: `${neon}14`, color: neon }}
                        >
                          {row.maxLevel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {actInfo ? (
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: `${actNeon}14`, color: actNeon }}
                          >
                            {actInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => onView(row)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors" title="Details">
                            <Eye size={14} className="text-slate-400" />
                          </button>
                          <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors" title="Modifier">
                            <Pencil size={14} className="text-slate-400" />
                          </button>
                          <button onClick={() => setConfirmDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors" title="Supprimer">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl border border-white/[0.08] bg-white dark:bg-surface-2 p-6 max-w-sm mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                  Confirmer la suppression
                </h3>
                <button onClick={() => setConfirmDelete(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Supprimer le systeme <strong className="text-slate-700 dark:text-white">{confirmDelete}</strong> ? Cette action est irreversible.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium
                             bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300
                             hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold
                             bg-red-500 text-white hover:bg-red-600 transition-colors
                             shadow-lg shadow-red-500/20"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
