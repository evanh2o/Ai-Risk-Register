import json
import sys
import tempfile
import unittest
from dataclasses import asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from ai_risk_register.models import UseCase, Risk, Control  # noqa: E402
from ai_risk_register.storage import save_json, save_models, load_json, load_models  # noqa: E402


class SaveJsonTests(unittest.TestCase):
    def test_save_and_load_roundtrip(self):
        data = [{"id": "T-001", "name": "Test"}, {"id": "T-002", "name": "Test2"}]
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "test.json"
            save_json(path, data)
            loaded = load_json(path)
            self.assertEqual(loaded, data)

    def test_save_overwrites_existing(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "test.json"
            save_json(path, [{"a": 1}])
            save_json(path, [{"b": 2}])
            loaded = load_json(path)
            self.assertEqual(loaded, [{"b": 2}])

    def test_save_creates_valid_json(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "test.json"
            save_json(path, [{"unicode": "Risque elevé"}])
            raw = path.read_text(encoding="utf-8")
            parsed = json.loads(raw)
            self.assertEqual(parsed[0]["unicode"], "Risque elevé")


class SaveModelsTests(unittest.TestCase):
    def test_save_and_load_usecases(self):
        uc = UseCase(
            id="UC-099",
            name="Test System",
            description="A test system",
            data_type="personal",
            exposure=3,
            model_type="LLM",
            criticality=2,
            owner="Test Owner",
            assumptions="None",
            ai_act_class="HIGH_RISK",
        )
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "use_cases.json"
            save_models(path, [uc])
            loaded = load_models(path, UseCase)
            self.assertEqual(len(loaded), 1)
            self.assertEqual(loaded[0].id, "UC-099")
            self.assertEqual(loaded[0].ai_act_class, "HIGH_RISK")

    def test_save_and_load_risks(self):
        risk = Risk(
            id="R-099",
            name="Test Risk",
            description="A test risk",
            category="security",
            base_impact=4,
            base_likelihood=3,
            eu_ai_act=["Art. 9"],
            nis2=["Art. 21"],
            dora=[],
            mitigations=["C-001"],
        )
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "risk_catalog.json"
            save_models(path, [risk])
            loaded = load_models(path, Risk)
            self.assertEqual(len(loaded), 1)
            self.assertEqual(loaded[0].id, "R-099")
            self.assertEqual(loaded[0].base_impact, 4)

    def test_save_and_load_controls(self):
        ctrl = Control(
            id="C-099",
            name="Test Control",
            description="A test control",
            type="governance",
        )
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "controls.json"
            save_models(path, [ctrl])
            loaded = load_models(path, Control)
            self.assertEqual(len(loaded), 1)
            self.assertEqual(loaded[0].id, "C-099")


class UseCaseAIActFieldTests(unittest.TestCase):
    def test_ai_act_class_default_none(self):
        raw = {
            "id": "UC-001",
            "name": "Test",
            "description": "Desc",
            "data_type": "personal",
            "exposure": 3,
            "model_type": "LLM",
            "criticality": 3,
            "owner": "Owner",
            "assumptions": "None",
        }
        uc = UseCase.from_dict(raw)
        self.assertIsNone(uc.ai_act_class)

    def test_ai_act_class_from_dict(self):
        raw = {
            "id": "UC-001",
            "name": "Test",
            "description": "Desc",
            "data_type": "personal",
            "exposure": 3,
            "model_type": "LLM",
            "criticality": 3,
            "owner": "Owner",
            "assumptions": "None",
            "ai_act_class": "HIGH_RISK",
        }
        uc = UseCase.from_dict(raw)
        self.assertEqual(uc.ai_act_class, "HIGH_RISK")


if __name__ == "__main__":
    unittest.main()
