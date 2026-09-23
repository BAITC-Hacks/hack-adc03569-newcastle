"""Deterministic evidence sentences. LLMs may select IDs, not write numbers."""
from __future__ import annotations
from typing import Any
from .engine import DATA, DISTRICTS, MEASURES, METRICS, D

HEADINGS = {
    "summary": {"kk": "Нәтиженің құрылымы", "ru": "Как устроен результат", "en": "How the result works"},
    "effects": {"kk": "Көрсеткіштердегі өзгерістер", "ru": "Изменения показателей", "en": "Indicator changes"},
    "timing": {"kk": "Мерзім және кідіріс", "ru": "Сроки и задержки", "en": "Timing and delays"},
    "interactions": {"kk": "Бірлескен әсер және компромисс", "ru": "Взаимодействия и компромиссы", "en": "Interactions and tradeoffs"},
    "limits": {"kk": "Модельдің шектеулері", "ru": "Ограничения модели", "en": "Model limitations"},
}


def num(x: Any) -> str:
    s = format(D(str(x)), "f")
    return s.rstrip("0").rstrip(".") if "." in s else s


def facts_for(result: dict[str, Any]) -> dict[str, Any]:
    facts: dict[str, Any] = {}
    def put(fid: str, kind: str, kk: str, ru: str, en: str, source: str, cell: str | None = None) -> None:
        facts[fid] = {"id": fid, "kind": kind, "text": {"kk": kk, "ru": ru, "en": en}, "source": source, "cell": cell}
    v, s, b = result["validation"], result["summary"], result["baseline"]
    put("budget", "summary", f"Таңдалған {v['count']} шараның құны — {v['cost']} / 100 бірлік. Қалған {v['remaining']} бірлік нәтиже формуласына бонус қоспайды.",
        f"Стоимость {v['count']} выбранных мер — {v['cost']} из 100 единиц. Остаток {v['remaining']} не добавляет бонус к формуле.",
        f"The {v['count']} selected measures cost {v['cost']} out of 100 units. The remaining {v['remaining']} units do not add a bonus to the formula.", "dataset:section-4")
    put("formula", "summary", "Қорытынды формула қаладағы халық үлесімен өлшенген орташа мәннің 70%-ын, ең төмен аудандық мәннің 30%-ын және критикалық көрсеткіштерге арналған шегерімді біріктіреді. Бұл — ұйымдастырушының синтетикалық моделі, нақты қалаға баға емес.",
        "Итоговая формула объединяет 70% среднего с учётом долей населения, 30% минимального районного значения и вычет за критические показатели. Это синтетическая модель организатора, не оценка реального города.",
        "The final formula combines 70% of the population-weighted average, 30% of the minimum district value and a deduction for critical indicators. This is the organizer's synthetic model, not an assessment of a real city.", "dataset:section-3")
    put("threshold", "summary", f"Мәні 40-тан қатаң төмен көрсеткіштер саны: {b['critical_count']} → {s['critical_count']}. Дәл 40 шегерім туғызбайды. Әр аудан мен көрсеткіш жұбы бөлек саналады.",
        f"Число показателей строго ниже 40: {b['critical_count']} → {s['critical_count']}. Ровно 40 не вызывает вычет. Каждая пара «район × показатель» считается отдельно.",
        f"Indicators strictly below 40: {b['critical_count']} → {s['critical_count']}. Exactly 40 does not trigger a deduction. Each district–indicator pair is counted separately.", "dataset:section-3")
    for p in result["decisions"]:
        m = MEASURES[p["measure_id"]]
        mid, lag = m["id"], m["lag"]
        factor = D(8 - lag) / 8
        target = {"kk": "Бүкіл қала", "ru": "Весь город", "en": "Citywide"}
        if m["scope"] == "district":
            target = DISTRICTS[p["district_id"]]["name"]
        effects = "; ".join(f"{k}: {n:+d} × {num(factor)} = {num(D(n)*factor)}" for k,n in m["effects"].items())
        put(f"measure_{mid}", "effects", f"{mid} · {m['name']['kk']} · {target['kk']}. Модельдегі әсер: {effects}. Бұл өзгерістер 8 тоқсандық кезеңге арналған; нақты тұрғындар санына тікелей аударылмайды.",
            f"{mid} · {m['name']['ru']} · {target['ru']}. Эффекты в модели: {effects}. Изменения относятся к горизонту 8 кварталов и не переводятся напрямую в число реальных жителей.",
        f"{mid} · {m['name']['en']} · {target['en']}. Model effects: {effects}. These changes apply to an 8-quarter horizon and do not translate directly into real resident counts.", "dataset:section-2")
        put(f"lag_{mid}", "timing", f"{mid}: лаг {lag} тоқсан. Толық әсердің (8 − {lag}) / 8 = {num(factor)} бөлігі есепке алынады. Датасет тоқсан сайынғы нақты траекторияны бермейді.",
            f"{mid}: лаг {lag} квартала. Учитывается (8 − {lag}) / 8 = {num(factor)} полного эффекта. Датасет не задаёт точную поквартальную траекторию.",
        f"{mid}: lag of {lag} quarters. The realized fraction of the full effect is (8 − {lag}) / 8 = {num(factor)}. The dataset does not specify an exact quarter-by-quarter trajectory.", "dataset:section-2")
    for cell in result["ledger"]:
        if cell["delta"] != 0:
            d, k = DISTRICTS[cell["district_id"]], METRICS[cell["metric_id"]]
            labels = []
            for term in cell["terms"]:
                labels.append(term.get("measure_id") or "+".join(term["pair"]))
            contributors = ", ".join(labels)
            put(cell["id"], "effects", f"{d['name']['kk']} · {k['name']['kk']} ({k['id']}): {num(cell['before'])} → {num(cell['after'])}. Өзгеріс: {num(cell['delta'])}. Есептегі көздер: {contributors}.",
                f"{d['name']['ru']} · {k['name']['ru']} ({k['id']}): {num(cell['before'])} → {num(cell['after'])}. Изменение: {num(cell['delta'])}. Источники в расчёте: {contributors}.",
        f"{d['name']['en']} · {k['name']['en']} ({k['id']}): {num(cell['before'])} → {num(cell['after'])}. Change: {num(cell['delta'])}. Calculation sources: {contributors}.", "dataset:sections-1-3", cell["id"])
    for syn in result["synergies"]:
        a, c = syn["pair"]
        did = DISTRICTS[syn["district_id"]]
        eff = ", ".join(f"{k} +{v}" for k,v in syn["effects"].items())
        put(f"synergy_{a}_{c}", "interactions", f"{a} + {c}: {did['name']['kk']} ауданында {eff} қосымша әсері іске қосылды. Бонус тұрақты, лагқа көбейтілмейді.",
            f"{a} + {c}: в районе {did['name']['ru']} активирован дополнительный эффект {eff}. Бонус фиксированный, лагом не масштабируется.",
        f"{a} + {c}: an additional effect of {eff} is activated in {did['name']['en']}. The bonus is fixed and is not scaled by lag.", "dataset:section-2-synergies")
    if not result["synergies"]:
        put("no_synergy", "interactions", "Таңдалған жиынтықта каталогтағы үш синергияның ешқайсысы іске қосылмайды.",
            "В выбранном наборе ни одна из трёх синергий каталога не активируется.",
        "None of the catalogue's three synergies is activated in the selected set.", "dataset:section-2-synergies")
    if any(p["measure_id"] == "M11" for p in result["decisions"]):
        put("tradeoff_M11", "interactions", "M11 қарама-қарсы екі әсер береді: B2-ге +10.5, ал T1-ге −1.75. Бұл теріс әсер де жасырылмай есепке алынған; бір көрсеткіштің өзгерісі басқа көрсеткішпен алмастырылмайды.",
            "У M11 разнонаправленные эффекты: B2 +10.5 и T1 −1.75. Отрицательный эффект также включён в расчёт; один показатель не подменяет другой.",
        "M11 has effects in opposite directions: B2 +10.5 and T1 −1.75. The negative effect is also included in the calculation; one indicator does not replace another.", "dataset:section-2")
    put("limits", "limits", "Барлық аудандық мәндер, шығындар мен әсерлер — ұйымдастырушы берген синтетикалық деректер. Модель нақты бюджет, мерзім, денсаулық нәтижесі немесе тұрғындар пікірінің болжамы емес. Экрандағы аудан схемасы географиялық карта емес.",
        "Районные значения, стоимости и эффекты — синтетические данные организатора. Модель не прогнозирует реальные бюджеты, сроки, здоровье или мнения жителей. Схема районов не является географической картой.",
        "All district values, costs and effects are synthetic data provided by the organizer. The model does not predict real budgets, delivery times, health outcomes or resident opinions. The district diagram is not a geographic map.", "brief:pages-1-2; team:schematic")
    put("uncertainty", "limits", "Датасет әсерлердің ықтималдығын, сенімділік интервалдарын және нақты себеп-салдар байланысын бермейді. «Мерзім зертханасы» — команда қосқан бөлек болжам; ол ресми сценарийді өзгертпейді.",
        "Датасет не содержит вероятностей эффектов, доверительных интервалов или подтверждённых причинных связей. «Лаборатория сроков» — отдельное допущение команды; официальный сценарий не меняется.",
        "The dataset provides no effect probabilities, confidence intervals or confirmed causal relationships. The timing lab is a separate team-added assumption; it does not change the official scenario.", "dataset:section-2; team:sensitivity")
    return facts


def offline_plan(facts: dict[str, Any], question: str) -> dict[str, Any]:
    """Transparent keyword fallback. Not a language model."""
    q = question.lower()
    groups: dict[str, list[str]] = {"summary": ["budget", "formula", "threshold"]}
    if any(x in q for x in ("лаг", "lag", "кідір", "мерзім", "срок", "тоқсан", "delay", "timing", "quarter", "deadline")):
        groups["timing"] = [k for k in facts if k.startswith("lag_")]
    elif any(x in q for x in ("синерг", "компром", "trade", "бірлес", "synerg", "interaction")):
        groups["interactions"] = [k for k, f in facts.items() if f["kind"] == "interactions"]
    else:
        groups["effects"] = [k for k in facts if k.startswith("measure_")]
        groups["interactions"] = [k for k, f in facts.items() if f["kind"] == "interactions"]
    groups["limits"] = ["limits", "uncertainty"]
    return {"status": "answered", "sections": [{"heading": h, "fact_ids": ids[:5]} for h,ids in groups.items() if ids]}
