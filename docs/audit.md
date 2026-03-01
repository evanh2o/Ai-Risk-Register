# Internal Security Audit

Date: 2026-02-03  
Scope: CLI application, JSON data handling, scoring logic, documentation

## Findings

### High

- **None identified.**

### Medium

1. **Data tampering risk (integrity)**
   - **Issue:** JSON files are assumed to be trusted local inputs; tampering can
     change scores or regulatory mappings.
   - **Impact:** Governance decisions may be based on manipulated data.
   - **Mitigation:** Use version control, change approvals, file integrity
     monitoring, and signed releases. This is documented in
     `security/assumptions.md`.

2. **Single-factor exposure assignment**
   - **Issue:** Exposure is set at the use case level; other contextual factors
     (deployment surface, third-party access) are not modeled.
   - **Impact:** Risk scores can understate exposure for complex deployments.
   - **Mitigation:** Documented as a limitation; future extension suggested.

### Low

1. **No residual risk scoring**
   - **Issue:** Mitigations are listed but do not adjust scores.
   - **Impact:** Requires manual review to reflect control effectiveness.
   - **Mitigation:** Documented in `docs/methodology.md`.

2. **Limited schema evolution controls**
   - **Issue:** No schema version field for JSON structures.
   - **Impact:** Changes may break tooling if files evolve.
   - **Mitigation:** Recommend adding schema versioning in future updates.

3. **Local UI exposure (optional)**
   - **Issue:** Streamlit UI can be bound beyond localhost if misconfigured.
   - **Impact:** Unauthorized local network access to dashboards.
   - **Mitigation:** Use default localhost binding or restrict network access.

## Architectural Review

- CLI design is simple and avoids network access.
- Storage is local JSON; no database or external services.
- Threat surfaces are limited to CLI inputs and local file tampering.

## Misconfiguration Risks

- Running the tool on shared systems without file permission controls could
  allow unauthorized edits. Use OS-level file permissions.

## Data Integrity Risks

- Malicious modification of JSON inputs can bias risk outcomes.

## Abuse Cases

- Users can down-score risks by editing base impact/likelihood.
- Mitigation lists can be emptied to hide control gaps.

## Governance Weaknesses

- No built-in approval workflow for changes to risk catalog.
- Regulatory mappings require periodic legal review.
