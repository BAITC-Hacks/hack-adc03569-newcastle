"""Deterministic implementation of the organizer's synthetic dataset.

Only `simulate` is a public scoring entry point. It requires a fully valid
five-decision set. All arithmetic is Decimal; rounding is presentation-only.
No LLM output participates in this module.
"""
from __future__ import annotations

from collections import Counter
from decimal import Decimal
from hashlib import sha256
import json
from pathlib import Path
from typing import Any

D = Decimal
ENGINE_VERSION = "1.1.0"
DATA_PATH = Path(__file__).with_name("dataset.json")
DATA: dict[str, Any] = json.loads(DATA_PATH.read_text(encoding="utf-8"))
METRICS = {m["id"]: m for m in DATA["metrics"]}
DISTRICTS = {d["id"]: d for d in DATA["districts"]}
MEASURES = {m["id"]: m for m in DATA["measures"]}
DATA_HASH = sha256(json.dumps(DATA, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
ENGINE_HASH = sha256(Path(__file__).read_bytes()).hexdigest()
assert sum(D(m["weight"]) for m in METRICS.values()) == 1
assert sum(D(d["population_share"]) for d in DISTRICTS.values()) == 1
assert len(MEASURES) == 14 and len(DISTRICTS) == 5 and len(METRICS) == 10


def jsonable(value: Any) -> Any:
    """Convert at the API boundary, after all calculations are complete."""
    if isinstance(value, D):
        return float(value)
    if isinstance(value, dict):
        return {k: jsonable(v) for k, v in value.items()}
    if isinstance(value, (tuple, list)):
        return [jsonable(v) for v in value]
    return value


class InvalidScenario(ValueError):
    def __init__(self, validation: dict[str, Any]):
        self.validation = validation
        super().__init__("Scenario failed validation")


def _error(code: str, kk: str, ru: str, en: str) -> dict[str, Any]:
    return {"code": code, "message": {"kk": kk, "ru": ru, "en": en}}


def validate(decisions: Any, *, complete: bool = True) -> dict[str, Any]:
    """Validate exact schema, scope, budget, categories and incompatibilities.

    complete=False is only for editing drafts; it never grants a score.
    For city measures the district_id key must be absent, including null.
    """
    errors: list[dict[str, Any]] = []
    if not isinstance(decisions, list):
        return {"valid": False, "complete": False, "cost": 0, "remaining": 100,
                "count": 0, "category_counts": {}, "errors": [_error("TYPE", "Шешімдер тізім болуы керек.", "Решения должны быть массивом.", "Decisions must be an array.")]}
    if len(decisions) > 5 or (complete and len(decisions) != 5):
        errors.append(_error("COUNT", "Дәл 5 шара таңдаңыз.", "Выберите ровно 5 мероприятий.", "Select exactly 5 measures."))
    if len(decisions) > 50:
        return {"valid": False, "complete": False, "cost": 0, "remaining": 100,
                "count": len(decisions), "category_counts": {}, "errors": errors}
    seen: set[str] = set()
    categories: Counter[str] = Counter()
    parsed: dict[str, dict[str, Any]] = {}
    cost = 0
    for item in decisions:
        if not isinstance(item, dict) or not set(item).issubset({"measure_id", "district_id"}):
            errors.append(_error("SCHEMA", "Шараның JSON құрылымы дұрыс емес.", "Неверная JSON-структура мероприятия.", "Invalid JSON structure for a measure."))
            continue
        mid = item.get("measure_id")
        if not isinstance(mid, str) or mid not in MEASURES:
            errors.append(_error("MEASURE", "Каталогта жоқ шара таңдалған.", "Выбрано неизвестное мероприятие.", "An unknown measure was selected."))
            continue
        m = MEASURES[mid]
        if mid in seen:
            errors.append(_error("DUPLICATE", f"{mid}: бір шараны қайталауға болмайды.", f"{mid}: повторное использование запрещено.", f"{mid}: each measure can be selected only once."))
        seen.add(mid)
        parsed[mid] = item
        cost += m["cost"]
        categories[m["category"]] += 1
        district = item.get("district_id")
        if m["scope"] == "city":
            if "district_id" in item:
                errors.append(_error("CITY_SCOPE", f"{mid}: қалалық шараға аудан көрсетілмейді.", f"{mid}: у городской меры район не указывается.", f"{mid}: do not specify a district for a citywide measure."))
        elif not isinstance(district, str) or district not in DISTRICTS:
            errors.append(_error("DISTRICT", f"{mid}: каталогтағы бір ауданды таңдаңыз.", f"{mid}: выберите один район из каталога.", f"{mid}: select one district from the catalogue."))
    if cost > 100:
        errors.append(_error("BUDGET", "100 бірлік бюджеттен асып кетті.", "Превышен бюджет 100 единиц.", "The budget of 100 units has been exceeded."))
    if any(count > 2 for count in categories.values()):
        errors.append(_error("CATEGORY", "Бір бағыттан ең көбі 2 шара таңдауға болады.", "Не более 2 мер из одного направления.", "Select no more than 2 measures from one category."))
    for rule in DATA["incompatibilities"]:
        a, b = rule["pair"]
        if a in parsed and b in parsed:
            same = (isinstance(parsed[a].get("district_id"), str)
                    and parsed[a].get("district_id") == parsed[b].get("district_id"))
            if rule["scope"] == "any" or same:
                errors.append(_error("CONFLICT", f"{a} + {b}: бұл үйлесімге ережелер тыйым салады.", f"{a} + {b}: сочетание запрещено правилами.", f"{a} + {b}: this combination is prohibited by the rules."))
    return {"valid": not errors, "complete": len(decisions) == 5 and not errors,
            "cost": cost, "remaining": 100 - cost, "count": len(decisions),
            "category_counts": dict(categories), "errors": errors}


def canonical_decisions(decisions: list[dict[str, str]]) -> list[dict[str, str]]:
    """Canonical order removes selection-order dependence from the passport."""
    return [dict(x) for x in sorted(decisions, key=lambda x: int(x["measure_id"][1:]))]


def _clip(number: D) -> D:
    return max(D(0), min(D(100), number))


def _compute(decisions: list[dict[str, str]], lag_overrides: dict[str, int] | None = None) -> dict[str, Any]:
    """Internal arithmetic only. May evaluate baseline, never exposed as draft score."""
    decisions = canonical_decisions(decisions)
    lag_overrides = lag_overrides or {}
    selected = {p["measure_id"]: p for p in decisions}
    traces = {did: {k: [] for k in METRICS} for did in DISTRICTS}
    for p in decisions:
        m = MEASURES[p["measure_id"]]
        lag = lag_overrides.get(m["id"], m["lag"])
        factor = max(D(0), D(8 - lag) / D(8))
        targets = list(DISTRICTS) if m["scope"] == "city" else [p["district_id"]]
        for did in targets:
            for k, effect in m["effects"].items():
                traces[did][k].append({"kind": "measure", "measure_id": m["id"],
                    "full": effect, "lag": lag, "factor": factor, "delta": D(effect) * factor,
                    "source": "dataset:section-2"})
    synergies = []
    for rule in DATA["synergies"]:
        if all(mid in selected for mid in rule["pair"]):
            did = selected[rule["district_of"]]["district_id"]
            synergies.append({"pair": rule["pair"], "district_id": did, "effects": rule["effects"]})
            for k, value in rule["effects"].items():
                traces[did][k].append({"kind": "synergy", "pair": rule["pair"],
                    "delta": D(value), "source": "dataset:section-2-synergies"})
    rows, ledger, critical = [], [], []
    for did, district in DISTRICTS.items():
        before = {k: D(v) for k, v in district["metrics"].items()}
        after = {}
        for k in METRICS:
            effects = traces[did][k]
            raw = before[k] + sum((x["delta"] for x in effects), D(0))
            after[k] = _clip(raw)
            if after[k] < 40:
                critical.append({"district_id": did, "metric_id": k, "value": after[k]})
            ledger.append({"id": f"cell_{did}_{k}", "district_id": did, "metric_id": k,
                "before": before[k], "terms": effects, "raw_after": raw,
                "clip_adjustment": after[k] - raw, "after": after[k],
                "delta": after[k] - before[k], "weight": D(METRICS[k]["weight"]),
                "weighted_after": after[k] * D(METRICS[k]["weight"]),
                "critical": after[k] < 40, "exact_after": str(after[k])})
        before_d = sum(before[k] * D(METRICS[k]["weight"]) for k in METRICS)
        after_d = sum(after[k] * D(METRICS[k]["weight"]) for k in METRICS)
        rows.append({"id": did, "name": district["name"], "population_share": D(district["population_share"]),
            "before": before, "after": after, "delta": {k: after[k] - before[k] for k in METRICS},
            "before_value": before_d, "value": after_d, "value_delta": after_d - before_d})
    average = sum(row["value"] * row["population_share"] for row in rows)
    minimum = min(row["value"] for row in rows)
    score = D("0.7") * average + D("0.3") * minimum - D(len(critical))
    return {"districts": rows, "ledger": ledger, "synergies": synergies,
            "summary": {"score": score, "exact_score": str(score), "average": average,
                        "minimum": minimum, "critical_count": len(critical), "critical_cells": critical}}


def baseline() -> dict[str, Any]:
    result = _compute([])
    result["kind"] = "baseline_not_a_scenario"
    return result


def simulate(decisions: Any) -> dict[str, Any]:
    check = validate(decisions)
    if not check["valid"]:
        raise InvalidScenario(check)
    canonical = canonical_decisions(decisions)
    result = _compute(canonical)
    base = baseline()["summary"]
    s = result["summary"]
    decomposition = {
        "population_term": D("0.7") * (s["average"] - base["average"]),
        "minimum_term": D("0.3") * (s["minimum"] - base["minimum"]),
        "critical_term": D(base["critical_count"] - s["critical_count"]),
    }
    total_delta = s["score"] - base["score"]
    assert sum(decomposition.values()) == total_delta
    identity = {"engine_version": ENGINE_VERSION, "engine_sha256": ENGINE_HASH,
                "dataset_sha256": DATA_HASH, "decisions": canonical}
    digest = sha256(json.dumps(identity, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
    result.update({"kind": "official_synthetic_scenario", "decisions": canonical,
        "validation": check, "baseline": base, "score_delta": total_delta,
        "decomposition": decomposition,
        "passport": {**identity, "scenario_sha256": digest, "short_id": digest[:12],
            "schema_version": 1, "precision": "Decimal; no intermediate rounding",
            "synthetic": True, "signature": False}})
    return result


def compare(a: Any, b: Any) -> dict[str, Any]:
    left, right = simulate(a), simulate(b)
    changes = []
    for x, y in zip(left["districts"], right["districts"]):
        for k in METRICS:
            changes.append({"district_id": x["id"], "metric_id": k,
                            "a": x["after"][k], "b": y["after"][k],
                            "delta": y["after"][k] - x["after"][k]})
    return {"a": left, "b": right, "changes": changes,
            "interpretation": "B minus A; descriptive arithmetic, not a recommendation or ranking."}


def sensitivity(decisions: Any, measure_id: Any, extra_lag: Any) -> dict[str, Any]:
    """Clearly separate extension, NOT organizer data or an official scenario score.

    Hold cost and all other assumptions fixed; delay one selected measure.
    Retain fixed synergy bonuses under the organizer's terminal rule.
    No likelihood or real-world forecast is attached to this experiment.
    """
    official = simulate(decisions)
    selected = {x["measure_id"] for x in official["decisions"]}
    if not isinstance(measure_id, str) or measure_id not in selected:
        raise ValueError("Select a measure already in the valid scenario")
    if type(extra_lag) is not int or not 0 <= extra_lag <= 3:
        raise ValueError("extra_lag must be an integer from 0 to 3")
    alternative = _compute(official["decisions"], {measure_id: MEASURES[measure_id]["lag"] + extra_lag})
    changes = []
    for a, b in zip(official["districts"], alternative["districts"]):
        for k in METRICS:
            if a["after"][k] != b["after"][k]:
                changes.append({"district_id": a["id"], "metric_id": k,
                    "official": a["after"][k], "experiment": b["after"][k],
                    "delta": b["after"][k] - a["after"][k]})
    return {"kind": "team_added_sensitivity_experiment", "official_unchanged": True,
        "measure_id": measure_id, "extra_lag": extra_lag, "changes": changes,
        "assumptions": {"costs_fixed": True, "other_lags_fixed": True,
                        "synergy_bonuses_fixed": True, "horizon": 8},
        "probability": None, "scenario_score": None}
