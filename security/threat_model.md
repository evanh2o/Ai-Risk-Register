# Threat Model

## Overview

CLI tool processing local JSON data to produce risk assessments. Optional
Streamlit UI runs a local web server. Primary assets are data integrity and
auditability.

## Trust Boundaries

- **Local file system**: Inputs are trusted only if protected by OS permissions.
- **CLI user**: User has full control over inputs and outputs.

## Application-Level Threats

1. **Input tampering**
   - Risk: Malicious edits to JSON modify risk outcomes.
   - Mitigation: Validation, version control, change approvals.

2. **Data poisoning via malformed JSON**
   - Risk: Crash or unexpected behavior.
   - Mitigation: Strict schema validation, fail-fast behavior.

3. **Output manipulation**
   - Risk: Overwriting local files via `--output`.
   - Mitigation: Documented trust model; no privilege escalation.

## System-Level Threats

1. **Unauthorized file access**
   - Risk: Local users can edit catalog files.
   - Mitigation: OS-level access control, restricted permissions.

2. **Integrity loss in shared environments**
   - Risk: Shared workstations allow tampering.
   - Mitigation: Dedicated environments and change review workflows.

3. **Local UI exposure (optional)**
   - Risk: Streamlit serves a local web app that could be accessed by other
     users on the same host if bound to all interfaces.
   - Mitigation: Run with default localhost binding or restrict network access.

## Supply Chain Threats

1. **Dependency compromise**
   - Risk: Minimal; standard library only.
   - Mitigation: No external packages required.

2. **Repository tampering**
   - Risk: Malicious commits to data files.
   - Mitigation: Signed commits, protected branches, CI checks.
