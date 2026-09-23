"""Three-language regression tests. No network/API key is required."""
from __future__ import annotations
import json
import os
import re
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from unittest.mock import MagicMock, patch

from app.ai import call_provider, explain
from app.engine import DATA, simulate, validate
from app.evidence import HEADINGS, facts_for, offline_plan
from app.i18n import error_text
from server import Handler, AI_TIMES
from tests.test_engine import picks

LANGUAGES = {"kk", "ru", "en"}


class LocalizationTests(unittest.TestCase):
    def setUp(self):
        self.result = simulate(DATA["example"])
        self.facts = facts_for(self.result)

    def test_all_catalogue_names_have_three_languages(self):
        for section in ("districts", "metrics", "measures"):
            for item in DATA[section]:
                self.assertTrue(LANGUAGES.issubset(item["name"]))
                for lang in LANGUAGES:
                    self.assertTrue(item["name"][lang].strip())

    def test_all_categories_have_three_languages(self):
        for names in DATA["categories"].values():
            self.assertTrue(LANGUAGES.issubset(names))

    def test_english_names_have_no_cyrillic(self):
        for section in ("districts", "metrics", "measures"):
            for item in DATA[section]:
                self.assertIsNone(re.search(r"[\u0400-\u04ff]", item["name"]["en"]))

    def test_headings_have_three_languages(self):
        for heading in HEADINGS.values():
            self.assertTrue(LANGUAGES.issubset(heading))

    def test_all_facts_have_three_languages(self):
        for decisions in (DATA["example"], picks("M9", "M11", "M10", "M12", "M4")):
            for fact in facts_for(simulate(decisions)).values():
                self.assertTrue(LANGUAGES.issubset(fact["text"]))
                self.assertIsNone(re.search(r"[\u0400-\u04ff]", fact["text"]["en"]))
                self.assertTrue(fact["source"])

    def test_offline_english_explanation(self):
        with patch.dict(os.environ, {}, clear=True):
            response = explain(DATA["example"], lang="en")
        self.assertEqual(response["language"], "en")
        self.assertEqual(response["mode"], "offline")
        self.assertEqual(response["fallback_reason"], "no_api_key")
        for section in response["sections"]:
            self.assertIsNone(re.search(r"[\u0400-\u04ff]", section["heading"]))
            for fact in section["facts"]:
                self.assertEqual(fact["text"], self.facts[fact["id"]]["text"]["en"])

    def test_response_carries_switchable_translations(self):
        with patch.dict(os.environ, {}, clear=True):
            response = explain(DATA["example"], lang="en")
        for section in response["sections"]:
            self.assertTrue(LANGUAGES.issubset(section["heading_i18n"]))
            for fact in section["facts"]:
                self.assertEqual(fact["text_i18n"], self.facts[fact["id"]]["text"])

    def test_kazakh_and_russian_responses_preserved(self):
        for lang in ("kk", "ru"):
            with patch.dict(os.environ, {}, clear=True):
                response = explain(DATA["example"], lang=lang)
            for section in response["sections"]:
                for fact in section["facts"]:
                    self.assertEqual(fact["text"], self.facts[fact["id"]]["text"][lang])

    def test_language_does_not_change_scenario_or_fact_ids(self):
        responses = []
        for lang in ("kk", "ru", "en"):
            with patch.dict(os.environ, {}, clear=True):
                responses.append(explain(DATA["example"], lang=lang))
        self.assertEqual(len({r["scenario_id"] for r in responses}), 1)
        ids = [[f["id"] for s in r["sections"] for f in s["facts"]] for r in responses]
        self.assertEqual(ids[0], ids[1])
        self.assertEqual(ids[1], ids[2])
        self.assertEqual(self.result, simulate(DATA["example"]))

    def test_english_timing_keywords(self):
        for question in ("How does lag work?", "timing", "a delay", "quarters", "deadline"):
            plan = offline_plan(self.facts, question)
            self.assertIn("timing", [s["heading"] for s in plan["sections"]])

    def test_english_synergy_keywords(self):
        for question in ("Explain synergies", "interactions", "tradeoffs"):
            plan = offline_plan(self.facts, question)
            headings = [s["heading"] for s in plan["sections"]]
            self.assertIn("interactions", headings)
            self.assertNotIn("effects", headings)

    def test_english_mock_provider_payload(self):
        plan = offline_plan(self.facts, "")
        reply = {"status": "completed", "output": [{"type": "message", "content": [
            {"type": "output_text", "text": json.dumps(plan)}]}]}
        context = MagicMock()
        context.__enter__.return_value.read.return_value = json.dumps(reply).encode()
        with patch.dict(os.environ, {"OPENAI_API_KEY": "mock-not-a-real-key"}), \
                patch("urllib.request.urlopen", return_value=context) as call:
            call_provider(self.facts, "How does lag work?", "en")
        body = json.loads(call.call_args.args[0].data)
        content = json.loads(body["input"][1]["content"])
        self.assertEqual(content["language"], "en")
        for fact in content["facts"]:
            self.assertEqual(fact["text"], self.facts[fact["id"]]["text"]["en"])

    def test_english_provider_failure_has_localized_fallback(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "mock-not-a-real-key"}), \
                patch("app.ai.call_provider", side_effect=TimeoutError()):
            response = explain(DATA["example"], lang="en")
        self.assertEqual(response["mode"], "offline")
        self.assertEqual(response["sections"][0]["heading"], "How the result works")

    def test_every_validation_error_has_english(self):
        cases = [None, [], [None], [{"measure_id": "M99"}],
                 picks("M7", "M7"), [{"measure_id": "M12", "district_id": "nura"}],
                 [{"measure_id": "M7"}], picks("M3", "M5", "M7", "M8", "M13"),
                 picks("M7", "M8", "M9"), picks("M1", "M3")]
        seen = set()
        for case in cases:
            for err in validate(case)["errors"]:
                seen.add(err["code"])
                self.assertTrue(LANGUAGES.issubset(err["message"]))
                self.assertIsNone(re.search(r"[\u0400-\u04ff]", err["message"]["en"]))
        self.assertEqual(seen, {"TYPE", "COUNT", "SCHEMA", "MEASURE", "DUPLICATE",
                               "CITY_SCOPE", "DISTRICT", "BUDGET", "CATEGORY", "CONFLICT"})

    def test_generic_errors_are_trilingual(self):
        for message in ("Internal server error", "Not found", "invalid_scenario", "unexpected input"):
            self.assertEqual(set(error_text(message)), LANGUAGES)

    def test_unsupported_language_rejected(self):
        with self.assertRaisesRegex(ValueError, "kk, ru and en"):
            explain(DATA["example"], lang="fr")


class LocalizationHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.httpd.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join()

    def request(self, path, payload=None):
        raw = json.dumps(payload).encode() if payload is not None else None
        req = urllib.request.Request(self.base + path, data=raw,
                                     headers={"Content-Type": "application/json"} if raw else {})
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as exc:
            return exc.code, json.loads(exc.read())

    def test_bootstrap_has_english_labels(self):
        status, result = self.request("/api/bootstrap")
        self.assertEqual(status, 200)
        self.assertTrue(all(m["name"]["en"] for m in result["data"]["measures"]))

    def test_english_explanation_endpoint(self):
        AI_TIMES.clear()
        with patch.dict(os.environ, {}, clear=True):
            status, result = self.request("/api/explain", {"decisions": DATA["example"], "lang": "en"})
        self.assertEqual(status, 200)
        self.assertEqual(result["language"], "en")
        self.assertEqual(result["sections"][0]["heading"], "How the result works")

    def test_validation_errors_include_english(self):
        status, result = self.request("/api/simulate", {"decisions": []})
        self.assertEqual(status, 422)
        self.assertIsNone(result["score"])
        self.assertEqual(result["validation"]["errors"][0]["message"]["en"], "Select exactly 5 measures.")

    def test_http_errors_include_three_languages(self):
        status, result = self.request("/api/no-such-endpoint")
        self.assertEqual(status, 404)
        self.assertEqual(set(result["message"]), LANGUAGES)
