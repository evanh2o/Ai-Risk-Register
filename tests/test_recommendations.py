import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from ai_risk_register.ai_act import AIActClass  # noqa: E402
from ai_risk_register.models import Control  # noqa: E402
from ai_risk_register.recommendations import recommend  # noqa: E402
from ai_risk_register.report import build_control_map  # noqa: E402
from ai_risk_register.storage import load_models  # noqa: E402


def _load_control_map():
    controls = load_models(ROOT / "data" / "controls.json", Control)
    return build_control_map(controls)


class RecommendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.control_map = _load_control_map()

    def test_security_high_risk_has_controls(self):
        rec = recommend("security", AIActClass.HIGH_RISK.value, self.control_map)
        self.assertGreater(len(rec.control_ids), 0)
        self.assertGreater(len(rec.controls), 0)
        self.assertTrue(rec.guidance)

    def test_ethical_minimal_risk(self):
        rec = recommend("ethical", AIActClass.MINIMAL_RISK.value, self.control_map)
        self.assertGreater(len(rec.control_ids), 0)
        self.assertTrue(rec.guidance)

    def test_security_prohibited(self):
        rec = recommend("security", AIActClass.PROHIBITED.value, self.control_map)
        self.assertIn("C-002", rec.control_ids)
        self.assertIn("PROHIBITED", rec.guidance.upper())

    def test_unknown_category_returns_empty_controls(self):
        rec = recommend("nonexistent_category", AIActClass.HIGH_RISK.value, self.control_map)
        self.assertEqual(len(rec.control_ids), 0)

    def test_none_ai_act_class_defaults_to_minimal(self):
        rec = recommend("security", None, self.control_map)
        self.assertGreater(len(rec.control_ids), 0)

    def test_all_categories_have_guidance(self):
        for cat in ["security", "ethical", "operational", "resilience"]:
            for act_class in [e.value for e in AIActClass]:
                rec = recommend(cat, act_class, self.control_map)
                self.assertTrue(
                    rec.guidance,
                    f"Missing guidance for {cat}/{act_class}",
                )

    def test_no_duplicate_control_ids(self):
        rec = recommend("security", AIActClass.HIGH_RISK.value, self.control_map)
        self.assertEqual(len(rec.control_ids), len(set(rec.control_ids)))

    def test_recommendation_has_matching_controls(self):
        rec = recommend("security", AIActClass.HIGH_RISK.value, self.control_map)
        for ctrl in rec.controls:
            self.assertIn(ctrl.id, rec.control_ids)


if __name__ == "__main__":
    unittest.main()
