import json
from dataclasses import asdict
from pathlib import Path
from typing import List, Type, TypeVar

from ai_risk_register.validate import ValidationError, require_list, require_dict

T = TypeVar("T")


def load_json(path: Path) -> list:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    raw_text = path.read_text(encoding="utf-8")
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValidationError(f"Invalid JSON in {path}") from exc
    return require_list(data, f"{path.name} root")


def load_yaml(path: Path) -> list:
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise ValidationError(
            "YAML support requires PyYAML. Install with: pip install PyYAML"
        ) from exc
    raw_text = path.read_text(encoding="utf-8")
    try:
        data = yaml.safe_load(raw_text)
    except yaml.YAMLError as exc:  # type: ignore
        raise ValidationError(f"Invalid YAML in {path}") from exc
    return require_list(data, f"{path.name} root")


def load_data(path: Path) -> list:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    if path.suffix.lower() == ".json":
        return load_json(path)
    if path.suffix.lower() in (".yaml", ".yml"):
        return load_yaml(path)
    raise ValidationError(f"Unsupported file type: {path.suffix}")


def load_models(path: Path, model_cls: Type[T]) -> List[T]:
    data = load_data(path)
    items: List[T] = []
    for index, raw in enumerate(data):
        try:
            record = model_cls.from_dict(require_dict(raw, f"{path.name}[{index}]"))
        except ValidationError as exc:
            raise ValidationError(f"{path.name}[{index}] invalid: {exc}") from exc
        items.append(record)
    return items


def save_json(path: Path, data: list) -> None:
    """Atomically write a list of dicts to a JSON file."""
    tmp = path.with_suffix(".tmp")
    tmp.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    tmp.rename(path)


def save_models(path: Path, items: list) -> None:
    """Serialize frozen dataclass instances and persist to JSON."""
    save_json(path, [asdict(item) for item in items])
