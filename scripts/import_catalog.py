import csv, json, pathlib, shutil
from datetime import date, timedelta

root = pathlib.Path(__file__).resolve().parents[1]
source = root/'source/catalog.csv'
with source.open(encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
for r in rows:
    for k in ['categories', 'event_formats', 'languages', 'busy_dates']:
        r[k] = r[k].split('|')
    for k in ['synthetic', 'price_imputed', 'city_imputed']:
        assert r[k] in ('True', 'False')
        r[k] = r[k] == 'True'
    r['price_from_kzt'] = int(r['price_from_kzt'])
    r['max_hours'] = int(r['max_hours']) if r['max_hours'] else None
assert len(rows) == 66 and len({r['id'] for r in rows}) == 66
base = dict(city='Алматы', category='Ведущий', format='корпоратив', budget=1500000, language='', hours=None, wishes='')
def eligible(q):
    return [r for r in rows if r['city']==q['city'] and q['category'] in r['categories'] and q['format'] in r['event_formats'] and q['date'] not in r['busy_dates'] and r['price_from_kzt']<=q['budget']]
days = [(date(2026,9,23)+timedelta(days=d)).isoformat() for d in range(100)]
dense = next({**base,'date':d} for d in days if d>='2026-10-01' and len(eligible({**base,'date':d}))>=5)
rare = next({**base,'date':d,'category':'Флорист','format':'свадьба','budget':300000} for d in days if d>='2026-10-01' and len(eligible({**base,'date':d,'category':'Флорист','format':'свадьба','budget':300000}))==1)
busy = next({**base,'date':d} for d in days if d>='2026-12-01' and len(eligible({**base,'date':d}))==0)
absent = {**dense,'city':'Астана','category':'Декоратор'}
assert not any(r['city']==absent['city'] and absent['category'] in r['categories'] for r in rows)
scenarios = [{'label':'Осенний корпоратив','query':dense},{'label':'Редкая категория','query':rare},{'label':'Без совпадений','query':busy},{'label':'Нет категории','query':absent}]
dest = root
(dest/'dist/data.js').write_text('globalThis.FIREBIRD_DATA = '+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\nglobalThis.FIREBIRD_SCENARIOS = '+json.dumps(scenarios,ensure_ascii=False)+';\n', encoding='utf-8')
(dest/'source').mkdir(exist_ok=True)
# Original source/catalog.csv is intentionally kept unchanged.
print(json.dumps(scenarios,ensure_ascii=False,indent=2))
