from dataclasses import asdict
from typing import Iterable, List

from ai_risk_register.models import Risk, RiskAssessment, UseCase


def score_risk(impact: int, likelihood: int, exposure: int) -> int:
    return impact * likelihood * exposure


def risk_level(score: int) -> str:
    if score <= 20:
        return "Low"
    if score <= 50:
        return "Medium"
    if score <= 90:
        return "High"
    return "Critical"


def assess_usecase(usecase: UseCase, risks: Iterable[Risk]) -> List[RiskAssessment]:
    assessments: List[RiskAssessment] = []
    for risk in risks:
        score = score_risk(risk.base_impact, risk.base_likelihood, usecase.exposure)
        level = risk_level(score)
        assessments.append(
            RiskAssessment(
                usecase_id=usecase.id,
                risk_id=risk.id,
                impact=risk.base_impact,
                likelihood=risk.base_likelihood,
                exposure=usecase.exposure,
                score=score,
                level=level,
                mitigations=list(risk.mitigations),
            )
        )
    return assessments


def assessments_as_dicts(assessments: Iterable[RiskAssessment]) -> List[dict]:
    return [asdict(item) for item in assessments]
