import { useMemo } from "react";
import { motion } from "framer-motion";
import { X, ShieldAlert, BookOpen, Lightbulb, ChevronRight } from "lucide-react";
import {
  assessUseCase,
  recommend,
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

export default function RiskDetailDrawer({ system, risks, controlMap, riskMap, onClose }) {
  const assessments = useMemo(
    () => assessUseCase(system, risks).sort((a, b) => b.score - a.score),
    [system, risks],
  );

  const categories = useMemo(() => [...new Set(risks.map((r) => r.category))], [risks]);
  const actInfo = AI_ACT_CLASSES[system.ai_act_class];
  const actNeon = ACT_NEON[system.ai_act_class];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg
                   bg-white/95 dark:bg-surface-1/95 backdrop-blur-2xl
                   border-l border-slate-200/60 dark:border-white/[0.06]
                   shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-surface-1/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/[0.04] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">{system.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{system.id} &middot; {system.model_type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* System info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Type de donnees", system.data_type, true],
              ["Proprietaire", system.owner, false],
              ["Exposition", `${system.exposure}/5`, false],
              ["Criticite", `${system.criticality}/5`, false],
            ].map(([label, val, capitalize]) => (
              <div key={label}>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">{label}</p>
                <p className={`font-semibold text-slate-700 dark:text-slate-200 ${capitalize ? "capitalize" : ""}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* AI Act badge */}
          {actInfo && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl border"
              style={{
                borderColor: `${actNeon}20`,
                backgroundColor: `${actNeon}06`,
                boxShadow: `0 0 30px ${actNeon}06`,
              }}
            >
              <ShieldAlert size={18} style={{ color: actNeon }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold" style={{ color: actNeon }}>{actInfo.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{actInfo.description}</p>
              </div>
            </motion.div>
          )}

          {/* Assumptions */}
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium mb-1">Hypotheses</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{system.assumptions}</p>
          </div>

          {/* Risk assessments */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 tracking-tight">
              <BookOpen size={14} /> Evaluation des Risques
            </h3>
            <div className="space-y-2">
              {assessments.map((a, idx) => {
                const risk = riskMap[a.risk_id];
                const neon = LEVEL_NEON[a.level];
                if (!risk) return null;
                return (
                  <motion.div
                    key={a.risk_id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100/60 dark:border-white/[0.04]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{risk.name}</p>
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${neon}14`, color: neon }}
                      >
                        {a.level} ({a.score})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{risk.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {risk.eu_ai_act?.map((art) => (
                        <span key={art} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 font-medium">
                          {art}
                        </span>
                      ))}
                    </div>
                    {a.mitigations?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.mitigations.map((mid) => {
                          const ctrl = controlMap[mid];
                          return (
                            <span key={mid} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}>
                              {ctrl ? ctrl.name : mid}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 tracking-tight">
              <Lightbulb size={14} style={{ color: "#ffb800" }} /> Recommandations
            </h3>
            <div className="space-y-3">
              {categories.map((cat) => {
                const rec = recommend(cat, system.ai_act_class, controlMap);
                if (!rec.controls.length) return null;
                return (
                  <div
                    key={cat}
                    className="p-3 rounded-xl border"
                    style={{ borderColor: "rgba(255,184,0,0.12)", backgroundColor: "rgba(255,184,0,0.03)" }}
                  >
                    <p className="text-xs font-bold capitalize mb-1" style={{ color: "#ffb800" }}>{cat}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">{rec.guidance}</p>
                    <div className="space-y-1.5">
                      {rec.controls.map((ctrl) => (
                        <div key={ctrl.id} className="flex items-start gap-2">
                          <ChevronRight size={10} className="mt-0.5 flex-shrink-0" style={{ color: "#ffb800" }} />
                          <div>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              <span className="font-mono font-bold mr-1" style={{ color: "#ffb800" }}>{ctrl.id}</span>
                              {ctrl.name}
                            </p>
                            <p className="text-[10px] text-slate-400">{ctrl.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
