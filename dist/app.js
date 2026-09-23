(function () {
  'use strict';
  const engine = FirebirdEngine, data = FIREBIRD_DATA, matcher = engine.createMatcher(data), e = engine.enums(data);
  const I = FirebirdI18n, t = I.t, term = I.term, money = I.money, date = I.date;
  const $ = id => document.getElementById(id), form = $('request-form');
  let lastResult = null, previousResult = null, lastError = null;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const labels = { busy: 'busy', budget: 'overBudget', format: 'wrongFormat', language: 'wrongLanguage', hours: 'shortHours' };
  for (const [id, list] of [['city', e.cities], ['category', e.categories], ['format', e.formats], ['language', e.languages]]) {
    list.forEach(v => { const option = document.createElement('option'); option.value = v; $(id).append(option); });
  }
  function translateOptions() {
    for (const id of ['city', 'category', 'format', 'language']) Array.from($(id).options).forEach(option => {
      const label = option.value ? term(option.value) : t('any');
      option.textContent = label[0].toUpperCase() + label.slice(1);
    });
  }
  function rawQuery() { return Object.fromEntries(new FormData(form)); }
  function setQuery(q) { for (const key of ['city', 'date', 'format', 'category', 'budget', 'hours', 'language', 'wishes']) $(key).value = q[key] ?? ''; }
  function renderCard(card, index, query) {
    const p = card.profile;
    const attrs = ['<span class="attribute available">' + escape(t('available', { date: date(query.date) })) + '</span>', '<span class="attribute">' + escape(p.languages.map(term).join(' · ')) + '</span>', '<span class="attribute">' + escape(p.max_hours === null ? t('noHours') : t('maxHours', { hours: p.max_hours })) + '</span>'];
    const badges = ['<span class="source-badge' + (p.synthetic ? ' synthetic' : '') + '">' + t(p.synthetic ? 'synthetic' : 'anonymous') + '</span>'];
    if (p.price_imputed) badges.push('<span class="source-badge imputed">' + t('imputedPrice') + '</span>');
    if (p.city_imputed) badges.push('<span class="source-badge imputed">' + t('imputedCity') + '</span>');
    return '<article class="card" data-profile-id="' + escape(p.id) + '"><div class="card-head"><div class="identity"><span class="rank">0' + (index + 1) + '</span><div><h3 class="name">' + escape(p.anon_name) + '</h3><div class="meta">' + escape(term(query.category)) + ' · ' + escape(term(p.city)) + '</div></div></div><div class="price"><strong>' + escape(t('fromPrice', { price: money(p.price_from_kzt) })) + '</strong><span>' + t('perEvent') + '</span></div></div><div class="attributes">' + attrs.join('') + '</div><div class="explanation"><span class="why-label">' + t('why') + '</span><p>' + escape(I.explanation(card, query)) + '</p><p class="quote"><span class="quote-prefix">' + t(card.wishMatch ? 'wishQuote' : 'quote') + '</span>«' + escape(card.quote) + '»</p></div><div class="card-footer">' + badges.join('') + '</div><details class="profile-details"><summary>' + t('details') + ' <span class="profile-id">' + escape(p.id) + '</span></summary><p><span class="original-note">' + t('original') + '</span>' + escape(p.description) + '</p><p><b>' + t('categories') + ':</b> ' + escape(p.categories.map(term).join(', ')) + '<br><b>' + t('formats') + ':</b> ' + escape(p.event_formats.map(term).join(', ')) + '<br><b>' + t('startingPrice') + ':</b> ' + escape(money(p.price_from_kzt)) + (p.price_imputed ? t('imputed') : '') + '<br><b>' + t('city') + ':</b> ' + escape(term(p.city)) + (p.city_imputed ? t('imputed') : '') + '</p></details></article>';
  }
  function render(result) {
    const q = result.query;
    const openProfiles = new Set(Array.from(document.querySelectorAll('.card')).filter(el => el.querySelector('details').open).map(el => el.dataset.profileId));
    $('result-title').textContent = t(result.status);
    $('result-number').textContent = String(result.cards.length).padStart(2, '0');
    $('result-summary').textContent = t('summary', { city: term(q.city), date: date(q.date, true), format: term(q.format), budget: money(q.budget) }) + (result.status === 'no_category' ? t('missingCategory', { category: term(q.category) }) : t('counts', { pool: result.poolCount, eligible: result.eligibleCount, shown: result.cards.length }));
    $('cards').innerHTML = result.cards.map((card, i) => renderCard(card, i, q)).join('');
    document.querySelectorAll('.card').forEach(el => { if (openProfiles.has(el.dataset.profileId)) el.querySelector('details').open = true; });
    $('empty-state').hidden = !!result.cards.length;
    $('empty-state').innerHTML = result.status === 'no_category' ? '<div class="empty-symbol" aria-hidden="true">⊘</div><h3>' + t('emptyCategory') + '</h3><p>' + escape(t('emptyCategoryText', { city: term(q.city), category: term(q.category) })) + '</p>' : '<div class="empty-symbol" aria-hidden="true">⌁</div><h3>' + t('emptyMatch') + '</h3><p>' + t('emptyMatchText') + '</p>';
    const counts = Object.entries(result.counts).filter(([, count]) => count);
    const shortage = result.cards.length < 3 && result.status === 'matched';
    $('diagnostics').innerHTML = result.poolCount ? '<h3>' + t(shortage ? 'fewer' : 'diagnostics') + '</h3>' + (shortage ? '<small>' + (result.poolCount < 3 ? t('smallPool', { pool: result.poolCount }) : '') + t('eligible', { eligible: result.eligibleCount, pool: result.poolCount }) + '</small>' : '') + (counts.length ? '<div class="diagnostic-counts">' + counts.map(([key, value]) => '<span class="diagnostic">' + t(labels[key]) + ' · ' + value + '</span>').join('') + '</div><small>' + t('overlapping') + '</small>' : '<small>' + t('allEligible') + '</small>') : '';
    $('suggestions').innerHTML = result.suggestions.length ? '<p>' + t('suggestions') + '</p>' + result.suggestions.map((s, i) => '<button type="button" data-suggestion="' + i + '">' + escape(s.type === 'budget' ? t('budgetSuggestion', { price: money(s.value) }) : t('dateSuggestion', { date: date(s.value), count: s.count })) + '</button>').join('') : '';
    $('suggestions').querySelectorAll('button').forEach(button => button.addEventListener('click', () => { const s = result.suggestions[Number(button.dataset.suggestion)]; run({ ...result.query, [s.type]: s.value }); }));
    const same = previousResult && ['city', 'category', 'format', 'budget', 'hours', 'language', 'wishes'].every(key => previousResult.query[key] === q[key]);
    $('date-change').hidden = !(same && previousResult.query.date !== q.date);
    if (!$('date-change').hidden) {
      const nowBusy = previousResult.cards.filter(c => c.profile.busy_dates.includes(q.date)).map(c => c.profile.anon_name);
      const added = result.cards.filter(c => !previousResult.cards.some(before => before.profile.id === c.profile.id) && c.profile.busy_dates.includes(previousResult.query.date)).map(c => c.profile.anon_name);
      $('date-change').textContent = t('dateChanged', { before: date(previousResult.query.date), after: date(q.date) }) + (nowBusy.length ? t('nowBusy', { names: nowBusy.join(', ') }) : '') + (added.length ? t('nowFree', { names: added.join(', ') }) : '') + (!nowBusy.length && !added.length ? t('rechecked') : '') + t('busyCount', { busy: result.counts.busy, pool: result.poolCount });
    }
  }
  function run(raw, set = true) {
    const result = matcher.recommend(raw);
    if (set) setQuery(result.query);
    previousResult = lastResult;
    lastResult = result;
    render(result);
    $('stale-note').hidden = true;
    $('form-error').hidden = true;
    lastError = null;
    return { status: result.status, query: result.query, poolCount: result.poolCount, eligibleCount: result.eligibleCount, counts: result.counts, cards: result.cards.map(c => ({ id: c.profile.id, name: c.profile.anon_name, price_from_kzt: c.profile.price_from_kzt, explanation: I.explanation(c, result.query), quote: c.quote })) };
  }
  form.addEventListener('submit', event => { event.preventDefault(); try { run(rawQuery(), false); } catch (error) { lastError = error.message; $('form-error').textContent = I.error(lastError); $('form-error').hidden = false; } });
  form.addEventListener('input', () => { if (lastResult) $('stale-note').hidden = true !== Object.keys(lastResult.query).some(k => String(rawQuery()[k] || '') !== String(lastResult.query[k] ?? '')); });
  const scenarios = FIREBIRD_SCENARIOS;
  $('scenarios').innerHTML = scenarios.map((s, i) => '<button type="button" class="scenario" data-index="' + i + '">' + escape(t('scenario' + i)) + '</button>').join('');
  $('scenarios').querySelectorAll('button').forEach(b => b.addEventListener('click', () => run(scenarios[Number(b.dataset.index)].query)));
  document.addEventListener('firebird:localechange', () => {
    translateOptions();
    $('scenarios').querySelectorAll('button').forEach(b => { b.textContent = t('scenario' + b.dataset.index); });
    if (lastResult) render(lastResult);
    if (lastError) $('form-error').textContent = I.error(lastError);
  });
  translateOptions();
  I.apply();
  run(scenarios[0].query);
  const context = document.modelContext;
  if (context?.registerTool) {
    const lifecycle = new AbortController();
    try { Promise.resolve(context.registerTool({ name: 'recommend_contractors', title: 'Подобрать подрядчиков', description: 'Проверяет условия, обновляет форму и показывает до трёх подрядчиков с объяснениями. Ничего не бронирует. Returns explanations in the selected interface language; input enums use original catalog values.', inputSchema: { type: 'object', properties: { city: { type: 'string', enum: e.cities }, date: { type: 'string', description: 'Дата YYYY-MM-DD с 2026-09-23 по 2026-12-31' }, category: { type: 'string', enum: e.categories }, format: { type: 'string', enum: e.formats }, budget: { type: 'number', exclusiveMinimum: 0, maximum: 1000000000 }, hours: { type: 'number', exclusiveMinimum: 0, maximum: 24 }, language: { type: 'string', enum: e.languages }, wishes: { type: 'string', maxLength: 240 } }, required: ['city', 'date', 'category', 'format', 'budget'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, execute: input => run(input) }, { signal: lifecycle.signal })).catch(() => {}); } catch (_) { /* Optional browser capability. */ }
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
})();
