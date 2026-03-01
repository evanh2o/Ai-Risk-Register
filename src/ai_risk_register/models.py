from dataclasses import dataclass
from typing import List, Optional

from ai_risk_register.validate import (
    require_str,
    require_str_list,
    require_optional_str_list,
    require_int_range,
)


@dataclass(frozen=True)
class UseCase:
    id: str
    name: str
    description: str
    data_type: str
    exposure: int
    model_type: str
    criticality: int
    owner: str
    assumptions: str
    ai_act_class: Optional[str] = None

    @classmethod
    def from_dict(cls, raw: dict) -> "UseCase":
        ai_act_class = raw.get("ai_act_class")
        if ai_act_class is not None:
            if not isinstance(ai_act_class, str) or not ai_act_class.strip():
                ai_act_class = None
            else:
                ai_act_class = ai_act_class.strip()
        return cls(
            id=require_str(raw, "id"),
            name=require_str(raw, "name"),
            description=require_str(raw, "description"),
            data_type=require_str(raw, "data_type"),
            exposure=require_int_range(raw, "exposure", 1, 5),
            model_type=require_str(raw, "model_type"),
            criticality=require_int_range(raw, "criticality", 1, 5),
            owner=require_str(raw, "owner"),
            assumptions=require_str(raw, "assumptions"),
            ai_act_class=ai_act_class,
        )


@dataclass(frozen=True)
class Control:
    id: str
    name: str
    description: str
    type: str

    @classmethod
    def from_dict(cls, raw: dict) -> "Control":
        return cls(
            id=require_str(raw, "id"),
            name=require_str(raw, "name"),
            description=require_str(raw, "description"),
            type=require_str(raw, "type"),
        )


@dataclass(frozen=True)
class Risk:
    id: str
    name: str
    description: str
    category: str
    base_impact: int
    base_likelihood: int
    eu_ai_act: List[str]
    nis2: List[str]
    dora: List[str]
    mitigations: List[str]

    @classmethod
    def from_dict(cls, raw: dict) -> "Risk":
        return cls(
            id=require_str(raw, "id"),
            name=require_str(raw, "name"),
            description=require_str(raw, "description"),
            category=require_str(raw, "category"),
            base_impact=require_int_range(raw, "base_impact", 1, 5),
            base_likelihood=require_int_range(raw, "base_likelihood", 1, 5),
            eu_ai_act=require_str_list(raw, "eu_ai_act"),
            nis2=require_str_list(raw, "nis2"),
            dora=require_optional_str_list(raw, "dora"),
            mitigations=require_str_list(raw, "mitigations"),
        )


@dataclass(frozen=True)
class RiskAssessment:
    usecase_id: str
    risk_id: str
    impact: int
    likelihood: int
    exposure: int
    score: int
    level: str
    mitigations: List[str]
