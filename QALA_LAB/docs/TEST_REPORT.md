> Бұл — 1.0 нұсқасының бұрынғы есебі. 1.1 үштілді нұсқаның жаңа есебі: [TRILINGUAL_TEST_REPORT.md](TRILINGUAL_TEST_REPORT.md).

# Тесттердің нақты есебі

**Күні:** 2026-09-23. **Орта:** Linux, Python 3.13.5. **Нәтиже:** 105 unittest әдісі өтті (`OK`).

```bash
python -m unittest discover -s tests -v
```

## Қамтылған логика

Түпнұсқа Word XML кестелері мен JSON мәндерінің сәйкестігі; 14 шара/5 аудан/10 көрсеткіш; салмақ пен халық үлесі; бастапқы және мысал есеп; бюджет, дәл бес, қайталану, scope, category, үйлеспейтін жұптар; қалалық әсер; лаг; үш синергия; M11 теріс әсері; clip; қатаң <40; Decimal; 50 ұяшық; канондық паспорт; A/B және бөлек sensitivity.

**1000 жарамды кездейсоқ сценарий** бөлек есептеу нұсқасымен салыстырылды (соңғы нәтиже және барлық ұяшықтар). **120 permutation** бір жиынтықтың таңдау реті әсер етпейтінін тексерді. Бұлар 105 тест әдісінің ішіндегі қосымша жағдайлар; олар жеке 1120 әдіс деп есептелмейді. Бұл тексеру барлық мүмкін сценарийді толық қамтығанын білдірмейді.

AI тесттері нақты есептен факті құрауды, белгілі ID валидациясын, қосымша prose/ID қабылдамауды, mock success, 401, timeout, refusal және fallback жолдарын тексерді. Тірі LLM шақыруы орындалған жоқ.

HTTP тесттері шын жергілікті серверді уақытша портта іске қосты: bootstrap, validate, simulate, compare, explain, sensitivity, статикалық файлдар; 400/403/404/413/415/422 жағдайлары; `.env` және traversal ашылмауы тексерілді. Бұл penetration test немесе production қауіпсіздік сертификаты емес.

## UI тексеруі

Managed Chromium ортасы қалыпты URL навигациясын бұғаттады. Сондықтан жергілікті HTML/CSS/JS браузерге тікелей жүктелді, API сұраулары Python urllib көпірі арқылы **шын localhost серверіне** жіберілді. Бұл қалыпты end-to-end желілік браузер навигациясы тексерілді дегенді білдірмейді. Көпір тесті backend HTTP тесттерін толықтырады.

Орындалған UI тексерулері:

- PASS — Initial state clearly distinguished from a completed scenario
- PASS — Cell trace contains exact lag arithmetic
- PASS — Sensitivity shows changed school cell
- PASS — Offline explanation honestly labeled
- PASS — Scenario save in active page state
- PASS — Four decisions do not receive a scenario score
- PASS — Changed district recomputes full scenario
- PASS — A/B comparison displays changed cells
- PASS — Russian toggle
- PASS — Print report contains all 50 final values
- PASS — No root horizontal overflow at 390px
- PASS — No root horizontal overflow at 768px
- PASS — No root horizontal overflow at 1280px
- PASS — No root horizontal overflow at 1512px
- PASS — No uncaught JavaScript errors

**15 тексеру өтті**, uncaught JavaScript error жоқ. 390, 768, 1280, 1512 px өлшемінде түбірлік көлденең overflow болған жоқ. Кестелердің өз scroll контейнерлері болуы қалыпты. Бұл барлық браузерге WCAG немесе responsive сертификаты емес.

UI-де сақтау белсенді бет күйінде тексерілді. Нақты origin-дегі `localStorage`-тың браузерді жауып қайта ашқаннан кейін сақталуы бұл harness ішінде тексерілген жоқ. Native файл жүктеу, clipboard және қалыпты print-dialog қолданушы ноутбугінде тексерілсін. Print DOM браузер PDF-іне шығарылды; `Example_Passport_KK.pdf` 2 бет.

## Артефакттар

- `TEST_LOG.txt` — unittest нақты шығысы.
- `ui_report.json` — UI тексерулерінің машиналық есебі.
- `product_preview.png`, `trace_preview.png`, `lab_preview.png`, `ai_preview.png`, `mobile_preview.png` — нақты интерфейс render-лері.
- `Example_Passport_KK.pdf` — қолданбаның басып шығару шаблонынан жасалған мысал.
- `examples/reference_output.json` — түпнұсқа тексеру жиынтығының JSON нәтижесі.

## Тексерілмеген немесе жасалмаған

Нақты API кілтімен OpenAI жауабы; Windows/macOS іске қосу; Docker build/run; GitHub Actions run; көп пайдаланушы және жүктеме тесті; сыртқы қауіпсіздік аудиті; жария hosting; нақты пайдаланушы зерттеуі; нақты Астана деректерінің дұрыстығы. Дайын конфигурацияны орындалған тексерумен шатастырмаңыз.

## Тапсыру алдындағы жергілікті тексеру

ZIP-ті шығарып, `server.py --open` іске қосу; «Демо» және бір өзгеріс; S1 ұяшығын ашу; екі сценарий сақтау/салыстыру; JSON экспорт/қайта импорт; PDF басып шығару; нақты API кілтімен `LLM · VERIFIED IDs` жауабы; кілтті өшіріп offline режимі; тест командасының `OK` нәтижесі. `.env` құпия болып қалсын.
