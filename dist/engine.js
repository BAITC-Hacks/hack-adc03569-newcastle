(function (root) {
  'use strict';
  const WINDOW = { start: '2026-09-23', end: '2026-12-31' };
  const STOP = new Set('и в на по с со для от до из у за при как или а но не без это этот эта эти который которые ваш ваша ваши меня мы мне наш под чтобы очень более мероприятие мероприятия мероприятий нужно нужен нужна хочу'.split(' '));
  const normalize = value => String(value || '').toLowerCase().replaceAll('ё', 'е');
  const tokens = value => [...new Set((normalize(value).match(/[а-яa-z0-9]+/g) || []).filter(w => w.length > 2 && !STOP.has(w)).map(w => w.length > 5 ? w.slice(0, 5) : w))];
  const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  const dateLabel = value => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  const enums = data => ({ cities: [...new Set(data.map(p => p.city))].sort(), categories: [...new Set(data.flatMap(p => p.categories))].sort(), formats: [...new Set(data.flatMap(p => p.event_formats))].sort(), languages: [...new Set(data.flatMap(p => p.languages))].sort() });
  function validate(raw, data) {
    if (!raw || typeof raw !== 'object') throw new Error('Заполните параметры мероприятия.');
    const e = enums(data);
    for (const [key, values, label] of [['city', e.cities, 'город'], ['category', e.categories, 'категорию'], ['format', e.formats, 'формат']]) {
      if (!values.includes(raw[key])) throw new Error('Выберите ' + label + ' из каталога.');
    }
    if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) || Number.isNaN(Date.parse(raw.date)) || new Date(raw.date).toISOString().slice(0, 10) !== raw.date) throw new Error('Укажите корректную дату мероприятия.');
    if (raw.date < WINDOW.start || raw.date > WINDOW.end) throw new Error('Календарь доступен с 23 сентября по 31 декабря 2026 года. За пределами этого периода занятость неизвестна.');
    const budget = typeof raw.budget === 'number' ? raw.budget : (typeof raw.budget === 'string' && raw.budget.trim() ? Number(raw.budget) : NaN);
    if (!Number.isFinite(budget) || budget <= 0 || budget > 1000000000) throw new Error('Укажите бюджет от 1 до 1 000 000 000 ₸.');
    let hours = raw.hours == null || raw.hours === '' ? null : (typeof raw.hours === 'number' || typeof raw.hours === 'string' ? Number(raw.hours) : NaN);
    if (hours !== null && (!Number.isFinite(hours) || hours <= 0 || hours > 24)) throw new Error('Длительность должна быть больше 0 и не больше 24 часов.');
    const language = raw.language || '';
    if (language && !e.languages.includes(language)) throw new Error('Выберите язык из списка.');
    if (raw.wishes != null && typeof raw.wishes !== 'string') throw new Error('Пожелания должны быть текстом.');
    const wishes = (raw.wishes || '').trim();
    if (wishes.length > 240) throw new Error('Сократите пожелания до 240 символов.');
    return { city: raw.city, category: raw.category, format: raw.format, date: raw.date, budget, hours, language, wishes };
  }
  function reasons(profile, query) {
    const fails = [];
    if (profile.busy_dates.includes(query.date)) fails.push('busy');
    if (profile.price_from_kzt > query.budget) fails.push('budget');
    if (!profile.event_formats.includes(query.format)) fails.push('format');
    if (query.language && !profile.languages.includes(query.language)) fails.push('language');
    if (query.hours !== null && profile.max_hours !== null && profile.max_hours < query.hours) fails.push('hours');
    return fails;
  }
  function createMatcher(data) {
    const docs = new Map(data.map(p => [p.id, new Set(tokens(p.description))]));
    const idf = term => Math.log(1 + data.length / (1 + data.filter(p => docs.get(p.id).has(term)).length));
    const relevance = (terms, id) => terms.reduce((score, term) => score + (docs.get(id).has(term) ? idf(term) : 0), 0);
    function evidence(profile, query) {
      const chunks = profile.description.replace(/\s+/g, ' ').split(/(?<=[.!?;])\s+|\s*[•\n]\s*/).filter(s => s.length > 18);
      const terms = tokens(query.wishes || query.format);
      const informative = chunks.filter(s => !/^(привет|меня зовут|всем привет|с уважением|обращаясь|именно таким|что вас ждет|более подробную)/i.test(s));
      const ranked = (informative.length ? informative : chunks).map((text, index) => ({ text, index, score: tokens(text).filter(t => terms.includes(t)).reduce((n, t) => n + idf(t), 0), detail: /\d|сценар|импров|репертуар|скрип|саксоф|панорам|интерактив|без долгих|джаз|фото|цвет|свет|монтаж|съем|конкурс|зал|танц/i.test(text) ? 1 : 0 })).sort((a, b) => b.score - a.score || b.detail - a.detail || a.index - b.index);
      let quote = ranked[0]?.text || profile.description;
      if (quote.length > 230) quote = quote.slice(0, 230).replace(/\s+\S*$/, '') + '…';
      return { quote, wishMatch: !!query.wishes && relevance(tokens(query.wishes), profile.id) > 0 };
    }
    function recommend(raw) {
      const query = validate(raw, data);
      const pool = data.filter(p => p.city === query.city && p.categories.includes(query.category));
      const counts = { busy: 0, budget: 0, format: 0, language: 0, hours: 0 };
      const excluded = [];
      const eligible = pool.filter(p => { const fails = reasons(p, query); fails.forEach(k => counts[k]++); if (fails.length) excluded.push({ id: p.id, reasons: fails }); return !fails.length; });
      const terms = tokens(query.wishes), formatTerms = tokens(query.format);
      eligible.sort((a, b) => relevance(terms, b.id) - relevance(terms, a.id) || relevance(formatTerms, b.id) - relevance(formatTerms, a.id) || a.price_from_kzt - b.price_from_kzt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const cards = eligible.slice(0, 3).map(p => {
        const proof = evidence(p, query);
        const constraints = [query.language ? 'язык — ' + query.language : '', query.hours !== null ? (p.max_hours === null ? 'присутствие на площадке не требуется' : query.hours + ' ч при лимите ' + p.max_hours + ' ч') : ''].filter(Boolean);
        const explanation = 'Берёт формат «' + query.format + '»; ' + dateLabel(query.date) + ' свободен по календарю; цена от ' + money(p.price_from_kzt) + ' при бюджете ' + money(query.budget) + (constraints.length ? '; ' + constraints.join(', ') : '') + '.';
        return { profile: p, explanation, quote: proof.quote, wishMatch: proof.wishMatch, reserve: query.budget - p.price_from_kzt };
      });
      const status = !pool.length ? 'no_category' : !cards.length ? 'no_match' : 'matched';
      const suggestions = [];
      if (pool.length && cards.length < 3) {
        const possibleBudget = pool.filter(p => reasons(p, { ...query, budget: Infinity }).length === 0).map(p => p.price_from_kzt).filter(v => v > query.budget).sort((a, b) => a - b)[0];
        if (possibleBudget) suggestions.push({ type: 'budget', value: possibleBudget, label: 'Бюджет от ' + money(possibleBudget) });
        const dates = [];
        for (let d = Date.parse(WINDOW.start); d <= Date.parse(WINDOW.end); d += 86400000) {
          const value = new Date(d).toISOString().slice(0, 10);
          if (value === query.date) continue;
          const count = pool.filter(p => reasons(p, { ...query, date: value }).length === 0).length;
          if (count > eligible.length) dates.push({ type: 'date', value, count, label: dateLabel(value) + ' · вариантов: ' + count, distance: Math.abs(d - Date.parse(query.date)) });
        }
        dates.sort((a, b) => a.distance - b.distance || a.value.localeCompare(b.value));
        if (dates.length) suggestions.push(dates[0]);
      }
      return { status, query, total: data.length, poolCount: pool.length, eligibleCount: eligible.length, counts, excluded, cards, suggestions };
    }
    return { recommend, validate: raw => validate(raw, data) };
  }
  root.FirebirdEngine = { createMatcher, enums, money, dateLabel, WINDOW, tokens, reasons };
})(globalThis);
