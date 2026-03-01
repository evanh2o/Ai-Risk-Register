# Bug Bounty / Attacker Mindset Review

This section documents adversarial testing of the CLI and data handling.

## Findings and Fixes

### 1) Malicious JSON payloads

- **Attack scenario:** Supply JSON with unexpected types or missing fields to
  crash the CLI or poison scores (applies to YAML if enabled).
- **Impact:** Denial of service or incorrect risk outputs.
- **Fix:** Implemented strict validation for required fields, type checks, and
  integer ranges. Invalid inputs fail fast with a clear error.

### 2) Risk score manipulation

- **Attack scenario:** Edit `base_impact` or `base_likelihood` to down-score a
  high-risk item.
- **Impact:** Governance decisions could be undermined.
- **Fix:** Documented in `security/assumptions.md` with operational controls:
  version control, approvals, and file integrity monitoring.

### 3) Control suppression

- **Attack scenario:** Remove mitigation references to hide required controls.
- **Impact:** Artificially inflates readiness perception.
- **Fix:** Same as above; data integrity controls outside the tool.

### 4) CLI argument abuse

- **Attack scenario:** Use `--output` to overwrite files.
- **Impact:** Local file overwrite by an authorized user.
- **Fix:** CLI only writes to the specified path; no escalation. This is a
  local execution model and is documented as a trust boundary.

## Non-Issues

- No YAML parsing or dynamic code execution is present.
- No network access or external API keys are used.
