/**
 * API Simulation Layer
 *
 * Simulates backend Python calls (scoring.py, ai_act.py, models.py)
 * with mock data and async wrappers. Replace with real fetch() calls
 * when the FastAPI backend is ready.
 */

import { SEED_USE_CASES, SEED_RISKS, SEED_CONTROLS } from "./data/seed";
import {
  scoreRisk,
  riskLevel,
  assessUseCase,
  classifyAIAct,
  getNextQuestion,
  recommend,
  AI_ACT_QUESTIONS,
  AI_ACT_CLASSES,
} from "./utils/rules";

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

let useCases = [...SEED_USE_CASES];
let risks = [...SEED_RISKS];
let controls = [...SEED_CONTROLS];

// ── Use Cases ────────────────────────────────────────────────────────────────

export async function fetchUseCases() {
  await delay();
  return [...useCases];
}

export async function createUseCase(data) {
  await delay(200);
  useCases = [...useCases, data];
  return data;
}

export async function updateUseCase(id, data) {
  await delay(200);
  useCases = useCases.map((uc) => (uc.id === id ? { ...uc, ...data } : uc));
  return useCases.find((uc) => uc.id === id);
}

export async function deleteUseCase(id) {
  await delay(150);
  useCases = useCases.filter((uc) => uc.id !== id);
  return { success: true };
}

// ── Risks ────────────────────────────────────────────────────────────────────

export async function fetchRisks() {
  await delay();
  return [...risks];
}

export async function createRisk(data) {
  await delay(200);
  risks = [...risks, data];
  return data;
}

// ── Controls ─────────────────────────────────────────────────────────────────

export async function fetchControls() {
  await delay();
  return [...controls];
}

// ── Scoring (mirrors scoring.py) ─────────────────────────────────────────────

export async function computeScore(impact, likelihood, exposure) {
  await delay(50);
  const score = scoreRisk(impact, likelihood, exposure);
  return { score, level: riskLevel(score) };
}

export async function assessUseCaseRisks(useCaseId) {
  await delay(150);
  const uc = useCases.find((u) => u.id === useCaseId);
  if (!uc) throw new Error(`UseCase ${useCaseId} not found`);
  return assessUseCase(uc, risks);
}

// ── AI Act Classification (mirrors ai_act.py) ───────────────────────────────

export async function getAIActQuestions() {
  await delay();
  return [...AI_ACT_QUESTIONS];
}

export async function getAIActClassifications() {
  await delay();
  return { ...AI_ACT_CLASSES };
}

export async function classifySystem(answers) {
  await delay(100);
  const result = classifyAIAct(answers);
  return {
    classification: result,
    info: result ? AI_ACT_CLASSES[result] : null,
    complete: result !== null,
  };
}

export async function getNextAIActQuestion(answers) {
  await delay(50);
  return getNextQuestion(answers);
}

// ── Recommendations (mirrors recommendations.py) ────────────────────────────

export async function getRecommendations(category, aiActClass) {
  await delay(100);
  const controlMap = Object.fromEntries(controls.map((c) => [c.id, c]));
  return recommend(category, aiActClass, controlMap);
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  await delay(200);

  const allAssessments = useCases.flatMap((uc) => assessUseCase(uc, risks));

  const highRiskCount = useCases.filter(
    (uc) => uc.ai_act_class === "HIGH_RISK" || uc.ai_act_class === "PROHIBITED",
  ).length;

  const avgScore = allAssessments.length
    ? Math.round(allAssessments.reduce((s, a) => s + a.score, 0) / allAssessments.length)
    : 0;

  const criticalCount = allAssessments.filter(
    (a) => a.level === "Critical" || a.level === "High",
  ).length;

  const levelDist = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  allAssessments.forEach((a) => {
    levelDist[a.level] = (levelDist[a.level] || 0) + 1;
  });

  const actDist = {};
  useCases.forEach((uc) => {
    const cls = uc.ai_act_class || "NOT_CLASSIFIED";
    actDist[cls] = (actDist[cls] || 0) + 1;
  });

  const categoryDist = {};
  risks.forEach((r) => {
    categoryDist[r.category] = (categoryDist[r.category] || 0) + 1;
  });

  return {
    total: useCases.length,
    totalRisks: risks.length,
    totalControls: controls.length,
    highRiskCount,
    pctHighRisk: useCases.length ? Math.round((highRiskCount / useCases.length) * 100) : 0,
    avgScore,
    criticalCount,
    levelDist,
    actDist,
    categoryDist,
    allAssessments,
  };
}
