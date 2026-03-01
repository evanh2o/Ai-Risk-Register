"""Auto-recommendation engine based on risk category and AI Act classification."""

from dataclasses import dataclass
from typing import Dict, List, Optional

from ai_risk_register.ai_act import AIActClass
from ai_risk_register.models import Control

# Maps (risk_category, ai_act_class) -> list of control IDs to recommend.
# A None ai_act_class key means the recommendation applies regardless of
# classification.  More specific entries are merged on top.

_BASE_RECOMMENDATIONS: Dict[str, List[str]] = {
    "security": ["C-002", "C-004", "C-005"],
    "ethical": ["C-003", "C-006", "C-001"],
    "operational": ["C-003", "C-005"],
    "resilience": ["C-003"],
}

_AI_ACT_EXTRA: Dict[str, Dict[str, List[str]]] = {
    AIActClass.PROHIBITED: {
        # Prohibited systems should not be deployed; recommend full governance
        "security": ["C-001", "C-006"],
        "ethical": ["C-002", "C-004"],
        "operational": ["C-001", "C-006"],
        "resilience": ["C-005", "C-006"],
    },
    AIActClass.HIGH_RISK: {
        "security": ["C-001", "C-003", "C-006"],
        "ethical": ["C-004", "C-005"],
        "operational": ["C-001", "C-006"],
        "resilience": ["C-004", "C-005", "C-006"],
    },
    AIActClass.LIMITED_RISK: {
        "security": ["C-006"],
        "ethical": ["C-005"],
        "operational": ["C-006"],
        "resilience": ["C-005"],
    },
    AIActClass.MINIMAL_RISK: {},
}

_GUIDANCE: Dict[str, Dict[str, str]] = {
    AIActClass.PROHIBITED: {
        "security": "This system is PROHIBITED under the AI Act. Immediate decommissioning or redesign is required. Apply maximum security controls during transition.",
        "ethical": "This system is PROHIBITED. Cease deployment and conduct a full ethical impact assessment before any redesign.",
        "operational": "This system is PROHIBITED. Establish incident response readiness and prepare a decommissioning plan.",
        "resilience": "This system is PROHIBITED. Ensure continuity of service through alternative means while decommissioning.",
    },
    AIActClass.HIGH_RISK: {
        "security": "High-risk classification requires a conformity assessment. Implement robust access controls, adversarial testing, and continuous monitoring.",
        "ethical": "High-risk systems must demonstrate fairness and non-discrimination. Implement bias testing, human oversight, and transparent decision logging.",
        "operational": "Ensure full traceability and logging as required by Art. 12. Maintain incident response playbooks and regular audit trails.",
        "resilience": "Art. 15 requires accuracy, robustness, and cybersecurity. Implement continuous monitoring, drift detection, and adversarial resilience testing.",
    },
    AIActClass.LIMITED_RISK: {
        "security": "Apply standard security controls. Ensure users are informed of AI interaction per Art. 52 transparency requirements.",
        "ethical": "Transparency obligations apply. Ensure users know they interact with AI and can request human review.",
        "operational": "Maintain operational monitoring and ensure transparency labelling is consistently applied.",
        "resilience": "Monitor for drift and ensure model outputs remain reliable. Label AI-generated content appropriately.",
    },
    AIActClass.MINIMAL_RISK: {
        "security": "No mandatory AI Act requirements, but following security best practices is recommended.",
        "ethical": "Voluntary codes of conduct are encouraged. Consider fairness testing as a proactive measure.",
        "operational": "Standard operational practices apply. Consider logging for auditability.",
        "resilience": "Standard resilience monitoring is recommended even for minimal-risk systems.",
    },
}


@dataclass(frozen=True)
class Recommendation:
    control_ids: List[str]
    controls: List[Control]
    guidance: str


def recommend(
    risk_category: str,
    ai_act_class: Optional[str],
    control_map: Dict[str, Control],
) -> Recommendation:
    """Generate recommendations for a given risk category and AI Act class."""
    category = risk_category.lower()
    act_class = ai_act_class or AIActClass.MINIMAL_RISK

    # Merge base + AI Act-specific control IDs (deduplicated, order preserved)
    ids: List[str] = []
    seen: set = set()
    for cid in _BASE_RECOMMENDATIONS.get(category, []):
        if cid not in seen:
            ids.append(cid)
            seen.add(cid)
    for cid in _AI_ACT_EXTRA.get(act_class, {}).get(category, []):
        if cid not in seen:
            ids.append(cid)
            seen.add(cid)

    controls = [control_map[cid] for cid in ids if cid in control_map]

    guidance = _GUIDANCE.get(act_class, {}).get(
        category,
        "Apply controls proportional to the identified risk level.",
    )

    return Recommendation(control_ids=ids, controls=controls, guidance=guidance)
