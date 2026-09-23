import json
import os
import unittest
import urllib.error
from unittest.mock import patch, MagicMock
from app.engine import DATA, simulate
from app.ai import explain, call_provider, validate_plan
from app.evidence import facts_for, offline_plan

class EvidenceTests(unittest.TestCase):
    def setUp(self):self.facts=facts_for(simulate(DATA['example']))
    def test_all_facts_bilingual(self):
        for f in self.facts.values():self.assertTrue(f['text']['kk']);self.assertTrue(f['text']['ru']);self.assertTrue(f['source'])
    def test_template_ids_known(self):validate_plan(offline_plan(self.facts,''),self.facts)
    def test_unknown_id_rejected(self):
        with self.assertRaises(ValueError):validate_plan({'status':'answered','sections':[{'heading':'effects','fact_ids':['invented_999']}]},self.facts)
    def test_extra_free_text_rejected(self):
        p=offline_plan(self.facts,'');p['message']='I invent 99 citizens'
        with self.assertRaises(ValueError):validate_plan(p,self.facts)
    def test_unrecognized_heading_rejected(self):
        with self.assertRaises(ValueError):validate_plan({'status':'answered','sections':[{'heading':'best_policies','fact_ids':['budget']}]},self.facts)
    def test_empty_plan_rejected(self):
        with self.assertRaises(ValueError):validate_plan({'status':'answered','sections':[]},self.facts)
    def test_offline_label(self):
        with patch.dict(os.environ,{},clear=True):r=explain(DATA['example'])
        self.assertEqual(r['mode'],'offline');self.assertEqual(r['fallback_reason'],'no_api_key')
    def test_offline_timing_question(self):
        p=offline_plan(self.facts,'Лаг қалай әсер етеді?');self.assertIn('timing',[s['heading'] for s in p['sections']])
    def test_mock_live_path(self):
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('app.ai.call_provider',return_value=(offline_plan(self.facts,''),{'model':'mock-only'})):
            r=explain(DATA['example'])
        self.assertEqual(r['mode'],'llm');self.assertIsNone(r['fallback_reason'])
    def test_provider_error_fallback(self):
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('app.ai.call_provider',side_effect=ValueError('bad refs')):
            r=explain(DATA['example'])
        self.assertEqual(r['mode'],'offline');self.assertEqual(r['fallback_reason'],'provider_error_or_rejected_evidence')
    def test_http_401_fallback(self):
        err=urllib.error.HTTPError('url',401,'Unauthorized',{},None)
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('app.ai.call_provider',side_effect=err):r=explain(DATA['example'])
        self.assertEqual(r['fallback_reason'],'provider_http_401')
    def test_timeout_fallback(self):
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('app.ai.call_provider',side_effect=TimeoutError()):r=explain(DATA['example'])
        self.assertEqual(r['mode'],'offline')
    def test_all_rendered_sentences_from_facts(self):
        with patch.dict(os.environ,{},clear=True):r=explain(DATA['example'],lang='ru')
        for s in r['sections']:
            for f in s['facts']:self.assertEqual(f['text'],self.facts[f['id']]['text']['ru'])
    def test_limits_always_included(self):
        plan={'status':'answered','sections':[{'heading':'effects','fact_ids':['measure_M7']}]}
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('app.ai.call_provider',return_value=(plan,{})):r=explain(DATA['example'])
        ids={f['id'] for s in r['sections'] for f in s['facts']};self.assertTrue({'limits','uncertainty'}.issubset(ids))
    def test_m11_tradeoff_cannot_be_omitted(self):
        from tests.test_engine import picks
        d=picks('M9','M11','M10','M12','M4')
        plan={'status':'answered','sections':[{'heading':'effects','fact_ids':['budget']}]}
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('app.ai.call_provider',return_value=(plan,{})):r=explain(d)
        self.assertIn('tradeoff_M11',{f['id'] for s in r['sections'] for f in s['facts']})
    def test_question_length(self):
        with self.assertRaises(ValueError):explain(DATA['example'],'x'*601)
    def test_question_type(self):
        with self.assertRaises(ValueError):explain(DATA['example'],None)
    def test_language_validation(self):
        with self.assertRaises(ValueError):explain(DATA['example'],lang='xx')
    def test_mock_responses_request_shape(self):
        response={'status':'completed','output':[{'type':'message','content':[{'type':'output_text','text':json.dumps(offline_plan(self.facts,''))}]}],'usage':{}}
        context=MagicMock();context.__enter__.return_value.read.return_value=json.dumps(response).encode()
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('urllib.request.urlopen',return_value=context) as call:
            plan,meta=call_provider(self.facts,'lag','kk')
        req=call.call_args.args[0];body=json.loads(req.data)
        self.assertEqual(req.full_url,'https://api.openai.com/v1/responses')
        self.assertFalse(body['store']);self.assertTrue(body['text']['format']['strict'])
        self.assertEqual(body['text']['format']['type'],'json_schema')
        self.assertNotIn('test-key',json.dumps(body))
        validate_plan(plan,self.facts)
    def test_mock_refusal_falls_closed(self):
        response={'status':'completed','output':[{'type':'message','content':[{'type':'refusal','refusal':'No'}]}]}
        context=MagicMock();context.__enter__.return_value.read.return_value=json.dumps(response).encode()
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('urllib.request.urlopen',return_value=context):
            with self.assertRaises(ValueError):call_provider(self.facts,'question','kk')
    def test_mock_unknown_provider_id_rejected(self):
        response={'status':'completed','output':[{'type':'message','content':[{'type':'output_text','text':json.dumps({'status':'answered','sections':[{'heading':'effects','fact_ids':['fake']}]})}]}]}
        context=MagicMock();context.__enter__.return_value.read.return_value=json.dumps(response).encode()
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-key'}),patch('urllib.request.urlopen',return_value=context):
            with self.assertRaises(ValueError):call_provider(self.facts,'question','kk')

if __name__=='__main__':unittest.main()
