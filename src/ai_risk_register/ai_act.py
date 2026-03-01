"""AI Act classification engine with dynamic questionnaire."""

import json
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class AIActClass(str, Enum):
    PROHIBITED = "PROHIBITED"
    HIGH_RISK = "HIGH_RISK"
    LIMITED_RISK = "LIMITED_RISK"
    MINIMAL_RISK = "MINIMAL_RISK"


CLASSIFICATION_LABELS: Dict[str, str] = {
    AIActClass.PROHIBITED: "Prohibited",
    AIActClass.HIGH_RISK: "High Risk",
    AIActClass.LIMITED_RISK: "Limited Risk",
    AIActClass.MINIMAL_RISK: "Minimal Risk",
}

CLASSIFICATION_COLORS: Dict[str, str] = {
    AIActClass.PROHIBITED: "#b71c1c",
    AIActClass.HIGH_RISK: "#e65100",
    AIActClass.LIMITED_RISK: "#f9a825",
    AIActClass.MINIMAL_RISK: "#2e7d32",
}


@dataclass(frozen=True)
class Question:
    id: str
    text: str
    help: str
    if_yes: str  # classification key or next question id
    if_no: str   # classification key or next question id


@dataclass(frozen=True)
class ClassificationInfo:
    label: str
    description: str
    color: str
    articles: List[str]


def load_rules(path: Path) -> Tuple[List[Question], Dict[str, ClassificationInfo]]:
    """Load the AI Act questionnaire from a JSON file."""
    raw_text = path.read_text(encoding="utf-8")
    data = json.loads(raw_text)

    questions = [
        Question(
            id=q["id"],
            text=q["text"],
            help=q["help"],
            if_yes=q["if_yes"],
            if_no=q["if_no"],
        )
        for q in data["questions"]
    ]

    classifications = {
        key: ClassificationInfo(
            label=val["label"],
            description=val["description"],
            color=val["color"],
            articles=val["articles"],
        )
        for key, val in data["classifications"].items()
    }

    return questions, classifications


def classify(answers: Dict[str, bool], questions: List[Question]) -> Optional[str]:
    """Walk through the questionnaire and return an AIActClass value.

    Returns None if the questionnaire is incomplete (not all required
    questions have been answered yet).
    """
    current = questions[0].id
    question_map = {q.id: q for q in questions}

    while current in question_map:
        q = question_map[current]
        if q.id not in answers:
            return None  # questionnaire not yet complete
        next_step = q.if_yes if answers[q.id] else q.if_no
        if next_step in (e.value for e in AIActClass):
            return next_step
        current = next_step

    return AIActClass.MINIMAL_RISK.value


def get_next_question(
    answers: Dict[str, bool], questions: List[Question]
) -> Optional[Question]:
    """Return the next unanswered question in the flow, or None if done."""
    current = questions[0].id
    question_map = {q.id: q for q in questions}

    while current in question_map:
        q = question_map[current]
        if q.id not in answers:
            return q
        next_step = q.if_yes if answers[q.id] else q.if_no
        if next_step in (e.value for e in AIActClass):
            return None  # classification reached
        current = next_step

    return None
