import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RotateCcw, Save, HelpCircle, Lightbulb, ChevronRight } from "lucide-react";
import {
  AI_ACT_QUESTIONS,
  AI_ACT_CLASSES,
  classifyAIAct,
  getNextQuestion,
  recommend,
} from "../utils/rules";

const ACT_NEON = {
  PROHIBITED: "#ff2d55",
  HIGH_RISK: "#ff6b2b",
  LIMITED_RISK: "#ffb800",
  MINIMAL_RISK: "#39ff14",
};

export default function AIActClassification({ useCases, risks, controlMap, onClassify }) {
  const [selectedId, setSelectedId] = useState(useCases[0]?.id ?? "");
  const [answers, setAnswers] = useState({});

  const system = useCases.find((u) => u.id === selectedId);
  const result = useMemo(() => classifyAIAct(answers), [answers]);
  const nextQ = useMemo(() => getNextQuestion(answers), [answers]);
  const actInfo = result ? AI_ACT_CLASSES[result] : null;

  const categories = useMemo(() => [...new Set(risks.map((r) => r.category))], [risks]);

  const handleAnswer = useCallback((qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }, []);

  const handleReset = useCallback(() => setAnswers({}), []);

  const handleSelectSystem = useCallback((id) => {
    setSelectedId(id);
    setAnswers({});
  }, []);

  const answeredTrail = useMemo(() => {
    const trail = [];
    const qMap = Object.fromEntries(AI_ACT_QUESTIONS.map((q) => [q.id, q]));
    let current = AI_ACT_QUESTIONS[0].id;
    while (qMap[current]) {
      const q = qMap[current];
      if (!(q.id in answers)) break;
      trail.push({ ...q, answer: answers[q.id] });
      const next = answers[q.id] ? q.if_yes : q.if_no;
      if (AI_ACT_CLASSES[next]) break;
      current = next;
    }
    return trail;
  }, [answers]);

  const progress = answeredTrail.length / AI_ACT_QUESTIONS.length;

  if (!useCases.length) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500">
        Aucun systeme IA enregistre. Ajoutez un systeme d'abord.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* System selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06]
                   bg-white/70 dark:bg-surface-2/60 backdrop-blur-xl p-5"
      >
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
          Selectionner le systeme IA
        </label>
        <select
          value={selectedId}
          onChange={(e) => handleSelectSystem(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-surface-2/80
                     border border-slate-200/60 dark:border-white/[0.06]
                     focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          {useCases.map((uc) => (
            <option key={uc.id} value={uc.id}>{uc.id} — {uc.name}</option>
          ))}
        </select>

        {system?.ai_act_class && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-400">Classification actuelle :</span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `${ACT_NEON[system.ai_act_class]}14`,
                color: ACT_NEON[system.ai_act_class],
              }}
            >
              {AI_ACT_CLASSES[system.ai_act_class]?.label}
            </span>
          </div>
        )}
      </motion.div>

      {/* Questionnaire */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06]
                   bg-white/70 dark:bg-surface-2/60 backdrop-blur-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500/10">
              <ShieldCheck size={16} className="text-violet-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
              Questionnaire AI Act
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {answeredTrail.length}/{AI_ACT_QUESTIONS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${result ? 100 : progress * 100}%` }}
            style={{ background: result ? ACT_NEON[result] : "linear-gradient(90deg, #8b5cf6, #6366f1)" }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Answered questions */}
        <AnimatePresence>
          {answeredTrail.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 rounded-xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100/60 dark:border-white/[0.03]"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{q.text}</p>
                  <span
                    className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: q.answer ? "rgba(255,45,85,0.1)" : "rgba(57,255,20,0.1)",
                      color: q.answer ? "#ff2d55" : "#39ff14",
                    }}
                  >
                    {q.answer ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Current question */}
        <AnimatePresence mode="wait">
          {nextQ && !result && (
            <motion.div
              key={nextQ.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="p-5 rounded-xl border-2 border-violet-300/40 dark:border-violet-500/20
                         bg-violet-50/40 dark:bg-violet-900/[0.06]"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg shadow-violet-600/20">
                  {answeredTrail.length + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{nextQ.text}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <HelpCircle size={12} className="text-slate-400 flex-shrink-0" />
                    <p className="text-xs text-slate-400">{nextQ.help}</p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleAnswer(nextQ.id, true)}
                      className="px-5 py-2 rounded-xl text-sm font-semibold
                                 border transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: "rgba(255,45,85,0.06)",
                        borderColor: "rgba(255,45,85,0.2)",
                        color: "#ff2d55",
                      }}
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => handleAnswer(nextQ.id, false)}
                      className="px-5 py-2 rounded-xl text-sm font-semibold
                                 border transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: "rgba(57,255,20,0.06)",
                        borderColor: "rgba(57,255,20,0.2)",
                        color: "#39ff14",
                      }}
                    >
                      Non
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && actInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-xl border-2"
              style={{
                borderColor: `${ACT_NEON[result]}30`,
                backgroundColor: `${ACT_NEON[result]}06`,
                boxShadow: `0 0 40px ${ACT_NEON[result]}08`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${ACT_NEON[result]}15` }}
                >
                  <ShieldCheck size={20} style={{ color: ACT_NEON[result] }} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: ACT_NEON[result] }}>
                    {actInfo.label}
                  </p>
                  {actInfo.articles.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Articles : {actInfo.articles.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{actInfo.description}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => onClassify(selectedId, result)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                             bg-gradient-to-r from-violet-600 to-indigo-600 text-white
                             hover:from-violet-500 hover:to-indigo-500 transition-all
                             shadow-lg shadow-violet-600/20"
                >
                  <Save size={14} /> Enregistrer
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                             text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <RotateCcw size={14} /> Recommencer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {Object.keys(answers).length > 0 && !result && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <RotateCcw size={12} /> Reinitialiser
          </button>
        )}
      </motion.div>

      {/* Recommendations */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06]
                       bg-white/70 dark:bg-surface-2/60 backdrop-blur-xl p-5"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 tracking-tight">
              <Lightbulb size={14} style={{ color: "#ffb800" }} /> Recommandations par Categorie
            </h3>
            <div className="space-y-3">
              {categories.map((cat) => {
                const rec = recommend(cat, result, controlMap);
                if (!rec.controls.length) return null;
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl border"
                    style={{ borderColor: "rgba(255,184,0,0.12)", backgroundColor: "rgba(255,184,0,0.03)" }}
                  >
                    <p className="text-xs font-bold capitalize mb-1" style={{ color: "#ffb800" }}>{cat}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">{rec.guidance}</p>
                    <ul className="space-y-1">
                      {rec.controls.map((ctrl) => (
                        <li key={ctrl.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <ChevronRight size={10} style={{ color: "#ffb800" }} />
                          <span className="font-mono font-bold" style={{ color: "#ffb800" }}>{ctrl.id}</span>
                          {ctrl.name}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
