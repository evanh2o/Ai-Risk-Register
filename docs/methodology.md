# Methodology

## Scope

This project provides a governance-focused AI risk register. It does not
evaluate model accuracy, fairness metrics, or security of underlying model
code. It focuses on risk identification, scoring, and compliance mapping.

## Risk Taxonomy

Risks are classified into:

- Security
- Compliance
- Ethical
- Operational
- Resilience

## Scoring Model

Each risk is scored using three factors, each on a 1–5 scale:

- **Impact**: Severity of harm if the risk materializes.
- **Likelihood**: Probability of occurrence given known controls.
- **Exposure**: Context-specific exposure for the use case.

Score = `impact * likelihood * exposure` (range 1–125).

Risk levels:

- Low: 1–20
- Medium: 21–50
- High: 51–90
- Critical: 91–125

## Assumptions

- Risk catalog base impact and likelihood are validated by governance owners.
- Exposure is set per use case based on data type, system exposure, and access.
- Controls reduce operational likelihood but are not embedded in scoring
  automatically; explicit residual scoring is a future extension.
 - DORA mappings are optional and used when relevant to ICT risk management.

## Data Validation

The CLI validates:

- Required fields and types
- Integer ranges for impact/likelihood/exposure/criticality
- Non-empty arrays for regulatory mappings and mitigations

If any file fails validation, the CLI fails fast with a clear error message.
