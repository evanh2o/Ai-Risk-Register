import json
from typing import Dict, Iterable, List

from ai_risk_register.models import Control, Risk, RiskAssessment, UseCase


def build_control_map(controls: Iterable[Control]) -> Dict[str, Control]:
    return {control.id: control for control in controls}


def build_risk_map(risks: Iterable[Risk]) -> Dict[str, Risk]:
    return {risk.id: risk for risk in risks}


def render_markdown(
    usecase: UseCase,
    assessments: List[RiskAssessment],
    risks: Dict[str, Risk],
    controls: Dict[str, Control],
) -> str:
    lines = [
        f"# Risk Assessment Report: {usecase.name}",
        "",
        "## Use Case",
        f"- ID: {usecase.id}",
        f"- Description: {usecase.description}",
        f"- Data type: {usecase.data_type}",
        f"- Model type: {usecase.model_type}",
        f"- Exposure: {usecase.exposure}",
        f"- Criticality: {usecase.criticality}",
        f"- Owner: {usecase.owner}",
        f"- Assumptions: {usecase.assumptions}",
        "",
        "## Risks",
    ]

    for assessment in assessments:
        risk = risks.get(assessment.risk_id)
        if not risk:
            continue
        lines.extend(
            [
                f"### {risk.id}: {risk.name}",
                f"- Category: {risk.category}",
                f"- Description: {risk.description}",
                f"- Score: {assessment.score} ({assessment.level})",
                f"- Impact / Likelihood / Exposure: {assessment.impact} / {assessment.likelihood} / {assessment.exposure}",
                f"- EU AI Act: {', '.join(risk.eu_ai_act) if risk.eu_ai_act else 'N/A'}",
                f"- NIS2: {', '.join(risk.nis2) if risk.nis2 else 'N/A'}",
                f"- DORA: {', '.join(risk.dora) if risk.dora else 'N/A'}",
                "- Mitigations:",
            ]
        )
        if not assessment.mitigations:
            lines.append("  - None listed")
        for mitigation_id in assessment.mitigations:
            control = controls.get(mitigation_id)
            if control:
                lines.append(f"  - {control.id}: {control.name} ({control.type})")
            else:
                lines.append(f"  - {mitigation_id}: Unknown control")
        lines.append("")

    return "\n".join(lines)


def render_json(
    usecase: UseCase, assessments: List[RiskAssessment], risk_map: Dict[str, Risk]
) -> str:
    payload = {
        "usecase": {
            "id": usecase.id,
            "name": usecase.name,
            "description": usecase.description,
            "data_type": usecase.data_type,
            "model_type": usecase.model_type,
            "exposure": usecase.exposure,
            "criticality": usecase.criticality,
            "owner": usecase.owner,
            "assumptions": usecase.assumptions,
        },
        "assessments": [
            {
                "risk_id": item.risk_id,
                "risk_name": risk_map[item.risk_id].name
                if item.risk_id in risk_map
                else "",
                "score": item.score,
                "level": item.level,
                "impact": item.impact,
                "likelihood": item.likelihood,
                "exposure": item.exposure,
                "mitigations": item.mitigations,
                "dora": risk_map[item.risk_id].dora
                if item.risk_id in risk_map
                else [],
            }
            for item in assessments
        ],
    }
    return json.dumps(payload, indent=2)
