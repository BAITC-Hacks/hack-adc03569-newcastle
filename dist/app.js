(function () {
  'use strict';
  const engine = FirebirdEngine, data = FIREBIRD_DATA, matcher = engine.createMatcher(data), e = engine.enums(data);
  const $ = id => document.getElementById(id), form = $('request-form');
  let lastResult = null;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const labels = { busy: 'Заняты на дату', budget: 'Выше бюджета', format: 'Не берут формат', language: 'Нет нужного языка', hours: 'Не хватает часов' };
  for (const [id, list] of [['city', e.cities], ['category', e.categories], ['format', e.formats], ['language', e.languages]]) {
    list.forEach(v => { const option = document.createElement('option'); option.value = v; option.textContent = v[0].toUpperCase() + v.slice(1); $(id).append(option); });
  }
  function rawQuery() { return Object.fromEntries(new FormData(form)); }
  function setQuery(q) { for (const key of ['city', 'date', 'format', 'category', 'budget', 'hours', 'language', 'wishes']) $(key).value = q[key] ?? ''; }
  function renderCard(card, index, query) {
    const p = card.profile;
    const attrs = ['<span class="attribute available">' + escape(engine.dateLabel(query.date)) + ' · свободен</span>', '<span class="attribute">' + escape(p.languages.join(' · ')) + '</span>', '<span class="attribute">' + (p.max_hours === null ? 'Без привязки к часам' : 'До ' + p.max_hours + ' часов') + '</span>'];
    const badges = ['<span class="source-badge' + (p.synthetic ? ' synthetic' : '') + '">' + (p.synthetic ? 'Синтетический профиль' : 'Анонимизированный профиль') + '</span>'];
    if (p.price_imputed) badges.push('<span class="source-badge imputed">Цена дополнена</span>');
    if (p.city_imputed) badges.push('<span class="source-badge imputed">Город дополнен</span>');
    return '<article class="card" data-profile-id="' + escape(p.id) + '"><div class="card-head"><div class="identity"><span class="rank">0' + (index + 1) + '</span><div><h3 class="name">' + escape(p.anon_name) + '</h3><div class="meta">' + escape(query.category) + ' · ' + escape(p.city) + '</div></div></div><div class="price"><strong>от ' + escape(engine.money(p.price_from_kzt)) + '</strong><span>за мероприятие</span></div></div><div class="attributes">' + attrs.join('') + '</div><div class="explanation"><span class="why-label">ПОЧЕМУ ПОДХОДИТ</span><p>' + escape(card.explanation) + '</p><p class="quote"><span class="quote-prefix">' + (card.wishMatch ? 'Совпадения с пожеланиями в описании: ' : 'Из описания: ') + '</span>«' + escape(card.quote) + '»</p></div><div class="card-footer">' + badges.join('') + '</div><details class="profile-details"><summary>Подробнее о профиле <span class="profile-id">' + escape(p.id) + '</span></summary><p>' + escape(p.description) + '</p><p><b>Категории:</b> ' + escape(p.categories.join(', ')) + '<br><b>Форматы:</b> ' + escape(p.event_formats.join(', ')) + '<br><b>Начальная цена:</b> ' + escape(engine.money(p.price_from_kzt)) + (p.price_imputed ? ' — дополнена при подготовке датасета' : '') + '<br><b>Город:</b> ' + escape(p.city) + (p.city_imputed ? ' — дополнен при подготовке датасета' : '') + '</p></details></article>';
  }
  function render(result) {
    const q = result.query, titles = { matched: 'Есть из кого выбрать', no_category: 'Такой категории пока нет', no_match: 'Условия не совпали' };
    $('result-title').textContent = titles[result.status];
    $('result-number').textContent = String(result.cards.length).padStart(2, '0');
    $('result-summary').textContent = q.city + ' · ' + engine.dateLabel(q.date) + ' 2026 · ' + q.format + ' · до ' + engine.money(q.budget) + '. ' + (result.status === 'no_category' ? 'В этом городе нет профилей категории «' + q.category + '».' : 'В категории: ' + result.poolCount + '. Проходят все условия: ' + result.eligibleCount + '. Показано: ' + result.cards.length + '.');
    $('cards').innerHTML = result.cards.map((card, i) => renderCard(card, i, q)).join('');
    $('empty-state').hidden = !!result.cards.length;
    $('empty-state').innerHTML = result.status === 'no_category' ? '<div class="empty-symbol" aria-hidden="true">⊘</div><h3>В каталоге нет этой категории</h3><p>В городе «' + escape(q.city) + '» нет категории «' + escape(q.category) + '». Выберите другую категорию или город.</p>' : '<div class="empty-symbol" aria-hidden="true">⌁</div><h3>Никто не проходит все условия</h3><p>В городе есть подходящая категория, но её подрядчики заняты или не соответствуют другим условиям. Причины указаны ниже.</p>';
    const counts = Object.entries(result.counts).filter(([, count]) => count);
    const shortage = result.cards.length < 3 && result.status === 'matched';
    $('diagnostics').innerHTML = result.poolCount ? '<h3>' + (shortage ? 'Почему меньше трёх?' : 'Что повлияло на выбор') + '</h3>' + (shortage ? '<small>' + (result.poolCount < 3 ? 'В этом городе в категории всего ' + result.poolCount + ' профиля. ' : '') + 'Всем условиям соответствуют ' + result.eligibleCount + ' из ' + result.poolCount + '.</small>' : '') + (counts.length ? '<div class="diagnostic-counts">' + counts.map(([key, value]) => '<span class="diagnostic">' + labels[key] + ' · ' + value + '</span>').join('') + '</div><small>У одного профиля может быть несколько причин исключения.</small>' : '<small>Все профили этой категории в городе проходят условия.</small>') : '';
    $('suggestions').innerHTML = result.suggestions.length ? '<p>Если условия можно изменить, вот проверенные варианты. Остальные параметры сохранятся.</p>' + result.suggestions.map((s, i) => '<button type="button" data-suggestion="' + i + '">' + escape(s.label) + '</button>').join('') : '';
    $('suggestions').querySelectorAll('button').forEach(button => button.addEventListener('click', () => { const s = result.suggestions[Number(button.dataset.suggestion)]; run({ ...result.query, [s.type]: s.value }); }));
    const same = lastResult && ['city', 'category', 'format', 'budget', 'hours', 'language', 'wishes'].every(key => lastResult.query[key] === q[key]);
    $('date-change').hidden = !(same && lastResult.query.date !== q.date);
    if (!$('date-change').hidden) {
      const nowBusy = lastResult.cards.filter(c => c.profile.busy_dates.includes(q.date)).map(c => c.profile.anon_name);
      const added = result.cards.filter(c => !lastResult.cards.some(before => before.profile.id === c.profile.id) && c.profile.busy_dates.includes(lastResult.query.date)).map(c => c.profile.anon_name);
      $('date-change').textContent = 'Дата изменена: ' + engine.dateLabel(lastResult.query.date) + ' → ' + engine.dateLabel(q.date) + '. ' + (nowBusy.length ? 'Теперь заняты: ' + nowBusy.join(', ') + '. ' : '') + (added.length ? 'Теперь доступны: ' + added.join(', ') + '. ' : '') + (!nowBusy.length && !added.length ? 'Состав первых карточек сохранился; календарь проверен заново. ' : '') + 'На новую дату занято профилей: ' + result.counts.busy + ' из ' + result.poolCount + '.';
    }
    lastResult = result;
    $('stale-note').hidden = true;
    $('form-error').hidden = true;
  }
  function run(raw, set = true) {
    const result = matcher.recommend(raw);
    if (set) setQuery(result.query);
    render(result);
    return { status: result.status, query: result.query, poolCount: result.poolCount, eligibleCount: result.eligibleCount, counts: result.counts, cards: result.cards.map(c => ({ id: c.profile.id, name: c.profile.anon_name, price_from_kzt: c.profile.price_from_kzt, explanation: c.explanation, quote: c.quote })) };
  }
  form.addEventListener('submit', event => { event.preventDefault(); try { run(rawQuery(), false); } catch (error) { $('form-error').textContent = error.message; $('form-error').hidden = false; } });
  form.addEventListener('input', () => { if (lastResult) $('stale-note').hidden = true !== Object.keys(lastResult.query).some(k => String(rawQuery()[k] || '') !== String(lastResult.query[k] ?? '')); });
  const scenarios = FIREBIRD_SCENARIOS;
  $('scenarios').innerHTML = scenarios.map((s, i) => '<button type="button" class="scenario" data-index="' + i + '">' + escape(s.label) + '</button>').join('');
  $('scenarios').querySelectorAll('button').forEach(b => b.addEventListener('click', () => run(scenarios[Number(b.dataset.index)].query)));
  run(scenarios[0].query);
  const context = document.modelContext;
  if (context?.registerTool) {
    const lifecycle = new AbortController();
    try { Promise.resolve(context.registerTool({ name: 'recommend_contractors', title: 'Подобрать подрядчиков', description: 'Проверяет условия, обновляет форму и показывает до трёх подрядчиков с объяснениями. Ничего не бронирует.', inputSchema: { type: 'object', properties: { city: { type: 'string', enum: e.cities }, date: { type: 'string', description: 'Дата YYYY-MM-DD с 2026-09-23 по 2026-12-31' }, category: { type: 'string', enum: e.categories }, format: { type: 'string', enum: e.formats }, budget: { type: 'number', exclusiveMinimum: 0, maximum: 1000000000 }, hours: { type: 'number', exclusiveMinimum: 0, maximum: 24 }, language: { type: 'string', enum: e.languages }, wishes: { type: 'string', maxLength: 240 } }, required: ['city', 'date', 'category', 'format', 'budget'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, execute: input => run(input) }, { signal: lifecycle.signal })).catch(() => {}); } catch (_) { /* Optional browser capability. */ }
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
})();
