/**
 * AI Risk Register — Rules Engine
 *
 * Contains all business logic: risk scoring, AI Act classification,
 * and auto-recommendation generation. Ported from the Python backend
 * (scoring.py, ai_act.py, recommendations.py).
 */

// ---------------------------------------------------------------------------
// Risk Scoring
// Score = impact × likelihood × exposure  (range 1 – 125)
// ---------------------------------------------------------------------------

export function scoreRisk(impact, likelihood, exposure = 3) {
  return impact * likelihood * exposure;
}

export function riskLevel(score) {
  if (score <= 20) return "Low";
  if (score <= 50) return "Medium";
  if (score <= 90) return "High";
  return "Critical";
}

/**
 * Compute a full risk assessment for a given use-case against a catalog of risks.
 * Returns an array of assessment objects.
 */
export function assessUseCase(useCase, risks) {
  return risks.map((risk) => {
    const score = scoreRisk(risk.base_impact, risk.base_likelihood, useCase.exposure);
    return {
      usecase_id: useCase.id,
      risk_id: risk.id,
      impact: risk.base_impact,
      likelihood: risk.base_likelihood,
      exposure: useCase.exposure,
      score,
      level: riskLevel(score),
      mitigations: risk.mitigations ?? [],
    };
  });
}

// ---------------------------------------------------------------------------
// AI Act Classification
// Decision-tree questionnaire (mirrors data/ai_act_rules.json)
// ---------------------------------------------------------------------------

export const AI_ACT_CLASSES = {
  PROHIBITED: {
    key: "PROHIBITED",
    label: "Prohibited",
    description:
      "This AI system falls under practices prohibited by Art. 5 of the AI Act. It cannot be placed on the EU market.",
    color: "#e11d48",       // crimson-500
    bgLight: "bg-crimson-50",
    bgDark: "dark:bg-crimson-900/20",
    textColor: "text-crimson-600 dark:text-crimson-500",
    articles: ["Art. 5"],
  },
  HIGH_RISK: {
    key: "HIGH_RISK",
    label: "High Risk",
    description:
      "This AI system is classified as high-risk under Annex III. Mandatory requirements include risk management, data governance, transparency, human oversight, and conformity assessment.",
    color: "#f97316",       // orange-500
    bgLight: "bg-orange-50",
    bgDark: "dark:bg-orange-900/20",
    textColor: "text-orange-600 dark:text-orange-500",
    articles: ["Art. 6", "Art. 9", "Art. 10", "Art. 11", "Art. 12", "Art. 13", "Art. 14", "Art. 15"],
  },
  LIMITED_RISK: {
    key: "LIMITED_RISK",
    label: "Limited Risk",
    description:
      "Transparency obligations apply under Art. 52. Users must be informed they are interacting with AI, and generated content must be labelled.",
    color: "#f59e0b",       // amber-500
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-900/20",
    textColor: "text-amber-600 dark:text-amber-500",
    articles: ["Art. 52"],
  },
  MINIMAL_RISK: {
    key: "MINIMAL_RISK",
    label: "Minimal Risk",
    description:
      "No mandatory requirements apply. Voluntary codes of conduct are encouraged.",
    color: "#10b981",       // emerald-500
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-900/20",
    textColor: "text-emerald-600 dark:text-emerald-500",
    articles: [],
  },
};

export const AI_ACT_QUESTIONS = [
  { id: "Q1", text: "Does the system perform social scoring of natural persons?", help: "Social scoring: evaluating persons based on social behaviour or personal characteristics, leading to detrimental treatment.", if_yes: "PROHIBITED", if_no: "Q2" },
  { id: "Q2", text: "Does the system use real-time remote biometric identification in publicly accessible spaces?", help: "Live facial recognition and similar biometric identification in public areas.", if_yes: "PROHIBITED", if_no: "Q3" },
  { id: "Q3", text: "Does the system exploit vulnerabilities of specific groups to materially distort behaviour?", help: "Subliminal techniques or exploitation of age, disability, or social situation (Art. 5).", if_yes: "PROHIBITED", if_no: "Q4" },
  { id: "Q4", text: "Is the system a safety component of critical infrastructure?", help: "Energy, transport, water, digital infrastructure (Annex III).", if_yes: "HIGH_RISK", if_no: "Q5" },
  { id: "Q5", text: "Is the system used in education to determine access, assign, or assess students?", help: "Access to education, learning outcome evaluation (Annex III, 3).", if_yes: "HIGH_RISK", if_no: "Q6" },
  { id: "Q6", text: "Is the system used in employment, recruitment, or worker management?", help: "CV screening, interview evaluation, task allocation (Annex III, 4).", if_yes: "HIGH_RISK", if_no: "Q7" },
  { id: "Q7", text: "Is the system used to evaluate creditworthiness or credit scores?", help: "Except for financial fraud detection (Annex III, 5b).", if_yes: "HIGH_RISK", if_no: "Q8" },
  { id: "Q8", text: "Is the system used by law enforcement for risk assessment or crime prediction?", help: "Profiling, crime analytics, polygraph, evidence reliability (Annex III, 6).", if_yes: "HIGH_RISK", if_no: "Q9" },
  { id: "Q9", text: "Is the system used in migration, asylum, or border control?", help: "Risk assessment of persons entering the EU, document authentication (Annex III, 7).", if_yes: "HIGH_RISK", if_no: "Q10" },
  { id: "Q10", text: "Is the system used in the administration of justice or democratic processes?", help: "Assisting judicial authorities in researching or applying law (Annex III, 8).", if_yes: "HIGH_RISK", if_no: "Q11" },
  { id: "Q11", text: "Does the system interact directly with natural persons (chatbot, virtual assistant)?", help: "Must disclose AI nature under Art. 52 transparency obligation.", if_yes: "LIMITED_RISK", if_no: "Q12" },
  { id: "Q12", text: "Does the system generate or manipulate images, audio, or video (deepfakes)?", help: "AI-generated content must be labelled (Art. 52).", if_yes: "LIMITED_RISK", if_no: "MINIMAL_RISK" },
];

/**
 * Walk the questionnaire decision tree.
 * @param {Object<string,boolean>} answers — map of questionId → true/false
 * @returns {string|null} — classification key or null if incomplete
 */
export function classifyAIAct(answers) {
  const qMap = Object.fromEntries(AI_ACT_QUESTIONS.map((q) => [q.id, q]));
  let current = AI_ACT_QUESTIONS[0].id;

  while (qMap[current]) {
    const q = qMap[current];
    if (!(q.id in answers)) return null; // incomplete
    const next = answers[q.id] ? q.if_yes : q.if_no;
    if (AI_ACT_CLASSES[next]) return next;
    current = next;
  }
  return "MINIMAL_RISK";
}

/**
 * Get the next unanswered question in the flow.
 * @returns {Object|null} — question object or null if classification reached
 */
export function getNextQuestion(answers) {
  const qMap = Object.fromEntries(AI_ACT_QUESTIONS.map((q) => [q.id, q]));
  let current = AI_ACT_QUESTIONS[0].id;

  while (qMap[current]) {
    const q = qMap[current];
    if (!(q.id in answers)) return q;
    const next = answers[q.id] ? q.if_yes : q.if_no;
    if (AI_ACT_CLASSES[next]) return null;
    current = next;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Risk Level Styling Helpers
// ---------------------------------------------------------------------------

export const RISK_LEVEL_CONFIG = {
  Low: {
    color: "#10b981",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    ring: "ring-emerald-500/20",
  },
  Medium: {
    color: "#f59e0b",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    ring: "ring-amber-500/20",
  },
  High: {
    color: "#f97316",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    ring: "ring-orange-500/20",
  },
  Critical: {
    color: "#e11d48",
    bg: "bg-crimson-50 dark:bg-crimson-900/20",
    text: "text-crimson-700 dark:text-crimson-400",
    border: "border-crimson-200 dark:border-crimson-800",
    ring: "ring-crimson-500/20",
  },
};

// ---------------------------------------------------------------------------
// Recommendations Engine
// Maps (risk_category, ai_act_class) → suggested control IDs + guidance
// ---------------------------------------------------------------------------

const BASE_RECS = {
  security: ["C-002", "C-004", "C-005"],
  ethical: ["C-003", "C-006", "C-001"],
  operational: ["C-003", "C-005"],
  resilience: ["C-003"],
};

const AI_ACT_EXTRA = {
  PROHIBITED: {
    security: ["C-001", "C-006"],
    ethical: ["C-002", "C-004"],
    operational: ["C-001", "C-006"],
    resilience: ["C-005", "C-006"],
  },
  HIGH_RISK: {
    security: ["C-001", "C-003", "C-006"],
    ethical: ["C-004", "C-005"],
    operational: ["C-001", "C-006"],
    resilience: ["C-004", "C-005", "C-006"],
  },
  LIMITED_RISK: {
    security: ["C-006"],
    ethical: ["C-005"],
    operational: ["C-006"],
    resilience: ["C-005"],
  },
  MINIMAL_RISK: {},
};

const GUIDANCE = {
  PROHIBITED: {
    security: "PROHIBITED under the AI Act. Immediate decommissioning or redesign required. Apply maximum security controls during transition.",
    ethical: "PROHIBITED. Cease deployment and conduct a full ethical impact assessment before any redesign.",
    operational: "PROHIBITED. Establish incident response readiness and prepare a decommissioning plan.",
    resilience: "PROHIBITED. Ensure continuity through alternative means while decommissioning.",
  },
  HIGH_RISK: {
    security: "High-risk classification requires conformity assessment. Implement robust access controls, adversarial testing, and continuous monitoring.",
    ethical: "Must demonstrate fairness and non-discrimination. Implement bias testing, human oversight, and transparent decision logging.",
    operational: "Full traceability and logging required (Art. 12). Maintain incident response playbooks and audit trails.",
    resilience: "Art. 15 requires accuracy, robustness, and cybersecurity. Continuous monitoring and drift detection are mandatory.",
  },
  LIMITED_RISK: {
    security: "Standard security controls. Ensure users are informed of AI interaction per Art. 52.",
    ethical: "Transparency obligations apply. Ensure users know they interact with AI.",
    operational: "Maintain monitoring and ensure transparency labelling is consistently applied.",
    resilience: "Monitor for drift. Label AI-generated content appropriately.",
  },
  MINIMAL_RISK: {
    security: "No mandatory AI Act requirements. Following security best practices is recommended.",
    ethical: "Voluntary codes of conduct are encouraged. Consider proactive fairness testing.",
    operational: "Standard operational practices apply. Consider logging for auditability.",
    resilience: "Standard resilience monitoring is recommended.",
  },
};

/**
 * Generate recommendations for a (riskCategory, aiActClass) pair.
 * @param {string} category — risk category (security, ethical, operational, resilience)
 * @param {string|null} aiActClass — AI Act classification key
 * @param {Object<string,Object>} controlMap — id → control object
 * @returns {{ controlIds: string[], controls: Object[], guidance: string }}
 */
export function recommend(category, aiActClass, controlMap) {
  const cat = (category || "").toLowerCase();
  const cls = aiActClass || "MINIMAL_RISK";

  const seen = new Set();
  const ids = [];

  for (const cid of BASE_RECS[cat] || []) {
    if (!seen.has(cid)) { ids.push(cid); seen.add(cid); }
  }
  for (const cid of (AI_ACT_EXTRA[cls]?.[cat] || [])) {
    if (!seen.has(cid)) { ids.push(cid); seen.add(cid); }
  }

  const controls = ids.map((id) => controlMap[id]).filter(Boolean);
  const guidance = GUIDANCE[cls]?.[cat] || "Apply controls proportional to the identified risk level.";

  return { controlIds: ids, controls, guidance };
}

// ---------------------------------------------------------------------------
// Data Helpers
// ---------------------------------------------------------------------------

export function buildControlMap(controls) {
  return Object.fromEntries(controls.map((c) => [c.id, c]));
}

export function buildRiskMap(risks) {
  return Object.fromEntries(risks.map((r) => [r.id, r]));
}

/**
 * Generate the next sequential ID.
 * @param {string} prefix — e.g. "UC" or "R"
 * @param {string[]} existingIds
 */
export function nextId(prefix, existingIds) {
  const nums = existingIds
    .map((id) => {
      const parts = id.split("-");
      return parts.length === 2 ? parseInt(parts[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const next = Math.max(0, ...nums) + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}
