"""Run: python -m unittest discover -s tests -v"""
import copy
import itertools
import json
import math
import random
import unittest
from decimal import Decimal as D
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from app.engine import (DATA, DISTRICTS, MEASURES, METRICS, InvalidScenario,
    _clip, _compute, baseline, canonical_decisions, compare, jsonable, sensitivity, simulate, validate)


def picks(*ids):
    return [{"measure_id": mid, **({"district_id": "nura"} if MEASURES[mid]["scope"] == "district" else {})} for mid in ids]


def independent_reference(decisions):
    """Independent float implementation, intentionally not calling engine helpers."""
    values={d['id']:dict(d['metrics']) for d in DATA['districts']}
    selected={p['measure_id']:p for p in decisions}
    for p in decisions:
        m=next(x for x in DATA['measures'] if x['id']==p['measure_id'])
        targets=list(values) if m['scope']=='city' else [p['district_id']]
        for did in targets:
            for k,v in m['effects'].items(): values[did][k] += v*((8-m['lag'])/8)
    for a,b,k in [('M1','M2','T1'),('M10','M12','B1'),('M5','M6','E2')]:
        if a in selected and b in selected: values[selected[a]['district_id']][k] += 2
    for did in values:
        for k in values[did]: values[did][k]=min(100,max(0,values[did][k]))
    weights=[.10,.10,.09,.11,.11,.11,.09,.09,.10,.10]
    keys=['T1','T2','E1','E2','S1','S2','B1','B2','C1','C2']
    totals={did:sum(values[did][k]*w for k,w in zip(keys,weights)) for did in values}
    average=sum(totals[d['id']]*float(d['population_share']) for d in DATA['districts'])
    critical=sum(v<40 for row in values.values() for v in row.values())
    return .7*average+.3*min(totals.values())-critical, values


class SourceTests(unittest.TestCase):
    def test_catalog_dimensions(self):
        self.assertEqual((len(DISTRICTS),len(METRICS),len(MEASURES)),(5,10,14))
    def test_weights_sum_exactly(self):
        self.assertEqual(sum(D(m['weight']) for m in METRICS.values()),D(1))
    def test_population_sum_exactly(self):
        self.assertEqual(sum(D(d['population_share']) for d in DISTRICTS.values()),D(1))
    def test_original_word_numeric_tables(self):
        source=Path(__file__).resolve().parents[1]/'sources/dataset.docx'
        with ZipFile(source) as archive: root=ET.fromstring(archive.read('word/document.xml'))
        ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        tables=[]
        for table in root.findall('.//w:tbl',ns):
            rows=[]
            for row in table.findall('w:tr',ns):
                rows.append([''.join(t.text or '' for t in c.findall('.//w:t',ns)) for c in row.findall('w:tc',ns)])
            tables.append(rows)
        for original,district in zip(tables[1][1:],DATA['districts']):
            self.assertEqual(original[0],district['name']['ru'])
            self.assertEqual(D(original[1]),D(district['population_share']))
            self.assertEqual(list(map(int,original[2:12])),list(district['metrics'].values()))
        for original,measure in zip(tables[2][1:],DATA['measures']):
            self.assertEqual(original[0],measure['id'])
            self.assertEqual(original[2],measure['name']['ru'])
            self.assertEqual(int(original[4]),measure['cost'])
            self.assertEqual(int(original[5]),measure['lag'])
            import re
            effects={k:int(v.replace('−','-').replace(' ','')) for k,v in re.findall(r'([TESBC][12])\s*([+−-]\s*\d+)',original[6])}
            self.assertEqual(effects,measure['effects'])
        self.assertEqual(tables[4][1][1:],[m['weight'] for m in DATA['metrics']])
    def test_initial_district_reference_column(self):
        for row in baseline()['districts']:
            self.assertEqual(row['value'],D(DISTRICTS[row['id']]['reference_district_value']))


class ValidationTests(unittest.TestCase):
    def test_example_valid(self): self.assertTrue(validate(DATA['example'])['valid'])
    def test_budget_example(self): self.assertEqual(validate(DATA['example'])['cost'],95)
    def test_empty_no_score(self):
        with self.assertRaises(InvalidScenario): simulate([])
    def test_four_no_score(self):
        with self.assertRaises(InvalidScenario): simulate(DATA['example'][:4])
    def test_six_no_score(self): self.assertFalse(validate(DATA['example']+picks('M9'))['valid'])
    def test_partial_validation_not_scoring(self):
        self.assertTrue(validate(picks('M7'),complete=False)['valid'])
        self.assertFalse(validate(picks('M7'),complete=False)['complete'])
    def test_duplicate_other_district(self):
        d=picks('M7','M8','M10','M12','M7');d[-1]['district_id']='almaty'
        self.assertIn('DUPLICATE',[e['code'] for e in validate(d)['errors']])
    def test_unknown_measure(self): self.assertFalse(validate([{'measure_id':'M99'}],complete=False)['valid'])
    def test_unknown_district(self): self.assertFalse(validate([{'measure_id':'M7','district_id':'moon'}],complete=False)['valid'])
    def test_missing_district(self): self.assertFalse(validate([{'measure_id':'M7'}],complete=False)['valid'])
    def test_city_district_forbidden(self): self.assertFalse(validate([{'measure_id':'M12','district_id':'nura'}],complete=False)['valid'])
    def test_city_null_forbidden(self): self.assertFalse(validate([{'measure_id':'M12','district_id':None}],complete=False)['valid'])
    def test_district_wrong_type(self): self.assertFalse(validate([{'measure_id':'M7','district_id':[]}],complete=False)['valid'])
    def test_non_list(self):
        for x in (None,{},'M7',15,True): self.assertFalse(validate(x)['valid'])
    def test_malformed_items(self):
        for x in (None,[],True,14,'M7',{'measure_id':[]},{'measure_id':'M7','district_id':'nura','score':100}):
            self.assertFalse(validate([x],complete=False)['valid'])
    def test_category_limit(self):
        self.assertIn('CATEGORY',[e['code'] for e in validate(picks('M7','M8','M9','M10','M12'))['errors']])
    def test_three_categories_allowed(self):
        self.assertTrue(validate(picks('M2','M3','M7','M9','M12'))['valid'])
    def test_budget_exact_100(self):
        self.assertEqual(validate(picks('M2','M3','M7','M9','M12'))['cost'],100)
    def test_budget_over(self):
        self.assertIn('BUDGET',[e['code'] for e in validate(picks('M3','M13','M5','M7','M2'))['errors']])
    def test_m1_m3_any_district(self):
        d=picks('M1','M3');d[1]['district_id']='almaty'
        self.assertIn('CONFLICT',[e['code'] for e in validate(d,complete=False)['errors']])
    def test_m4_m7_same_district(self): self.assertFalse(validate(picks('M4','M7'),complete=False)['valid'])
    def test_m4_m7_different_district(self):
        d=picks('M4','M7');d[1]['district_id']='almaty'
        self.assertTrue(validate(d,complete=False)['valid'])
    def test_m5_m13_same_district(self): self.assertFalse(validate(picks('M5','M13'),complete=False)['valid'])
    def test_m5_m13_different_district(self):
        d=picks('M5','M13');d[1]['district_id']='almaty'
        self.assertTrue(validate(d,complete=False)['valid'])
    def test_very_large_list_rejected(self): self.assertFalse(validate([{}]*10000)['valid'])


class ArithmeticTests(unittest.TestCase):
    def test_baseline_exact(self): self.assertEqual(baseline()['summary']['score'],D('52.55768'))
    def test_baseline_average(self): self.assertEqual(baseline()['summary']['average'],D('56.8624'))
    def test_example_exact(self): self.assertEqual(simulate(DATA['example'])['summary']['score'],D('56.54307'))
    def test_example_critical_zero(self): self.assertEqual(simulate(DATA['example'])['summary']['critical_count'],0)
    def test_example_lag(self):
        row=next(x for x in simulate(DATA['example'])['ledger'] if x['id']=='cell_nura_S1')
        self.assertEqual(row['after'],D(48));self.assertEqual(row['delta'],D(10))
    def test_city_measure_all_five(self):
        r=simulate(DATA['example'])
        for d in r['districts']:self.assertEqual(d['delta']['C2'],D('4.375'))
    def test_district_measure_only_target(self):
        r=simulate(DATA['example'])
        for d in r['districts']:
            self.assertEqual(d['delta']['S1'],D(10) if d['id']=='nura' else D(0))
    def test_m10_m12_fixed_synergy(self):
        row=next(x for x in simulate(DATA['example'])['ledger'] if x['id']=='cell_nura_B1')
        self.assertEqual(row['delta'],D('12.5'))
        self.assertEqual(row['terms'][-1]['delta'],D(2))
    def test_m1_m2_fixed_synergy(self):
        d=picks('M1','M2','M7','M10','M12')
        row=next(x for x in simulate(d)['ledger'] if x['id']=='cell_nura_T1')
        self.assertEqual(row['delta'],D('9.5'))
    def test_m5_m6_fixed_synergy(self):
        d=picks('M5','M6','M9','M10','M12')
        row=next(x for x in simulate(d)['ledger'] if x['id']=='cell_nura_E2')
        self.assertEqual(row['delta'],D('12.25'))
    def test_synergy_not_other_districts(self):
        r=simulate(DATA['example'])
        other=next(x for x in r['ledger'] if x['id']=='cell_almaty_B1')
        self.assertEqual(other['delta'],0)
    def test_m11_negative_effect(self):
        r=simulate(picks('M9','M11','M10','M12','M4'))
        row=next(x for x in r['ledger'] if x['id']=='cell_nura_T1')
        self.assertEqual(row['delta'],D('-1.75'))
    def test_critical_strictly_below_40(self):
        with patch.dict(DISTRICTS['nura']['metrics'],{'S1':40,'S2':40}):
            self.assertEqual(baseline()['summary']['critical_count'],0)
    def test_critical_39(self):
        with patch.dict(DISTRICTS['nura']['metrics'],{'S1':39,'S2':40}):
            self.assertEqual(baseline()['summary']['critical_count'],1)
    def test_clipping_both_ends(self):
        self.assertEqual(_clip(D(-4)),D(0));self.assertEqual(_clip(D(107)),D(100))
    def test_clipping_after_all_additions(self):
        with patch.dict(DISTRICTS['nura']['metrics'],{'B1':99,'T1':0}):
            r=simulate(picks('M9','M11','M10','M12','M4'))
            rows={c['id']:c for c in r['ledger']}
            self.assertEqual(rows['cell_nura_B1']['after'],D(100))
            self.assertLess(rows['cell_nura_B1']['clip_adjustment'],0)
            self.assertEqual(rows['cell_nura_T1']['after'],D(0))
    def test_exact_decomposition(self):
        r=simulate(DATA['example'])
        self.assertEqual(sum(r['decomposition'].values()),r['score_delta'])
    def test_fifty_complete_ledger_rows(self):
        r=simulate(DATA['example']);self.assertEqual(len(r['ledger']),50)
        self.assertEqual(len({x['id'] for x in r['ledger']}),50)
    def test_order_invariance_all_120(self):
        expected=simulate(DATA['example'])
        for order in itertools.permutations(DATA['example']):
            r=simulate(list(order));self.assertEqual(r['summary'],expected['summary'])
            self.assertEqual(r['passport'],expected['passport'])
            self.assertEqual(r['ledger'],expected['ledger'])
    def test_input_not_mutated(self):
        d=copy.deepcopy(DATA['example']);before=copy.deepcopy(d);simulate(d);self.assertEqual(d,before)
    def test_randomized_1000_valid_scenarios(self):
        rng=random.Random(1729);count=0
        while count<1000:
            ids=rng.sample(list(MEASURES),5)
            d=[{'measure_id':mid,**({'district_id':rng.choice(list(DISTRICTS))} if MEASURES[mid]['scope']=='district' else {})} for mid in ids]
            if not validate(d)['valid']:continue
            expected,values=independent_reference(d);actual=simulate(d)
            self.assertAlmostEqual(float(actual['summary']['score']),expected,places=10)
            for row in actual['districts']:
                for k,v in row['after'].items():self.assertAlmostEqual(float(v),values[row['id']][k],places=12)
            count+=1
        self.assertEqual(count,1000)
    def test_json_serializable(self):
        json.dumps(jsonable(simulate(DATA['example'])),allow_nan=False)
    def test_passthrough_score_not_accepted(self):
        d=copy.deepcopy(DATA['example']);d[0]['score']=100
        with self.assertRaises(InvalidScenario):simulate(d)
    def test_hash_changes_with_district(self):
        d=copy.deepcopy(DATA['example']);d[-1]['district_id']='almaty'
        self.assertNotEqual(simulate(d)['passport']['scenario_sha256'],simulate(DATA['example'])['passport']['scenario_sha256'])


class ExtensionTests(unittest.TestCase):
    def test_compare_identical_zero(self):
        r=compare(DATA['example'],DATA['example']);self.assertTrue(all(c['delta']==0 for c in r['changes']))
    def test_compare_reversed_sign(self):
        a=DATA['example'];b=copy.deepcopy(a);b[-1]['district_id']='almaty'
        x,y=compare(a,b),compare(b,a)
        self.assertTrue(all(p['delta']==-q['delta'] for p,q in zip(x['changes'],y['changes'])))
    def test_compare_rejects_invalid(self):
        with self.assertRaises(InvalidScenario):compare([],DATA['example'])
    def test_lab_zero_delay(self):self.assertEqual(sensitivity(DATA['example'],'M7',0)['changes'],[])
    def test_lab_one_delay_s1(self):
        r=sensitivity(DATA['example'],'M7',1)
        self.assertEqual(r['changes'][0]['delta'],D(-2));self.assertEqual(r['changes'][0]['experiment'],D(46))
    def test_lab_no_official_score(self):self.assertIsNone(sensitivity(DATA['example'],'M7',1)['scenario_score'])
    def test_lab_does_not_mutate_official(self):
        before=simulate(DATA['example']);sensitivity(DATA['example'],'M7',3)
        self.assertEqual(before,simulate(DATA['example']))
    def test_lab_rejects_bad_extra_lag(self):
        for x in (-1,4,True,1.0,'1'):
            with self.assertRaises(ValueError):sensitivity(DATA['example'],'M7',x)
    def test_lab_rejects_unselected_measure(self):
        with self.assertRaises(ValueError):sensitivity(DATA['example'],'M1',1)

if __name__=='__main__':unittest.main()
