import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from ai_risk_register.scoring import score_risk, risk_level  # noqa: E402
from ai_risk_register.validate import ValidationError, require_int_range  # noqa: E402


class ScoringTests(unittest.TestCase):
    def test_score_risk(self):
        self.assertEqual(score_risk(2, 3, 4), 24)

    def test_risk_levels(self):
        self.assertEqual(risk_level(10), "Low")
        self.assertEqual(risk_level(35), "Medium")
        self.assertEqual(risk_level(75), "High")
        self.assertEqual(risk_level(120), "Critical")

    def test_int_range_validation(self):
        with self.assertRaises(ValidationError):
            require_int_range({"value": 0}, "value", 1, 5)


if __name__ == "__main__":
    unittest.main()
