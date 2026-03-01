from typing import Any, List


class ValidationError(ValueError):
    pass


def require_str(raw: dict, key: str) -> str:
    value = raw.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"'{key}' must be a non-empty string")
    return value.strip()


def require_str_list(raw: dict, key: str) -> List[str]:
    value = raw.get(key)
    if not isinstance(value, list) or not value:
        raise ValidationError(f"'{key}' must be a non-empty list of strings")
    items = []
    for item in value:
        if not isinstance(item, str) or not item.strip():
            raise ValidationError(f"'{key}' must contain non-empty strings")
        items.append(item.strip())
    return items


def require_optional_str_list(raw: dict, key: str) -> List[str]:
    if key not in raw:
        return []
    value = raw[key]
    if isinstance(value, list) and len(value) == 0:
        return []
    return require_str_list(raw, key)


def require_int_range(raw: dict, key: str, min_value: int, max_value: int) -> int:
    value = raw.get(key)
    if not isinstance(value, int):
        raise ValidationError(f"'{key}' must be an integer")
    if value < min_value or value > max_value:
        raise ValidationError(f"'{key}' must be between {min_value} and {max_value}")
    return value


def require_dict(raw: Any, label: str) -> dict:
    if not isinstance(raw, dict):
        raise ValidationError(f"{label} must be an object")
    return raw


def require_list(raw: Any, label: str) -> list:
    if not isinstance(raw, list):
        raise ValidationError(f"{label} must be an array")
    return raw
