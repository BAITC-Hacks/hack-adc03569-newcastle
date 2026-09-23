const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('../dist/data.js');
require('../dist/engine.js');
require('../dist/i18n.js');
const I = FirebirdI18n, matcher = FirebirdEngine.createMatcher(FIREBIRD_DATA);
const query = { ...FIREBIRD_SCENARIOS[0].query, language: 'русский', hours: 4 };
const result = matcher.recommend(query);
for (const [key, values] of Object.entries(I.messages)) {
  assert.equal(values.length, 3, key);
  const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const value of values) {
    assert.ok(value.length > 0, key);
    assert.deepEqual(placeholders(value), placeholders(values[0]), key);
  }
}
for (const values of Object.values(FirebirdEngine.enums(FIREBIRD_DATA))) for (const value of values) {
  assert.ok(I.terms[value]?.length === 2, 'Missing catalog translation: ' + value);
}
for (const locale of I.supported) {
  I.setLocale(locale);
  for (const card of result.cards) {
    const text = I.explanation(card, result.query);
    assert.ok(text.includes(I.money(card.profile.price_from_kzt)));
    assert.ok(text.includes(I.date(query.date)));
    assert.ok(text.includes(I.term(query.language)));
    assert.ok(!/\{\w+\}/.test(text));
  }
  assert.deepEqual(matcher.recommend(query), result, 'Locale must not affect matching or source quotes');
  for (const raw of [{...query,budget:0},{...query,date:'2027-01-01'},{...query,hours:25}]) {
    try { matcher.recommend(raw); assert.fail('Expected validation error'); }
    catch (error) { if(locale !== 'ru') assert.notEqual(I.error(error.message), error.message); }
  }
}
I.setLocale('kk');
assert.equal(I.date('2026-10-06'), '6 қазан');
assert.equal(I.date('2026-12-31', true), '2026 жылғы 31 желтоқсан');
const source = fs.readFileSync(require.resolve('../dist/i18n.js'), 'utf8');
for (const saved of ['kk','en','ru','unexpected']) {
  const box = { Intl, localStorage: { getItem: () => saved, setItem: () => {} } };
  vm.runInNewContext(source, box);
  assert.equal(box.FirebirdI18n.locale, saved === 'unexpected' ? 'ru' : saved);
}
const blocked = { Intl, localStorage: { getItem() {throw Error('blocked');}, setItem() {throw Error('blocked');} } };
vm.runInNewContext(source, blocked);
blocked.FirebirdI18n.setLocale('kk');
assert.equal(blocked.FirebirdI18n.locale, 'kk');
console.log('PASS translation coverage, factual explanations, unchanged matching, localized validation, Kazakh dates, saved preferences and blocked storage');
