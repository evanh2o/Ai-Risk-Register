/**
 * Seed data — mirrors data/*.json from the Python backend.
 * Used as initial state when localStorage is empty.
 */

export const SEED_USE_CASES = [
  {
    id: "UC-001",
    name: "Customer support assistant",
    description: "LLM-assisted responses for customer support agents.",
    data_type: "personal",
    exposure: 3,
    model_type: "LLM",
    criticality: 3,
    owner: "Customer Operations",
    assumptions: "No automated decisioning; human approves final responses.",
    ai_act_class: "LIMITED_RISK",
  },
  {
    id: "UC-002",
    name: "Fraud detection triage",
    description: "Model-assisted prioritization of fraud alerts for analyst review.",
    data_type: "sensitive",
    exposure: 4,
    model_type: "Classification",
    criticality: 4,
    owner: "Risk Management",
    assumptions: "Analysts review all flagged cases before action.",
    ai_act_class: "HIGH_RISK",
  },
];

export const SEED_RISKS = [
  {
    id: "R-001",
    name: "Unauthorized data access",
    description: "Sensitive data is accessed by unauthorized users or services.",
    category: "security",
    base_impact: 5,
    base_likelihood: 3,
    eu_ai_act: ["Art. 9", "Art. 10"],
    nis2: ["Art. 21"],
    dora: ["Art. 6"],
    mitigations: ["C-002", "C-005"],
  },
  {
    id: "R-002",
    name: "Prompt injection and data exfiltration",
    description: "Model prompts are manipulated to reveal sensitive information.",
    category: "security",
    base_impact: 4,
    base_likelihood: 3,
    eu_ai_act: ["Art. 9", "Art. 15"],
    nis2: ["Art. 21"],
    dora: ["Art. 8"],
    mitigations: ["C-002", "C-004", "C-003"],
  },
  {
    id: "R-003",
    name: "Bias or discrimination",
    description: "Model outputs lead to unfair or discriminatory outcomes.",
    category: "ethical",
    base_impact: 4,
    base_likelihood: 2,
    eu_ai_act: ["Art. 10", "Art. 14"],
    nis2: ["Art. 21"],
    dora: ["Art. 6"],
    mitigations: ["C-003", "C-006"],
  },
  {
    id: "R-004",
    name: "Lack of traceability and logging",
    description: "Insufficient logs hinder accountability and incident response.",
    category: "operational",
    base_impact: 3,
    base_likelihood: 3,
    eu_ai_act: ["Art. 12"],
    nis2: ["Art. 21", "Art. 23"],
    dora: ["Art. 15"],
    mitigations: ["C-003", "C-005"],
  },
  {
    id: "R-005",
    name: "Model drift or performance degradation",
    description: "Model accuracy degrades due to data shifts or concept drift.",
    category: "resilience",
    base_impact: 3,
    base_likelihood: 3,
    eu_ai_act: ["Art. 15"],
    nis2: ["Art. 21"],
    dora: ["Art. 6"],
    mitigations: ["C-003"],
  },
];

export const SEED_CONTROLS = [
  { id: "C-001", name: "Data minimization and retention limits", description: "Collect only necessary data and apply retention schedules with disposal controls.", type: "governance" },
  { id: "C-002", name: "Access control and least privilege", description: "Role-based access with periodic access reviews for AI assets and data.", type: "preventive" },
  { id: "C-003", name: "Model output monitoring", description: "Monitor for drift, anomalies, and unsafe outputs with alerting.", type: "detective" },
  { id: "C-004", name: "Adversarial testing and red teaming", description: "Test model behavior against prompt injection and data poisoning scenarios.", type: "detective" },
  { id: "C-005", name: "Incident response playbooks", description: "Runbooks for AI system incidents, including legal and regulatory notifications.", type: "corrective" },
  { id: "C-006", name: "Human oversight and escalation", description: "Define human review thresholds and escalation procedures for high-risk decisions.", type: "governance" },
];
