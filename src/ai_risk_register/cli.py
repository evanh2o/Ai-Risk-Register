import argparse
import sys
from pathlib import Path
from typing import Optional

from ai_risk_register.models import Control, Risk, UseCase
from ai_risk_register.report import (
    build_control_map,
    build_risk_map,
    render_json,
    render_markdown,
)
from ai_risk_register.scoring import assess_usecase
from ai_risk_register.storage import load_models
from ai_risk_register.validate import ValidationError


def _data_path(data_dir: Path, stem: str) -> Path:
    candidates = [
        data_dir / f"{stem}.json",
        data_dir / f"{stem}.yaml",
        data_dir / f"{stem}.yml",
    ]
    for path in candidates:
        if path.exists():
            return path
    return candidates[0]


def _load_data(data_dir: Path):
    risks = load_models(_data_path(data_dir, "risk_catalog"), Risk)
    usecases = load_models(_data_path(data_dir, "use_cases"), UseCase)
    controls = load_models(_data_path(data_dir, "controls"), Control)
    return risks, usecases, controls


def list_risks(data_dir: Path) -> int:
    risks, _, _ = _load_data(data_dir)
    for risk in risks:
        print(f"{risk.id} | {risk.category} | {risk.name}")
    return 0


def list_usecases(data_dir: Path) -> int:
    _, usecases, _ = _load_data(data_dir)
    for usecase in usecases:
        print(f"{usecase.id} | {usecase.name} | exposure={usecase.exposure}")
    return 0


def assess(data_dir: Path, usecase_id: str, output: Optional[Path], fmt: str) -> int:
    risks, usecases, controls = _load_data(data_dir)
    usecase = next((item for item in usecases if item.id == usecase_id), None)
    if not usecase:
        print(f"Use case not found: {usecase_id}", file=sys.stderr)
        return 1
    assessments = assess_usecase(usecase, risks)
    risk_map = build_risk_map(risks)
    control_map = build_control_map(controls)
    if fmt == "markdown":
        content = render_markdown(usecase, assessments, risk_map, control_map)
    else:
        content = render_json(usecase, assessments, risk_map)
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(content, encoding="utf-8")
    else:
        print(content)
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="AI Risk Register CLI (Governance & Cybersecurity by Design)"
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("data"),
        help="Path to data directory (default: ./data)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list-risks", help="List risks from the catalog")
    sub.add_parser("list-usecases", help="List AI use cases")

    assess_parser = sub.add_parser("assess", help="Assess a use case")
    assess_parser.add_argument("--usecase-id", required=True, help="Use case ID")
    assess_parser.add_argument(
        "--format",
        choices=["json", "markdown"],
        default="json",
        help="Output format",
    )
    assess_parser.add_argument(
        "--output",
        type=Path,
        help="Output file (omit to print to stdout)",
    )

    args = parser.parse_args()
    try:
        if args.command == "list-risks":
            raise SystemExit(list_risks(args.data_dir))
        if args.command == "list-usecases":
            raise SystemExit(list_usecases(args.data_dir))
        if args.command == "assess":
            raise SystemExit(assess(args.data_dir, args.usecase_id, args.output, args.format))
    except ValidationError as exc:
        print(f"Validation error: {exc}", file=sys.stderr)
        raise SystemExit(2)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
