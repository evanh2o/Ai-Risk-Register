import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from ai_risk_register.ai_act import (  # noqa: E402
    AIActClass,
    classify,
    get_next_question,
    load_rules,
)


class LoadRulesTests(unittest.TestCase):
    def test_load_rules_from_data(self):
        rules_path = ROOT / "data" / "ai_act_rules.json"
        questions, classifications = load_rules(rules_path)
        self.assertGreater(len(questions), 0)
        self.assertIn("PROHIBITED", classifications)
        self.assertIn("HIGH_RISK", classifications)
        self.assertIn("LIMITED_RISK", classifications)
        self.assertIn("MINIMAL_RISK", classifications)

    def test_questions_have_required_fields(self):
        rules_path = ROOT / "data" / "ai_act_rules.json"
        questions, _ = load_rules(rules_path)
        for q in questions:
            self.assertTrue(q.id)
            self.assertTrue(q.text)
            self.assertTrue(q.if_yes)
            self.assertTrue(q.if_no)


class ClassifyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rules_path = ROOT / "data" / "ai_act_rules.json"
        cls.questions, cls.classifications = load_rules(rules_path)

    def test_social_scoring_prohibited(self):
        answers = {"Q1": True}
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.PROHIBITED.value)

    def test_biometric_prohibited(self):
        answers = {"Q1": False, "Q2": True}
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.PROHIBITED.value)

    def test_exploitation_prohibited(self):
        answers = {"Q1": False, "Q2": False, "Q3": True}
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.PROHIBITED.value)

    def test_critical_infrastructure_high_risk(self):
        answers = {"Q1": False, "Q2": False, "Q3": False, "Q4": True}
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.HIGH_RISK.value)

    def test_education_high_risk(self):
        answers = {"Q1": False, "Q2": False, "Q3": False, "Q4": False, "Q5": True}
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.HIGH_RISK.value)

    def test_employment_high_risk(self):
        answers = {
            "Q1": False, "Q2": False, "Q3": False,
            "Q4": False, "Q5": False, "Q6": True,
        }
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.HIGH_RISK.value)

    def test_chatbot_limited_risk(self):
        answers = {
            "Q1": False, "Q2": False, "Q3": False,
            "Q4": False, "Q5": False, "Q6": False,
            "Q7": False, "Q8": False, "Q9": False,
            "Q10": False, "Q11": True,
        }
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.LIMITED_RISK.value)

    def test_deepfake_limited_risk(self):
        answers = {
            "Q1": False, "Q2": False, "Q3": False,
            "Q4": False, "Q5": False, "Q6": False,
            "Q7": False, "Q8": False, "Q9": False,
            "Q10": False, "Q11": False, "Q12": True,
        }
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.LIMITED_RISK.value)

    def test_all_no_minimal_risk(self):
        answers = {
            "Q1": False, "Q2": False, "Q3": False,
            "Q4": False, "Q5": False, "Q6": False,
            "Q7": False, "Q8": False, "Q9": False,
            "Q10": False, "Q11": False, "Q12": False,
        }
        result = classify(answers, self.questions)
        self.assertEqual(result, AIActClass.MINIMAL_RISK.value)

    def test_incomplete_returns_none(self):
        answers = {"Q1": False}
        result = classify(answers, self.questions)
        self.assertIsNone(result)

    def test_empty_answers_returns_none(self):
        result = classify({}, self.questions)
        self.assertIsNone(result)


class GetNextQuestionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rules_path = ROOT / "data" / "ai_act_rules.json"
        cls.questions, _ = load_rules(rules_path)

    def test_first_question_when_empty(self):
        q = get_next_question({}, self.questions)
        self.assertIsNotNone(q)
        self.assertEqual(q.id, "Q1")

    def test_second_question_after_no(self):
        q = get_next_question({"Q1": False}, self.questions)
        self.assertIsNotNone(q)
        self.assertEqual(q.id, "Q2")

    def test_none_when_classified(self):
        answers = {"Q1": True}  # -> PROHIBITED
        q = get_next_question(answers, self.questions)
        self.assertIsNone(q)

    def test_none_when_all_answered(self):
        answers = {f"Q{i}": False for i in range(1, 13)}
        q = get_next_question(answers, self.questions)
        self.assertIsNone(q)


if __name__ == "__main__":
    unittest.main()
