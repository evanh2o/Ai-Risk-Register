# AI Risk Register -- Governance & Cybersecurity by Design

A lightweight, auditable AI risk register for governance, compliance, and
security teams. Identify AI use cases, classify risks, score them, map each
risk to relevant regulatory requirements (EU AI Act, NIS2, optional DORA), and
classify systems under the EU AI Act with a built-in questionnaire.

## Objectives

- Identify AI use cases and their exposure characteristics.
- Classify AI-related risks with a clear, auditable taxonomy.
- Score risks using a transparent methodology (impact, likelihood, exposure).
- Map risks to EU AI Act and NIS2 articles (optional DORA).
- Classify AI systems under the EU AI Act (Prohibited, High Risk, Limited Risk, Minimal Risk).
- Provide auto-generated mitigation recommendations based on risk category and AI Act classification.
- Export complete risk registers in CSV, Markdown, and PDF for audit.

## Key Properties

- Python 3.9+ compatible, minimal dependencies (standard library only for core).
- JSON or YAML storage (no database, Git-friendly).
- CLI-first interface with full Streamlit web UI.
- Secure by design: strict input validation, no dynamic execution, frozen dataclasses.
- Open-source (MIT License).

## Quick Start

### Installation

```bash
pip install -e ".[streamlit]"
```

### CLI Usage

```bash
ai-risk-register --help
ai-risk-register list-risks --data-dir data
ai-risk-register list-usecases --data-dir data
ai-risk-register assess --data-dir data --usecase-id UC-001
ai-risk-register assess --data-dir data --usecase-id UC-001 --format markdown --output reports/uc-001.md
```

Or run as a module:

```bash
python -m ai_risk_register.cli --help
```

### Streamlit Web UI

```bash
pip install -e ".[streamlit]"
streamlit run src/ai_risk_register/ui.py
```

The web UI provides five pages accessible from the sidebar:

- **Dashboard** -- KPI cards, interactive Plotly risk matrix (Impact vs Likelihood), severity distribution charts, top critical risks, and CSV/Markdown/PDF export.
- **AI Systems** -- Browse all registered AI systems, view risk assessments per system, and delete systems with confirmation.
- **Add / Edit System** -- Create or update AI systems with real-time risk score preview as you adjust exposure and criticality sliders.
- **Risk Catalog** -- Browse, filter, and manage risks. Add new risks with category, impact, likelihood, regulatory references, and mitigation controls.
- **AI Act Classification** -- Step-by-step questionnaire to classify each AI system under the EU AI Act (Prohibited, High Risk, Limited Risk, Minimal Risk) with auto-generated mitigation recommendations.

### Optional Dependencies

```bash
pip install -e ".[yaml]"      # YAML file support
pip install -e ".[pdf]"       # PDF export via reportlab
```

## Repository Structure

```
src/ai_risk_register/
  __init__.py          # Package exports
  __main__.py          # Entry point
  ai_act.py            # AI Act classification engine + questionnaire
  cli.py               # Command-line interface
  export.py            # CSV and PDF export utilities
  models.py            # Data models (UseCase, Risk, Control, RiskAssessment)
  recommendations.py   # Auto-recommendation engine
  report.py            # Markdown/JSON report generation
  scoring.py           # Risk scoring logic
  storage.py           # JSON/YAML load and save (atomic writes)
  ui.py                # Streamlit multi-page web UI
  validate.py          # Input validation

data/
  ai_act_rules.json    # AI Act classification questionnaire
  controls.json        # Mitigation controls catalog
  risk_catalog.json    # Risk definitions with regulatory mapping
  use_cases.json       # AI system (use case) definitions

docs/                  # Methodology, regulatory mapping, audit findings
security/              # Threat model, assumptions, secure coding
tests/                 # Unit tests
```

## Data Schemas (JSON/YAML)

All JSON files must contain arrays of objects with required fields and strict
value ranges.

### Use Cases (`data/use_cases.json`)

- `id` (string, unique)
- `name` (string)
- `description` (string)
- `data_type` (string; e.g., personal, sensitive, public)
- `exposure` (integer 1--5)
- `model_type` (string; e.g., LLM, Classification, Regression)
- `criticality` (integer 1--5)
- `owner` (string)
- `assumptions` (string)
- `ai_act_class` (string, optional; PROHIBITED, HIGH_RISK, LIMITED_RISK, MINIMAL_RISK)

### Risks (`data/risk_catalog.json`)

- `id` (string, unique)
- `name` (string)
- `description` (string)
- `category` (string; security, compliance, ethical, operational, resilience)
- `base_impact` (integer 1--5)
- `base_likelihood` (integer 1--5)
- `eu_ai_act` (array of strings, article references)
- `nis2` (array of strings, article references; non-empty)
- `dora` (array of strings, optional)
- `mitigations` (array of control IDs)

### Controls (`data/controls.json`)

- `id` (string, unique)
- `name` (string)
- `description` (string)
- `type` (string; preventive, detective, corrective, governance)

### AI Act Rules (`data/ai_act_rules.json`)

A decision-tree questionnaire with 12 questions covering Art. 5 (prohibited
practices), Annex III (high-risk), and Art. 52 (transparency/limited risk).

## Risk Scoring

Score = `impact * likelihood * exposure` (range 1--125).

Risk levels:

- Low: 1--20
- Medium: 21--50
- High: 51--90
- Critical: 91--125

See `docs/methodology.md` for full methodology and assumptions.

## AI Act Classification

The built-in questionnaire walks through the EU AI Act decision tree:

1. **Prohibited** (Art. 5): Social scoring, real-time biometric identification, exploitation of vulnerabilities.
2. **High Risk** (Annex III): Critical infrastructure, education, employment, credit scoring, law enforcement, migration, justice.
3. **Limited Risk** (Art. 52): Chatbots, deepfakes, and other systems requiring transparency labelling.
4. **Minimal Risk**: All other systems, with voluntary codes of conduct.

After classification, the recommendation engine suggests appropriate controls
based on the combination of risk category and AI Act classification.

## Security

Threat model, assumptions, and secure coding guidance live in `security/`.
This project does not use unsafe deserialization or dynamic execution.

## Audits & Bug Bounty

Internal audit and attacker-mindset findings are documented in:

- `docs/audit.md`
- `docs/bug_bounty.md`

## Limitations

- This tool is for governance and risk management, not technical model
  validation.
- Regulatory mapping is a best-effort summary and must be validated by legal
  counsel for production use.

## Testing

```bash
python -m unittest discover -s tests -v
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
