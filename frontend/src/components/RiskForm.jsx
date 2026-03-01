import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Zap } from "lucide-react";
import {
  scoreRisk,
  riskLevel,
  nextId,
  RISK_LEVEL_CONFIG,
  AI_ACT_CLASSES,
} from "../utils/rules";

const STEPS = [
  { key: "info", label: "Infos Modele" },
  { key: "data", label: "Donnees" },
  { key: "risk", label: "Analyse des Risques" },
];

const MODEL_TYPES = ["LLM", "Classification", "Regression", "Clustering", "Reinforcement Learning", "Computer Vision", "Other"];
const DATA_TYPES = ["personal", "sensitive", "public", "internal", "confidential"];

const LEVEL_NEON = {
  Low: "#39ff14",
  Medium: "#ffb800",
  High: "#ff6b2b",
  Critical: "#ff2d55",
};

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: active ? 1.1 : 1,
                backgroundColor: done ? "#39ff14" : active ? "#8b5cf6" : "rgba(148,163,184,0.1)",
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
              style={{
                color: done || active ? "#fff" : "#64748b",
                boxShadow: active ? "0 0 20px rgba(139,92,246,0.3)" : done ? "0 0 16px rgba(57,255,20,0.2)" : "none",
              }}
            >
              {done ? <Check size={14} /> : idx + 1}
            </motion.div>
            <span className={`text-sm font-medium hidden sm:inline ${active ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={`w-8 h-px mx-1 ${done ? "bg-neon-green/40" : "bg-slate-200 dark:bg-white/[0.06]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SliderInput({ label, value, onChange, min = 1, max = 5, lowLabel, highLabel, neonColor }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
        {label}{" "}
        <span className="font-bold text-slate-700 dark:text-white" style={{ color: neonColor }}>
          {value}
        </span>
        /{max}
      </label>
      <div className="relative">
        <input
          type="range" min={min} max={max} value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                     [&::-webkit-slider-thumb]:shadow-lg"
          style={{
            background: `linear-gradient(90deg, ${neonColor || "#8b5cf6"} ${pct}%, rgba(148,163,184,0.15) ${pct}%)`,
            ["--tw-ring-color"]: neonColor,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{lowLabel || "Faible"}</span><span>{highLabel || "Eleve"}</span>
      </div>
    </div>
  );
}

export default function RiskForm({ useCases, risks, controls, editing, onSave, onCancel }) {
  const [step, setStep] = useState(0);

  const defaultForm = editing
    ? { ...editing }
    : {
        id: nextId("UC", useCases.map((u) => u.id)),
        name: "", description: "", model_type: "LLM", data_type: "personal",
        exposure: 3, criticality: 3, owner: "", assumptions: "", ai_act_class: null,
      };

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const scorePreview = useMemo(() => {
    return risks.slice(0, 6).map((r) => {
      const s = scoreRisk(r.base_impact, r.base_likelihood, form.exposure);
      return { ...r, score: s, level: riskLevel(s) };
    });
  }, [risks, form.exposure]);

  const avgScore = useMemo(() => {
    if (!scorePreview.length) return 0;
    return Math.round(scorePreview.reduce((a, r) => a + r.score, 0) / scorePreview.length);
  }, [scorePreview]);

  function validate() {
    const e = {};
    if (step === 0) {
      if (!form.name.trim()) e.name = "Nom requis";
      if (!form.description.trim()) e.description = "Description requise";
      if (!form.owner.trim()) e.owner = "Proprietaire requis";
    }
    if (step === 1) {
      if (!form.assumptions.trim()) e.assumptions = "Hypotheses requises";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave(form);
  }

  const inputCls = (err) =>
    `w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-surface-2/80
     border ${err ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200/60 dark:border-white/[0.06]"}
     placeholder:text-slate-300 dark:placeholder:text-slate-600
     focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 transition-all`;

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator current={step} />

      <motion.div
        layout
        className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06]
                   bg-white/70 dark:bg-surface-2/60 backdrop-blur-xl p-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
                  Informations du Modele
                </h2>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Identifiant</label>
                  <input type="text" value={form.id} disabled={!!editing} onChange={(e) => set("id", e.target.value)}
                    className={`${inputCls()} disabled:opacity-50`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Nom du systeme *</label>
                  <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="Ex: Customer support chatbot" className={inputCls(errors.name)} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Description *</label>
                  <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                    rows={3} placeholder="Breve description de l'usage IA..." className={`${inputCls(errors.description)} resize-none`} />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Type de modele</label>
                    <select value={form.model_type} onChange={(e) => set("model_type", e.target.value)} className={inputCls()}>
                      {MODEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Proprietaire *</label>
                    <input type="text" value={form.owner} onChange={(e) => set("owner", e.target.value)}
                      placeholder="Equipe / personne" className={inputCls(errors.owner)} />
                    {errors.owner && <p className="text-xs text-red-500 mt-1">{errors.owner}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
                  Donnees & Contexte
                </h2>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Type de donnees</label>
                  <select value={form.data_type} onChange={(e) => set("data_type", e.target.value)} className={inputCls()}>
                    {DATA_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <SliderInput label="Exposition" value={form.exposure} onChange={(v) => set("exposure", v)} neonColor="#00f0ff" />
                <SliderInput label="Criticite" value={form.criticality} onChange={(v) => set("criticality", v)}
                  lowLabel="Faible" highLabel="Critique" neonColor="#ff6b2b" />
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Hypotheses *</label>
                  <textarea value={form.assumptions} onChange={(e) => set("assumptions", e.target.value)}
                    rows={3} placeholder="Ex: Un humain valide toutes les decisions finales..."
                    className={`${inputCls(errors.assumptions)} resize-none`} />
                  {errors.assumptions && <p className="text-xs text-red-500 mt-1">{errors.assumptions}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white tracking-tight">
                  Analyse des Risques
                </h2>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,184,0,0.1)" }}>
                    <Zap size={18} style={{ color: "#ffb800" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Score moyen estime :{" "}
                      <span className="font-bold text-lg font-mono" style={{ color: "#ffb800" }}>{avgScore}</span>
                      <span className="text-slate-400 text-xs"> / 125</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Base sur {scorePreview.length} risques, exposition = {form.exposure}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {scorePreview.map((r, idx) => {
                    const neon = LEVEL_NEON[r.level];
                    const pct = Math.round((r.score / 125) * 100);
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-surface-2/40
                                   border border-slate-100/60 dark:border-white/[0.04]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{r.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{r.category}</p>
                        </div>
                        <div className="w-24">
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.05 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: neon }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-white w-8 text-right">{r.score}</span>
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${neon}14`, color: neon }}
                        >
                          {r.level}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {form.ai_act_class && AI_ACT_CLASSES[form.ai_act_class] && (
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl border"
                    style={{
                      borderColor: `${AI_ACT_CLASSES[form.ai_act_class].color}30`,
                      backgroundColor: `${AI_ACT_CLASSES[form.ai_act_class].color}08`,
                    }}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: AI_ACT_CLASSES[form.ai_act_class].color }} />
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Classification AI Act : <strong>{AI_ACT_CLASSES[form.ai_act_class].label}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100 dark:border-white/[0.04]">
          <div>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                           text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">
                <ChevronLeft size={14} /> Precedent
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              Annuler
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold
                           bg-gradient-to-r from-violet-600 to-indigo-600 text-white
                           hover:from-violet-500 hover:to-indigo-500 transition-all
                           shadow-lg shadow-violet-600/20">
                Suivant <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold
                           text-white transition-all shadow-lg"
                style={{ background: "linear-gradient(135deg, #39ff14, #10b981)", boxShadow: "0 8px 24px rgba(57,255,20,0.2)" }}>
                <Check size={14} /> {editing ? "Mettre a jour" : "Enregistrer"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
