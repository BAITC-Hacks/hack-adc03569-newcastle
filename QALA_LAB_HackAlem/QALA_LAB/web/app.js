/* QALA LAB — dependency-free client. The Python server is the source of truth. */
const $ = (s, root = document) => root.querySelector(s);
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = x => JSON.parse(JSON.stringify(x));
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private-mode storage may be unavailable; calculations still work. */ } };
const paths = {
 city:'M3 21V9l6-3v15m0-10 6-4v14m0-16 6-2v18M1 21h22M5 11v1m0 3v1m6-2v1m6-7v1m0 3v1m0 3v1',
 grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 transport:'M5 17V6c0-2 14-2 14 0v11M5 11h14M7 18v3m10-3v3M7 15h.01M17 15h.01M5 18h14',
 ecology:'M12 21v-9M12 16C2 16 3 4 3 4s11-1 9 12Zm0-3C12 3 22 3 22 3s0 11-10 10Z',
 social:'M3 10 12 4l9 6M5 10v10h14V10M9 20v-6h6v6M2 20h20',
 safety:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-5 10 3 3 7-7',
 services:'M14 6a5 5 0 0 0-6 6l-5 5a2 2 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-4 2-2-2 2-4Z',
 compare:'M8 3v18M16 3v18M4 7l4-4 4 4m0 10 4 4 4-4',
 audit:'M5 3h14v18H5zM8 7h8M8 11h8M8 15h4M15 17l2 2 4-4',
 ai:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4',
 lab:'M8 3h8M9 3v7L3 20h18L15 10V3M7 14h10',
 info:'M12 8h.01M12 11v6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 plus:'M12 5v14M5 12h14', check:'m5 12 4 4L19 6', close:'m6 6 12 12M6 18 18 6',
 arrow:'M4 12h16m-6-6 6 6-6 6', left:'M20 12H4m6-6-6 6 6 6',
 download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', upload:'M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4',
 undo:'M4 10h10a6 6 0 0 1 0 12M9 5l-5 5 5 5', redo:'M20 10H10a6 6 0 0 0 0 12m5-17 5 5-5 5',
 save:'M4 3h13l4 4v14H3V3h1Zm3 0v7h10V3M7 21v-7h10v7', link:'m9 15 6-6M7 17l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M17 7l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
 clock:'M12 7v5l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 print:'M6 8V3h12v5M6 18H3V8h18v10h-3M6 14h12v7H6zM17 11h.01',
 trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M9 10v7m6-7v7',
 play:'m8 4 12 8-12 8V4Z', eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.info}"/></svg>`;
const state = {
 lang: ['kk','ru'].includes(safeRead('qala.lang','kk')) ? safeRead('qala.lang','kk') : 'kk',
 view:'overview', boot:null, decisions:[], result:null, validation:null, district:'nura', filter:'all',
 busy:false, revision:0, history:[[]], cursor:0, drafts:{}, ai:null, aiBusy:false,
 question:'', saved:[], comparison:null, compareA:'', compareB:'', lab:null, labMeasure:'', extraLag:1,
 tour:-1
};
const t = (kk,ru) => state.lang === 'kk' ? kk : ru;
const named = obj => obj?.name?.[state.lang] || '';
const fmt = (x, digits=2) => new Intl.NumberFormat(state.lang==='kk'?'kk-KZ':'ru-RU', {minimumFractionDigits:digits, maximumFractionDigits:digits}).format(x);
const short = x => new Intl.NumberFormat(state.lang==='kk'?'kk-KZ':'ru-RU', {maximumFractionDigits:3}).format(x);
const sign = x => `${x > 0 ? '+' : ''}${short(x)}`;
const deltaBadge = x => `<span class="delta ${x<0?'negative':x===0?'zero':''}">${esc(sign(x))}</span>`;
const measure = id => state.boot.data.measures.find(m=>m.id===id);
const district = id => state.boot.data.districts.find(d=>d.id===id);
const metric = id => state.boot.data.metrics.find(m=>m.id===id);
const selectedResult = () => state.result || state.boot.baseline;
const viewNames = () => ({overview:t('Қалаға шолу','Обзор города'),catalog:t('Шешімдер','Решения'),compare:t('Сценарийлер','Сценарии'),audit:t('Есеп ізі','След расчёта'),ai:t('AI түсіндірме','AI-объяснение'),lab:t('Мерзім зертханасы','Лаборатория сроков'),about:t('Модель туралы','О модели')});
let toastTimer;
function toast(message){const node=$('#toast');node.textContent=message;node.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),4500);}
async function api(path, data){
 const response=await fetch(path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const body=await response.json();
 if(!response.ok){const err=new Error(body.error||`HTTP ${response.status}`);err.payload=body;throw err;}return body;
}
function errorMessage(error){return error.payload?.validation?.errors?.map(e=>e.message[state.lang]).join(' ') || error.message || t('Сұрау орындалмады.','Запрос не выполнен.');}
function button(act, label, cls='', ico='', disabled=false, attrs=''){return `<button type="button" class="btn ${cls}" data-act="${act}" ${disabled?'disabled':''} ${attrs}>${ico?icon(ico):''}${label}</button>`;}
function emptyState(title, copy, ico='grid'){return `<div class="panel empty-state">${icon(ico)}<h2>${title}</h2><p>${copy}</p>${button('view',t('Шараларға өту','К мероприятиям'),'primary','arrow',false,'data-view="catalog"')}</div>`;}
function renderSidebar(){
 const nav=[['overview','city'],['catalog','grid'],['compare','compare'],['audit','audit'],['ai','ai'],['lab','lab'],['about','info']];
 return `<aside class="sidebar"><div class="brand row"><div class="brand-mark">Q</div><div class="brand-copy"><strong>QALA LAB</strong><span>DECISIONS, WITH EVIDENCE</span></div></div>
 <div class="nav-label">${t('БАСҚАРУ ПАНЕЛІ','ПАНЕЛЬ УПРАВЛЕНИЯ')}</div><nav aria-label="${t('Бөлімдер','Разделы')}">${nav.map(([v,i])=>`<button class="nav-button ${state.view===v?'active':''}" data-act="view" data-view="${v}" ${state.view===v?'aria-current="page"':''}>${icon(i)}${viewNames()[v]}</button>`).join('')}</nav>
 <div class="spacer"></div><div class="nav-separator"></div><div class="sidebar-note"><div class="eyebrow">${t('ДЕРЕК → ЕСЕП → ТҮСІНІК','ДАННЫЕ → РАСЧЁТ → СМЫСЛ')}</div><p>${t('AI сандарды жасамайды. Әр өзгеріс есептеу ізіне сүйенеді.','AI не придумывает числа. Каждое изменение связано со следом расчёта.')}</p></div><div class="sidebar-foot"><span class="status-dot"></span>${t('Синтетикалық деректер · v1.0','Синтетические данные · v1.0')}</div></aside>`;
}
function renderTopbar(){return `<header class="topbar"><div class="breadcrumb">HackAlem <span class="muted"> / </span> <strong>${viewNames()[state.view]}</strong></div><div class="top-actions"><div class="language" aria-label="Language"><button data-act="lang" data-lang="kk" class="${state.lang==='kk'?'active':''}">ҚАЗ</button><button data-act="lang" data-lang="ru" class="${state.lang==='ru'?'active':''}">РУС</button></div>${button('undo','','square','undo',state.cursor===0||state.busy,`aria-label="${t('Болдырмау','Отменить')}" title="${t('Болдырмау','Отменить')}"`)}${button('redo','','square','redo',state.cursor===state.history.length-1||state.busy,`aria-label="${t('Қайталау','Повторить')}" title="${t('Қайталау','Повторить')}"`)}${button('import',t('JSON ашу','Открыть JSON'),'','upload')}${button('demo',t('Демо','Демо'),'lime','play',state.busy)}<div class="avatar" title="HackAlem">QL</div></div></header>`;}
function renderKPIs(){
 const result=selectedResult(); const v=state.validation||{cost:0,count:0,remaining:100};
 return `<div class="kpis"><div class="kpi focus"><div class="score-ring" style="--progress:${Math.max(0,Math.min(100,result.summary.score))*3.6}deg"><div class="score-ring-inner"><span class="score-number">${fmt(result.summary.score)}</span><span class="score-max">/ 100*</span></div></div><div><div class="kpi-label muted">${state.result?'Astana QoL Score':t('Бастапқы модель','Исходная модель')}</div><strong style="font-size:13px">${state.result?t('8 тоқсандық нәтиже','Горизонт: 8 кварталов'):t('Сценарий әлі жоқ','Сценария пока нет')}</strong><div class="kpi-note muted">${state.result?t('Код есептеді · AI емес','Рассчитано кодом · не AI'):t('5 жарамды шара қажет','Нужны 5 допустимых мер')}</div></div></div>
 <div class="kpi"><div class="between"><div class="kpi-label">${t('Бюджет қалды','Остаток бюджета')}</div>${icon('services')}</div><div class="kpi-value">${v.remaining}<span style="font-size:13px;letter-spacing:0;color:var(--muted)"> / 100</span></div><div class="kpi-note">${t('Шартты бірлік · теңге емес','Условные единицы · не тенге')}</div></div>
 <div class="kpi"><div class="between"><div class="kpi-label">${t('Таңдалған шаралар','Выбранные меры')}</div>${icon('grid')}</div><div class="kpi-value">${state.decisions.length}<span style="font-size:13px;letter-spacing:0;color:var(--muted)"> / 5</span></div><div class="kpi-note">${t('Бір бағыттан ең көбі 2','Не более 2 из одного направления')}</div></div>
 <div class="kpi"><div class="between"><div class="kpi-label">${t('Критикалық көрсеткіштер','Критические показатели')}</div>${icon('safety')}</div><div class="kpi-value">${result.summary.critical_count}<span style="font-size:13px;letter-spacing:0;color:var(--muted)"> / 50</span></div><div class="kpi-note">${t('Қатаң < 40 · аудан × көрсеткіш','Строго < 40 · район × показатель')}</div></div></div>`;
}
function renderPlan(){
 const v=state.validation||{cost:0,count:0,remaining:100};
 return `<aside class="panel plan-panel" aria-label="${t('Сценарий құрамы','Состав сценария')}"><div class="plan-top"><div class="between"><h2>${t('Сіздің 5 шешіміңіз','Ваши 5 решений')}</h2><span class="badge ${state.result?'':'gray'}">${state.decisions.length}/5</span></div><p class="plan-caption">${t('Таңдау сізде. Есептеу бізде.','Вы выбираете. Система считает.')}</p><div class="budget-number"><strong>${v.cost}<span> / 100</span></strong><span>${t('жұмсалды','использовано')}</span></div><div class="budget-track"><div style="width:${Math.min(v.cost,100)}%"></div></div><div class="step-dots">${Array.from({length:5},(_,i)=>`<span class="${i<state.decisions.length?'on':''}"></span>`).join('')}</div></div>
 <div class="plan-items">${state.decisions.length?state.decisions.map((p,i)=>{const m=measure(p.measure_id);return `<div class="plan-item"><span class="plan-index">${i+1}</span><div class="plan-copy"><strong>${esc(named(m))}</strong><span>${p.district_id?esc(named(district(p.district_id))):t('Бүкіл қала','Весь город')} · ${m.cost} ${t('бірл.','ед.')}</span></div><button class="remove" data-act="remove" data-mid="${m.id}" aria-label="${t('Алып тастау','Удалить')} ${m.id}" ${state.busy?'disabled':''}>${icon('close')}</button></div>`;}).join(''):`<div class="plan-empty">${icon('grid')}${t('Алдымен каталогтан шара таңдаңыз. Әр шешімнің бағасы мен әсері алдын ала берілген.','Начните с каталога. Стоимость и эффекты каждого решения заданы заранее.')}</div>`}</div>
 <div class="plan-actions">${button('view',state.decisions.length<5?t('Шара таңдау','Выбрать меру'):t('Каталогқа оралу','Открыть каталог'),'primary full','plus',false,'data-view="catalog"')}${button('save',t('Сценарийді сақтау','Сохранить сценарий'),'full','save',!state.result||state.busy)}<div class="row" style="gap:7px">${button('export',t('Паспорт','Паспорт'),'full small','download',!state.result)}${button('share','','square small','link',!state.result,`aria-label="${t('Сілтемені көшіру','Скопировать ссылку')}" title="${t('Сілтемені көшіру','Скопировать ссылку')}"`)}${button('print','','square small','print',!state.result,`aria-label="${t('Есепті басып шығару','Печать отчёта')}" title="${t('PDF / Басып шығару','PDF / Печать')}"`)}</div>${state.decisions.length?button('reset',t('Тазарту','Очистить'),'subtle small danger','trash',state.busy):''}</div>
 <div class="plan-footer">${state.result?`<div class="row"><span class="status-dot"></span>${t('Ережелерге сәйкес','Соответствует правилам')}</div><div class="hash" style="margin-top:5px">ID ${state.result.passport.short_id}</div>`:t('Толық емес жиынтыққа қорытынды Score берілмейді.','Неполному набору итоговый Score не присваивается.')}</div></aside>`;
}
function renderMap(){
 const regions=[
 ['saryarka','M77 92 170 54 288 90 259 182 181 207 62 161Z',173,127],
 ['baikonur','M300 88 395 50 488 98 459 187 371 204 270 177Z',378,128],
 ['almaty','M501 97 604 85 687 149 662 263 566 284 474 192Z',588,183],
 ['nura','M65 224 177 218 259 201 316 293 255 366 139 370 58 302Z',179,282],
 ['esil','M278 214 373 221 460 207 550 298 483 369 336 369 325 292Z',413,299]
 ];
 const data=selectedResult();
 return `<svg class="city-map" viewBox="0 0 740 410" role="group" aria-label="${t('Бес ауданның сызбалық көрінісі. Нақты карта емес.','Схематическое изображение пяти районов. Не географическая карта.')}"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#b8c6af" opacity=".45"/></pattern><pattern id="blocks" width="31" height="27" patternUnits="userSpaceOnUse" patternTransform="rotate(-17)"><rect x="4" y="4" width="16" height="10" rx="2" fill="#fff" opacity=".32"/><path d="M0 21h31M25 0v27" stroke="#fff" stroke-width="2" opacity=".3"/></pattern></defs><rect x="0" y="0" width="740" height="410" fill="url(#dots)"/><path class="map-water" d="M19 193C121 204 184 209 255 190S375 220 461 194 486 276 582 298 676 277 721 318"/>
 ${regions.map(([id,path,x,y])=>{const r=data.districts.find(d=>d.id===id);return `<g class="district-shape ${state.district===id?'active':''}" role="button" tabindex="0" data-act="district" data-did="${id}" aria-label="${esc(named(district(id)))}"><path class="district-poly" d="${path}"/><path d="${path}" fill="url(#blocks)" pointer-events="none"/><text x="${x}" y="${y}" class="map-name" text-anchor="middle">${esc(named(district(id)))}</text><text x="${x}" y="${y+25}" class="map-value" text-anchor="middle">${fmt(r.value)}${state.result?`  /  ${esc(sign(r.value_delta))}`:''}</text></g>`;}).join('')}
 <text x="704" y="382" fill="#8a9b81" font-size="9" text-anchor="end">SCHEMATIC / NOT TO SCALE</text></svg>`;
}
function renderDistrictDetail(){const r=selectedResult().districts.find(d=>d.id===state.district);
 return `<section class="panel"><div class="detail-head between"><div><div class="eyebrow muted">${t('АУДАННЫҢ КӨРСЕТКІШТЕРІ','ПОКАЗАТЕЛИ РАЙОНА')}</div><h2 style="margin-top:5px">${esc(named(district(state.district)))}</h2></div><span class="badge gray">${t('Халық үлесі','Доля населения')}: ${Math.round(r.population_share*100)}%</span></div><div class="metric-grid">${state.boot.data.metrics.map(m=>`<button class="metric-row" data-act="trace" data-cell="cell_${r.id}_${m.id}"><div class="metric-title"><span>${esc(named(m))}</span><span class="metric-code">${m.id} ↗</span></div><div class="metric-track"><span class="base" style="width:${r.before[m.id]}%"></span><span class="after" style="width:${r.after[m.id]}%"></span></div><div class="metric-values"><span>${short(r.before[m.id])} → <strong>${short(r.after[m.id])}</strong></span>${deltaBadge(r.delta[m.id])}</div></button>`).join('')}</div></section>`;
}
function renderOverview(){return `<div class="stack"><section class="panel"><div class="panel-head"><div><h2>${t('Қала бір саннан үлкен','Город больше одного числа')}</h2><p>${t('Ауданды басып, барлық 10 көрсеткішті ашыңыз.','Нажмите на район, чтобы увидеть все 10 показателей.')}</p></div><span class="badge gray">${t('Аудан схемасы','Схема районов')}</span></div>${renderMap()}<div class="panel-bottom"><span><i class="legend-dot"></i>${t('Таңдалған аудан','Выбранный район')}</span><span>${t('Нақты карта емес · Тек берілген 5 аудан','Не реальная карта · Только 5 районов датасета')}</span></div></section>${renderDistrictDetail()}<div class="notice">${t('Көрсеткішті басыңыз: бастапқы мән → шараның әсері → лаг → синергия → соңғы мән. Әр санның жолы ашық.','Нажмите на показатель: исходное значение → эффект меры → лаг → синергия → результат. Путь каждого числа открыт.')}</div><p class="small muted">${t('* Көрсеткіштер 0–100 аралығында. Score формуласына бөлек шегерім кіреді; ол қосымша 0–100 шектеуімен қиылмайды.','* Показатели ограничены диапазоном 0–100. В формуле Score есть отдельный вычет; сам Score дополнительно не ограничивается этим диапазоном.')}</p></div>`;}
function renderCatalog(){
 const categories=state.boot.data.categories;
 const measures=state.boot.data.measures.filter(m=>state.filter==='all'||m.category===state.filter);
 return `<div class="stack"><div><div class="filters"><button class="filter ${state.filter==='all'?'active':''}" data-act="filter" data-filter="all">${t('Барлығы','Все')} · 14</button>${Object.entries(categories).map(([id,n])=>`<button class="filter ${state.filter===id?'active':''}" data-act="filter" data-filter="${id}">${icon(id)}${esc(n[state.lang])}</button>`).join('')}</div><div class="catalog">${measures.map(m=>{
 const pick=state.decisions.find(p=>p.measure_id===m.id);const chosen=pick?.district_id || state.drafts[m.id] || '';
 return `<article class="measure-card ${pick?'selected':''}"><div class="between"><div class="row"><span class="icon-box">${icon(m.category)}</span><span class="card-id">${m.id}</span></div><span class="badge gray">${esc(categories[m.category][state.lang])}</span></div><h3>${esc(named(m))}</h3><div class="measure-meta"><span>${t('Лаг','Лаг')}: ${m.lag} ${t('тоқсан','кв.')}</span><span>H = 8</span><span>${short((8-m.lag)/8*100)}% ${t('әсер','эффекта')}</span></div><div class="effects" aria-label="${t('Толық әсерлер, лагқа дейін','Полные эффекты до лага')}">${Object.entries(m.effects).map(([k,v])=>`<span class="effect ${v<0?'negative':''}" title="${esc(named(metric(k)))}">${k} ${v>0?'+':''}${v}</span>`).join('')}</div><div class="small muted" style="font-size:9px">${t('Жоғарыда: лагқа дейінгі толық әсер','Выше: полный эффект до учёта лага')}</div><div class="scope-control">${m.scope==='city'?`<div class="scope-city">${t('Бүкіл қала · 5 аудан','Весь город · 5 районов')}</div>`:`<select id="district-${m.id}" data-change="measure-district" data-mid="${m.id}" aria-label="${m.id}: ${t('аудан','район')}" ${pick?'disabled':''}><option value="">${t('Аудан таңдаңыз','Выберите район')}</option>${state.boot.data.districts.map(d=>`<option value="${d.id}" ${chosen===d.id?'selected':''}>${esc(named(d))}</option>`).join('')}</select>`}</div><div class="measure-footer"><div><div class="cost">${m.cost} <small>${t('бірл.','ед.')}</small></div><div class="cost-label">${t('ШАРТТЫ ҚҰНЫ','УСЛОВНАЯ СТОИМОСТЬ')}</div></div>${button('add',pick?t('Қосылды','Добавлено'):t('Таңдау','Выбрать'),pick?'small':'primary small',pick?'check':'plus',Boolean(pick)||state.busy||state.decisions.length>=5,`data-mid="${m.id}"`)}</div></article>`;
 }).join('')}</div></div><div class="notice amber">${t('Мектеп (M7) пен саябақ (M4) бір ауданға қатар таңдалмайды. M1 және M3 кез келген ауданда өзара үйлеспейді. M5 пен M13 бір ауданға қатар таңдалмайды.','Школа (M7) и парк (M4) несовместимы в одном районе. M1 и M3 несовместимы независимо от района. M5 и M13 несовместимы в одном районе.')}</div></div>`;
}
function renderCompare(){
 const saved=state.saved;
 const picks=label=>`<option value="">${label}</option>${saved.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}`;
 const comp=state.comparison;
 return `<div class="stack"><section class="panel pad"><div class="between"><div><h2>${t('Сценарийлер жинағы','Коллекция сценариев')}</h2><p class="section-intro">${t('Бірдей бастапқы деректер. Салыстыру — айырмашылықты түсіну үшін, рейтинг жасау үшін емес.','Одинаковые исходные данные. Сравнение показывает различия, а не составляет рейтинг.')}</p></div><span class="badge gray">${saved.length}/8</span></div><div class="inline-input-row"><input id="scenario-name" maxlength="70" placeholder="${t('Сценарийдің атауы','Название сценария')}" aria-label="${t('Сценарийдің атауы','Название сценария')}">${button('save',t('Ағымдағыны сақтау','Сохранить текущий'),'primary','save',!state.result)}</div>${saved.length?`<div class="saved-grid">${saved.map(s=>`<article class="saved-card"><h3>${esc(s.name)}</h3><div class="saved-id">${esc(s.id.slice(0,12))} · ${t('осы браузерде сақталған','сохранён в этом браузере')}</div><div class="between">${button('load',t('Ашу','Открыть'),'small','arrow',state.busy,`data-id="${esc(s.id)}"`)}${button('delete-save','','square small subtle','trash',false,`data-id="${esc(s.id)}" aria-label="${t('Сақталғанды жою','Удалить сохранённый')}"`)}</div></article>`).join('')}</div>`:`<p class="section-intro">${t('Әзірге сақталған сценарий жоқ. Алдымен 5 жарамды шара таңдаңыз.','Сохранённых сценариев пока нет. Сначала выберите 5 допустимых мер.')}</p>`}</section>
 <section class="panel pad"><h2>${t('A және B · қатар қарау','A и B · рядом')}</h2><div class="compare-pickers"><label><span class="compare-label">${t('Сценарий A','Сценарий A')}</span><select id="compare-a" data-change="compare-a">${picks(t('A таңдаңыз','Выберите A'))}</select></label><span style="padding-top:22px">↔</span><label><span class="compare-label">${t('Сценарий B','Сценарий B')}</span><select id="compare-b" data-change="compare-b">${picks(t('B таңдаңыз','Выберите B'))}</select></label></div><div style="margin-top:17px">${button('compare',t('Айырмасын есептеу','Рассчитать различия'),'primary','compare',saved.length<2)}</div>${comp?`<div class="compare-hero">${[['A',comp.a],['B',comp.b]].map(([label,r])=>`<div><span class="badge gray">${label}</span><div class="kpi-value">${fmt(r.summary.score)}</div><p class="small muted">Astana QoL · ${r.validation.cost}/100 ${t('бірл.','ед.')}</p><p class="hash" style="margin-top:8px">${r.passport.short_id}</p></div>`).join('')}</div><div class="notice">${t('Төменде B − A көрсетілген. Оң және теріс айырма — модель арифметикасы. Қандай сценарийді таңдау керегін жүйе шешпейді.','Ниже показано B − A. Положительная или отрицательная разница — арифметика модели. Система не решает, какой сценарий выбирать.')}</div><div class="table-wrap" style="margin-top:15px"><table><thead><tr><th>${t('Аудан','Район')}</th><th>${t('Көрсеткіш','Показатель')}</th><th class="num">A</th><th class="num">B</th><th class="num">B − A</th></tr></thead><tbody>${comp.changes.filter(c=>c.delta!==0).map(c=>`<tr><td>${esc(named(district(c.district_id)))}</td><td>${c.metric_id} · ${esc(named(metric(c.metric_id)))}</td><td class="num">${short(c.a)}</td><td class="num">${short(c.b)}</td><td class="num">${deltaBadge(c.delta)}</td></tr>`).join('')||`<tr><td colspan="5">${t('Көрсеткіштерде айырмашылық жоқ.','Различий в показателях нет.')}</td></tr>`}</tbody></table></div><p class="section-intro">${t('Тек өзгерген ұяшықтар көрсетілді. Екі сценарий де серверде қайта есептелді.','Показаны только изменившиеся ячейки. Оба сценария пересчитаны на сервере.')}</p>`:''}</section></div>`;
}
function renderAudit(){if(!state.result)return emptyState(t('Алдымен жарамды сценарий керек','Сначала нужен допустимый сценарий'),t('Есептеу ізі дәл 5 шараның нәтижесі үшін ашылады. Бастапқы көрсеткіштерді «Қалаға шолу» бөлімінен қарауға болады.','След расчёта доступен для результата ровно 5 мер. Исходные показатели можно посмотреть в обзоре города.'),'audit');
 const r=state.result;
 return `<div class="stack"><section class="panel pad"><div class="between"><div><div class="eyebrow muted">${t('ЕСЕПТЕУ ПАСПОРТЫ','ПАСПОРТ РАСЧЁТА')}</div><h2 style="margin-top:7px">${t('Әр санның қайдан шыққаны көрінеді','У каждого числа есть источник')}</h2></div><span class="badge">DECIMAL</span></div><div class="formula">Score = 0.7 × D_avg + 0.3 × min(D) − N_crit<br>= 0.7 × ${esc(String(r.summary.average))} + 0.3 × ${esc(String(r.summary.minimum))} − ${r.summary.critical_count}<br>= ${esc(r.summary.exact_score)}</div><p class="section-intro">${t('Төменде бастапқы күймен салыстырғандағы үш арифметикалық бөлік көрсетілген. Аралық есептеулер дөңгелектелмейді.','Ниже — три арифметических компонента изменения относительно исходного состояния. Промежуточные вычисления не округляются.')}</p><div class="audit-cards">${[['population_term',t('Орташа мән бөлігі','Компонент среднего')],['minimum_term',t('Минимум бөлігі','Компонент минимума')],['critical_term',t('Шегерім өзгерісі','Изменение вычета')]].map(([key,label])=>`<div class="audit-card"><small>${label}</small><strong>${esc(sign(r.decomposition[key]))}</strong></div>`).join('')}</div></section>
 <section class="panel pad"><div class="between"><h2>${t('50 ұяшық · толық журнал','50 ячеек · полный журнал')}</h2>${button('csv',t('CSV алу','Скачать CSV'),'small','download')}</div><p class="section-intro" style="margin-bottom:15px">${t('Жолды басыңыз: шара, лаг коэффициенті, синергия және шектеу бөлек ашылады.','Нажмите на строку: мера, коэффициент лага, синергия и ограничение показаны отдельно.')}</p><div class="table-wrap"><table><thead><tr><th>${t('Аудан','Район')}</th><th>ID</th><th class="num">${t('Бұрын','До')}</th><th class="num">Δ</th><th class="num">${t('Кейін','После')}</th><th class="num">w</th><th>↗</th></tr></thead><tbody>${r.ledger.map(c=>`<tr class="clickable" data-act="trace" data-cell="${c.id}" tabindex="0"><td>${esc(named(district(c.district_id)))}</td><td title="${esc(named(metric(c.metric_id)))}">${c.metric_id}</td><td class="num">${short(c.before)}</td><td class="num">${deltaBadge(c.delta)}</td><td class="num"><strong>${short(c.after)}</strong></td><td class="num">${short(c.weight)}</td><td>${c.critical?'!':'↗'}</td></tr>`).join('')}</tbody></table></div></section>
 <section class="panel pad"><h2>${t('Қайта тексерілетін паспорт','Воспроизводимый паспорт')}</h2><p class="section-intro">${t('Бірдей деректер + бірдей код + бірдей 5 шешім = бірдей ID. Таңдау реті өзгерсе де ID сақталады. SHA-256 — сандық қолтаңба немесе шынайылық сертификаты емес.','Одинаковые данные + одинаковый код + одинаковые 5 решений = одинаковый ID. Порядок выбора не меняет ID. SHA-256 — не цифровая подпись и не сертификат достоверности.')}</p><div class="formula"><strong>SCENARIO</strong><div class="hash">${r.passport.scenario_sha256}</div><br><strong>DATASET</strong><div class="hash">${r.passport.dataset_sha256}</div><br><strong>ENGINE ${r.passport.engine_version}</strong><div class="hash">${r.passport.engine_sha256}</div></div><div class="row wrap" style="margin-top:16px">${button('export',t('JSON паспорт','JSON-паспорт'),'primary','download')}${button('print',t('PDF / Басып шығару','PDF / Печать'),'','print')}</div></section></div>`;
}
function renderAI(){if(!state.result)return emptyState(t('Түсіндіру үшін есеп керек','Для объяснения нужен расчёт'),t('AI-ға бос сұрақ емес, тексерілген сценарий мен оның есептеу деректері беріледі. Алдымен 5 шара таңдаңыз.','AI получает не пустой запрос, а проверенный сценарий и его расчёт. Сначала выберите 5 мер.'),'ai');
 const questions=state.lang==='kk'?['Не өзгерді және неліктен?','Лаг нәтижеге қалай әсер етті?','Синергия мен компромиссті түсіндір.']:['Что изменилось и почему?','Как лаг повлиял на результат?','Объясни синергии и компромиссы.'];
 return `<div class="stack"><section class="panel pad"><div class="between"><div><div class="eyebrow muted">PROOF-BOUND EXPLANATION</div><h2 style="margin-top:6px">${t('AI сөзі — есепке байланған','Слова AI привязаны к расчёту')}</h2></div>${icon('ai')}</div><p class="section-intro">${t('Модель жаңа сандар жазбайды. Ол сұраққа қатысты дәлелдердің ID-сын таңдайды, ал сервер тексерілген сөйлемдерді көрсетеді.','Модель не пишет новые числа. Она выбирает ID доказательств по вопросу, а сервер показывает проверенные предложения.')}</p><div class="evidence-flow"><div class="flow-node">${t('Тексерілген есеп','Проверенный расчёт')}</div><span class="flow-arrow">→</span><div class="flow-node">${t('AI: дәлел таңдау','AI: выбор фактов')}</div><span class="flow-arrow">→</span><div class="flow-node">${t('ID валидациясы','Валидация ID')}</div><span class="flow-arrow">→</span><div class="flow-node">${t('Түсіндірме','Объяснение')}</div></div><div class="notice ${state.boot.ai_configured?'':'amber'}">${state.boot.ai_configured?t('API кілті серверде табылды. Нақты байланыс тек «Түсіндір» басылғанда тексеріледі.','API-ключ обнаружен на сервере. Живое соединение проверится при нажатии «Объяснить».'):t('Жергілікті режим: API кілті жоқ. Төмендегі түсіндірме — детерминдік шаблон, LLM жауабы емес. Еркін сұрақ тек кілт сөздермен өңделеді.','Локальный режим: API-ключа нет. Объяснение ниже — детерминированный шаблон, не ответ LLM. Свободный вопрос обрабатывается только по ключевым словам.')}</div><div class="ai-prompt" style="margin-top:18px"><div class="question-chips">${questions.map((q,i)=>`<button data-act="question" data-q="${i}">${esc(q)}</button>`).join('')}</div><textarea id="ai-question" maxlength="600" aria-label="${t('Сценарий туралы сұрақ','Вопрос о сценарии')}" placeholder="${t('Осы сценарий туралы сұрақ жазыңыз…','Задайте вопрос об этом сценарии…')}">${esc(state.question)}</textarea><div class="between"><span class="small muted">${t('Тек осы синтетикалық сценарий · 600 таңба','Только этот синтетический сценарий · 600 символов')}</span>${button('ask',state.aiBusy?t('Өңделуде…','Обработка…'):t('Түсіндір','Объяснить'),'primary','ai',state.aiBusy)}</div></div></section>
 ${state.aiBusy?`<section class="panel pad"><span class="pulse"></span>${t('Дәлелдер дайындалып, жауап тексерілуде…','Подготовка доказательств и проверка ответа…')}</section>`:''}
 ${state.ai?`<section class="panel pad"><div class="between"><h2>${t('Сценарийдің түсіндірмесі','Объяснение сценария')}</h2><span class="badge ${state.ai.mode==='llm'?'':'amber'}">${state.ai.mode==='llm'?'LLM · VERIFIED IDs':t('ЖЕРГІЛІКТІ ШАБЛОН','ЛОКАЛЬНЫЙ ШАБЛОН')}</span></div><p class="small muted" style="margin-top:8px">${state.ai.scenario_id} · ${state.ai.fact_count} ${t('қолжетімді дәлел','доступных фактов')} · ${state.ai.elapsed_ms} ms</p>${state.ai.mode==='offline'&&state.ai.fallback_reason!=='no_api_key'?`<div class="notice amber" style="margin-top:14px">${t('Жанды AI жауабы алынбады немесе дәлел тексеруінен өтпеді. Жергілікті шаблон көрсетілді. Себеп','Живой AI-ответ не получен или не прошёл проверку доказательств. Показан локальный шаблон. Причина')}: ${esc(state.ai.fallback_reason)}</div>`:''}${state.ai.status==='not_in_dataset'?`<div class="notice amber" style="margin-top:14px">${t('Бұл сұраққа берілген деректерден жауап табылмады. Төменде модельдің шектеулері көрсетілген.','В предоставленных данных нет ответа на этот вопрос. Ниже показаны ограничения модели.')}</div>`:''}${state.ai.sections.map(s=>`<section class="answer-section"><h3>${esc(s.heading)}</h3>${s.facts.map(f=>`<p class="fact">${esc(f.text)}<span class="fact-source">${esc(f.id)} · ${esc(f.source)}${f.cell?`<button class="fact-link" data-act="trace" data-cell="${esc(f.cell)}">${t('Есепті ашу','Открыть расчёт')} ↗</button>`:''}</span></p>`).join('')}</section>`).join('')}<div class="notice" style="margin-top:18px">${t('Тексеру сөйлемдердің есеп деректерінен алынғанын растайды. AI дәлелдерді қаншалықты орынды таңдағанын адам тексеруі керек.','Проверка подтверждает происхождение предложений из расчёта. Насколько уместно AI выбрал доказательства, должен проверить человек.')}</div></section>`:''}</div>`;
}
function renderLab(){if(!state.result)return emptyState(t('Мерзімге сезімталдықты зерттеу','Изучение чувствительности к срокам'),t('Бұл бөлім жарамды сценарийден кейін ашылады. Ол ресми нәтижені өзгертпей, бір шараның кідіруін бөлек тексереді.','Раздел доступен после создания допустимого сценария. Он отдельно проверяет задержку одной меры, не меняя официальный результат.'),'lab');
 const exp=state.lab;
 return `<div class="stack"><section class="panel pad"><div class="between"><div><div class="eyebrow muted">${t('КОМАНДА ҚОСҚАН МҮМКІНДІК','ДОПОЛНЕНИЕ КОМАНДЫ')}</div><h2 style="margin-top:6px">${t('Жоба кешіксе, не өзгереді?','Что изменится при задержке?')}</h2></div>${icon('lab')}</div><p class="section-intro">${t('Бір шараның лагына 0–3 тоқсан қосып көріңіз. Құн, қалған шаралар мен синергия бонустары өзгермейді. Бұл — ықтималдық болжамы емес, параметрге сезімталдық тәжірибесі.','Добавьте к лагу одной меры 0–3 квартала. Стоимость, другие меры и бонусы синергий неизменны. Это эксперимент чувствительности, а не вероятностный прогноз.')}</p><div class="notice amber" style="margin-top:17px">${t('Бұл қосымша сценарийді ұйымдастырушы бермеген. Ресми Score сол қалпында қалады. Тәжірибеде жаңа Score көрсетілмейді.','Это допущение не задано организатором. Официальный Score остаётся прежним. Новый Score в эксперименте не показывается.')}</div><div class="lab-controls"><div><label for="lab-measure">${t('Қай шара кешігеді?','Какая мера задерживается?')}</label><select id="lab-measure" data-change="lab-measure">${state.decisions.map(p=>`<option value="${p.measure_id}" ${(state.labMeasure||state.decisions[0].measure_id)===p.measure_id?'selected':''}>${p.measure_id} · ${esc(named(measure(p.measure_id)))}</option>`).join('')}</select></div><div><label for="lab-lag">${t('Қосымша кідіріс','Дополнительная задержка')}: <strong id="lag-label">+${state.extraLag}</strong> ${t('тоқсан','кв.')}</label><input id="lab-lag" type="range" min="0" max="3" step="1" value="${state.extraLag}" data-change="lab-lag"><div class="between small muted"><span>0</span><span>+1</span><span>+2</span><span>+3</span></div></div></div><div style="margin-top:20px">${button('experiment',t('Өзгерістерді есептеу','Рассчитать изменения'),'primary','lab')}</div></section>${exp?`<section class="panel pad"><div class="between"><h2>${exp.measure_id} · +${exp.extra_lag} ${t('тоқсан','кв.')}</h2><span class="badge amber">EXPERIMENT</span></div><p class="section-intro" style="margin-bottom:17px">${t('Тек өзгерген ұяшықтар. Ешбір нақты мерзім немесе ықтималдық болжанбайды.','Только изменённые ячейки. Реальные сроки и вероятности не прогнозируются.')}</p><div class="table-wrap"><table><thead><tr><th>${t('Аудан','Район')}</th><th>ID</th><th class="num">${t('Ресми','Официально')}</th><th class="num">${t('Тәжірибе','Эксперимент')}</th><th class="num">Δ</th></tr></thead><tbody>${exp.changes.map(c=>`<tr><td>${esc(named(district(c.district_id)))}</td><td>${c.metric_id}</td><td class="num">${short(c.official)}</td><td class="num">${short(c.experiment)}</td><td class="num">${deltaBadge(c.delta)}</td></tr>`).join('')||`<tr><td colspan="5">${t('Қосымша кідіріс жоқ: мәндер өзгермеді.','Нет дополнительной задержки: значения не изменились.')}</td></tr>`}</tbody></table></div></section>`:''}</div>`;
}
function renderAbout(){
 const rules=state.lang==='kk'?['Бюджет — 100 шартты бірлік. Қалған ақша бонус қоспайды.','Дәл 5 шара; әр шара ең көбі бір рет.','Бір бағыттан ең көбі 2 шара. Бес бағыттың әрқайсысын қамту міндетті емес.','Аудандық шараға аудан міндетті. Қалалық шараға аудан көрсетілмейді.','Үйлеспейтін жұптар таңдалмайды. Жарамсыз жиынтық есептелмейді.']:['Бюджет — 100 условных единиц. Остаток не даёт бонуса.','Ровно 5 мер; каждую можно выбрать только один раз.','Не более 2 мер из одного направления. Охват всех пяти направлений не обязателен.','Район обязателен для районной меры и отсутствует у городской.','Запрещённые сочетания не допускаются. Невалидный набор не рассчитывается.'];
 return `<div class="stack"><section class="panel pad"><div class="eyebrow muted">MODEL CARD / SOURCE OF TRUTH</div><h2 style="margin-top:8px">${t('Нақты не берілгенін ажыратамыз','Разделяем данные и допущения')}</h2><p class="section-intro">${t('QALA LAB «5 сағатқа әкім» тапсырмасын ұйымдастырушы ұсынған синтетикалық модель ретінде іске асырады. Нақты Астана көрсеткіштері, шынайы бюджет немесе тұрғындардың жеке деректері қолданылмайды.','QALA LAB реализует задачу «Аким на 5 часов» как синтетическую модель организатора. Реальные показатели Астаны, реальный бюджет и персональные данные жителей не используются.')}</p><div class="source-links"><a class="btn" href="/sources/brief.pdf" target="_blank" rel="noopener">${icon('audit')}${t('Тапсырманың түпнұсқасы','Исходное задание')} · PDF</a><a class="btn" href="/sources/dataset.docx" download>${icon('download')}${t('Датасеттің түпнұсқасы','Исходный датасет')} · DOCX</a></div></section>
 <div class="about-grid"><section class="panel pad"><h2>${t('Датасет ережелері','Правила датасета')}</h2><div class="checklist">${rules.map(r=>`<div>${icon('check')}<span>${r}</span></div>`).join('')}</div></section><section class="panel pad"><h2>${t('Команданың толықтырулары','Дополнения команды')}</h2><p>${t('Қазақша және орысша интерфейс, сызбалық аудан көрінісі, әр ұяшықтың есеп ізі, JSON-паспорт, A/B салыстыру, кідіріс зертханасы және дәлел ID-ларына байланған AI-түсіндірме.','Казахский и русский интерфейс, схема районов, след каждой ячейки, JSON-паспорт, сравнение A/B, лаборатория задержек и AI-объяснение, привязанное к ID доказательств.')}</p><p>${t('Датасетте жоқ ықтималдықтар, тұрғындардың ойдан шығарылған пікірлері және «ең дұрыс саясат» ұсыныстары қосылмайды.','Не добавляются отсутствующие в датасете вероятности, выдуманные отзывы жителей и рекомендации «самой правильной политики».')}</p></section></div>
 <section class="panel pad"><h2>${t('Формула, дәлдік және мағына','Формула, точность и смысл')}</h2><div class="formula">I′ = clip(I + Σ effect × (8 − L) / 8 + synergy, 0, 100)<br>D = Σ weight × I′<br>D_avg = Σ population_share × D<br>Score = 0.7 × D_avg + 0.3 × min(D) − N_crit</div><p class="section-intro">${t('Барлық көрсеткіште үлкен мән модельдегі жоғары қызмет деңгейін білдіреді. Критикалық шек — қатаң 40-тан төмен. Синергия тұрақты: лагқа көбейтілмейді. Тек көрсетілетін мәндер дөңгелектеледі.','Во всех показателях большее значение означает более высокий уровень услуги в модели. Критический порог — строго ниже 40. Синергия фиксированная и не умножается на лаг. Округляются только отображаемые значения.')}</p><div class="table-wrap" style="margin-top:17px"><table><thead><tr>${state.boot.data.metrics.map(m=>`<th>${m.id}</th>`).join('')}</tr></thead><tbody><tr>${state.boot.data.metrics.map(m=>`<td>${m.weight}</td>`).join('')}</tr></tbody></table></div></section>
 <section class="panel pad"><h2>${t('AI режимдері және шектеулер','Режимы AI и ограничения')}</h2><p class="section-intro">${t('API кілті .env файлында серверде сақталады, браузерге берілмейді. Кілт пен интернет бар кезде OpenAI Responses API дәлелдер ID-сын таңдайды. Дұрыс емес жауап қабылданбайды. Кілт жоқ немесе сұрау сәтсіз болса, интерфейс жергілікті шаблон режимін ашық көрсетеді.','API-ключ хранится в .env на сервере и не передаётся браузеру. При наличии ключа и интернета OpenAI Responses API выбирает ID доказательств. Некорректный ответ отклоняется. Без ключа или при ошибке интерфейс явно показывает локальный шаблонный режим.')}</p><p class="section-intro">${t('Бұл — локалды хакатон прототипі. Қоғамдық өндірістік сервис үшін авторизация, өндірістік сервер, TLS, аудит және қауіпсіздік тексеруі қажет.','Это локальный хакатонный прототип. Публичный производственный сервис потребует авторизации, промышленного сервера, TLS, аудита и проверки безопасности.')}</p></section></div>`;
}
const tourSteps = () => [
 {view:'overview',title:t('01 · Нәтижеден бастаңыз','01 · Начните с результата'),copy:t('Ұйымдастырушының мысалы жүктелді. Карта схема екенін, деректер синтетикалық екенін айтыңыз.','Загружен пример организатора. Уточните, что карта схематическая, а данные синтетические.')},
 {view:'audit',title:t('02 · Санға дәлел сұраңыз','02 · Попросите доказательство числа'),copy:t('Нұрадағы S1 жолын басыңыз. +16 әсердің лагтан кейін +10 болғанын және толық есеп жолын көрсетіңіз.','Откройте строку S1 в Нуре. Покажите, как полный эффект +16 стал +10 после лага, и весь след вычисления.')},
 {view:'ai',title:t('03 · AI-ға есептеуге жол бермеңіз','03 · Не поручайте AI арифметику'),copy:t('«Түсіндір» батырмасын басыңыз. Режимді ашық атаңыз: LLM немесе жергілікті шаблон. Барлық сөйлем дәлелге тіркелген.','Нажмите «Объяснить». Честно назовите режим: LLM или локальный шаблон. Все предложения привязаны к доказательствам.')},
 {view:'lab',title:t('04 · Бір болжамды өзгертіңіз','04 · Измените одно допущение'),copy:t('Бір шараға +1 тоқсан кідіріс қосыңыз. Ресми нәтиже өзгермейтінін, бұл бөлек тәжірибе екенін көрсетіңіз.','Добавьте одной мере +1 квартал задержки. Покажите, что официальный результат не меняется: это отдельный эксперимент.')},
 {view:'audit',title:t('05 · Қайта тексеруге беріңіз','05 · Дайте перепроверить'),copy:t('JSON-паспортты жүктеңіз. Бірдей шешімдердің реті өзгерсе де, есеп пен ID өзгермейді. Қазыларға тесттер мен README-ді көрсетіңіз.','Скачайте JSON-паспорт. Перестановка тех же решений не меняет результат и ID. Покажите жюри тесты и README.')}
];
function renderTour(){if(state.tour<0)return '';const s=tourSteps()[state.tour];return `<aside class="tour-box" role="region" aria-label="Demo guide"><div class="between"><span class="eyebrow">DEMO WALKTHROUGH · ${state.tour+1}/5</span><button class="btn square subtle" data-act="tour-close" aria-label="Close" style="color:white">${icon('close')}</button></div><h3>${s.title}</h3><p>${s.copy}</p><div class="between"><span class="small" style="color:#abc2b1">${t('Қорғау сценарийі','Сценарий защиты')}</span>${button('tour-next',state.tour===4?t('Аяқтау','Завершить'):t('Келесі','Далее'),'lime small','arrow')}</div></aside>`;}
function render(){
 if(!state.boot)return;
 document.documentElement.lang=state.lang;
 const titles={overview:[t('5 шешім. Бір қала.','5 решений. Один город.'),t('Бюджетті бөліңіз. Өзгерісті көріңіз. Әр санның дәлелін ашыңыз.','Распределите бюджет. Увидьте изменения. Откройте доказательство каждого числа.')],catalog:[t('Әр шешімнің өз әсері бар','У каждого решения есть эффект'),t('14 шараның ішінен дәл 5-еуін таңдаңыз. Ережелер серверде тексеріледі.','Выберите ровно 5 из 14 мер. Правила проверяются на сервере.')],compare:[t('Бір қала. Әртүрлі сценарий.','Один город. Разные сценарии.'),t('Бастапқы шарттарды өзгертпей, айырмашылықтарды зерттеңіз.','Изучайте различия, не меняя начальные условия.')],audit:[t('Сан емес, есептің ізі','Не просто число, а след расчёта'),t('Формуладан әрбір аудандық көрсеткішке дейін.','От формулы до каждого районного показателя.')],ai:[t('Түсіндірме. Дәлелімен.','Объяснение. С доказательствами.'),t('Жасанды интеллектке берілген міндет — түсіндіру, сандар ойлап табу емес.','Задача искусственного интеллекта — объяснять, а не придумывать числа.')],lab:[t('Болжамды бөлек тексеріңіз','Проверяйте допущения отдельно'),t('Ресми сценарийді өзгертпейтін сезімталдық тәжірибесі.','Эксперимент чувствительности без изменения официального сценария.')],about:[t('Сенім ашық модельден басталады','Доверие начинается с открытой модели'),t('Дерек, ереже, AI және команданың толықтырулары бір-бірінен ажыратылған.','Данные, правила, AI и дополнения команды отделены друг от друга.')]};
 const [title,subtitle]=titles[state.view];
 const body={overview:renderOverview,catalog:renderCatalog,compare:renderCompare,audit:renderAudit,ai:renderAI,lab:renderLab,about:renderAbout}[state.view]();
 $('#app').innerHTML=`<div class="shell">${renderSidebar()}<div class="workspace">${renderTopbar()}<main id="main" class="content" tabindex="-1"><div class="page-heading"><div><div class="eyebrow">ASTANA / SYNTHETIC CITY LAB</div><h1>${title}</h1><p>${subtitle}</p></div><span class="badge outline heading-badge">${icon('clock')} H = 8 ${t('тоқсан','кварталов')}</span></div>${['overview','catalog'].includes(state.view)?renderKPIs():''}<div class="layout"><div class="main-column">${body}</div>${renderPlan()}</div></main></div></div><input class="hidden" type="file" id="import-file" accept="application/json,.json">${renderTour()}`;
 if($('#compare-a'))$('#compare-a').value=state.compareA;
 if($('#compare-b'))$('#compare-b').value=state.compareB;
}
async function commit(next, record=true){
 if(state.busy)return false;
 state.busy=true;render();
 try{
  const check=await api('/api/validate',{decisions:next,complete:false});
  if(!check.valid){toast(check.errors.map(e=>e.message[state.lang]).join(' '));return false;}
  const calculated=next.length===5?await api('/api/simulate',{decisions:next}):null;
  state.decisions=clone(next);state.validation=check;state.result=calculated;
  state.revision++;state.ai=null;state.aiBusy=false;state.lab=null;state.labMeasure=next[0]?.measure_id||'';
  if(record){state.history=state.history.slice(0,state.cursor+1);state.history.push(clone(next));state.cursor=state.history.length-1;}
  safeWrite('qala.draft',next);
  return true;
 }catch(e){toast(errorMessage(e));return false;}
 finally{state.busy=false;render();}
}
function download(filename,body,type='application/json'){
 const blob=new Blob([body],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportPassport(){
 if(!state.result)return;
 const record={...clone(state.result),exported_at:new Date().toISOString(),notice:'Synthetic organizer data. Scenario hash fingerprints inputs, dataset and engine. Not a digital signature. Recompute, do not trust cached results.'};
 download(`qala-passport-${state.result.passport.short_id}.json`,JSON.stringify(record,null,2));
 toast(t('Есептеу паспорты дайын.','Паспорт расчёта готов.'));
}
function exportCSV(){if(!state.result)return;
 const header=['district_id','metric_id','before','delta','after','weight','weighted_after','critical','contributors'];
 const quote=x=>`"${String(x).replace(/"/g,'""')}"`;
 const rows=state.result.ledger.map(c=>[c.district_id,c.metric_id,c.before,c.delta,c.after,c.weight,c.weighted_after,c.critical,c.terms.map(x=>x.measure_id||x.pair.join('+')).join(';')]);
 download(`qala-ledger-${state.result.passport.short_id}.csv`,'\uFEFF'+[header,...rows].map(row=>row.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
}
function openTrace(cellId){
 const c=selectedResult().ledger.find(c=>c.id===cellId);if(!c)return;
 const dlg=$('#trace-dialog');
 dlg.innerHTML=`<div class="between"><span class="eyebrow muted">${t('КӨРСЕТКІШТІҢ ЕСЕПТЕУ ІЗІ','СЛЕД РАСЧЁТА ПОКАЗАТЕЛЯ')}</span>${button('close-dialog','','square subtle','close',false,`aria-label="${t('Жабу','Закрыть')}"`)}</div><h2 id="dialog-title" style="margin-top:10px">${esc(named(district(c.district_id)))} · ${c.metric_id}</h2><p class="dialog-caption">${esc(named(metric(c.metric_id)))}</p><div class="trace-summary"><div><span class="small muted">${t('Бастапқы мән','Исходное значение')}</span><div class="kpi-value">${short(c.before)}</div></div><span>→</span><div><span class="small muted">${t('Кейінгі мән','Новое значение')}</span><div class="kpi-value">${short(c.after)}</div></div></div>
 ${c.terms.length?c.terms.map(term=>term.kind==='measure'?`<div class="trace-term"><div class="between"><strong>${term.measure_id} · ${esc(named(measure(term.measure_id)))}</strong>${deltaBadge(term.delta)}</div><div class="formula">${term.full} × (8 − ${term.lag}) / 8 = ${term.full} × ${term.factor} = ${term.delta}</div><p class="dialog-caption">${t('Толық әсер × лаг коэффициенті. Дерек: датасет, §2.','Полный эффект × коэффициент лага. Источник: датасет, §2.')}</p></div>`:`<div class="trace-term"><div class="between"><strong>${t('Синергия','Синергия')} · ${term.pair.join(' + ')}</strong>${deltaBadge(term.delta)}</div><p class="dialog-caption">${t('Тұрақты бонус. Лагқа көбейтілмейді. Дерек: датасет, §2.','Фиксированный бонус. Лагом не масштабируется. Источник: датасет, §2.')}</p></div>`).join(''):`<div class="notice">${t('Бұл ұяшыққа таңдалған шаралардың тікелей әсері жоқ.','На эту ячейку нет прямого эффекта выбранных мер.')}</div>`}
 <div class="trace-term"><strong>${t('Қосу және шектеу','Суммирование и ограничение')}</strong><div class="formula">${c.before}${c.terms.map(x=>x.delta>=0?` + ${x.delta}`:` − ${Math.abs(x.delta)}`).join('')} = ${c.raw_after}<br>clip(${c.raw_after}, 0, 100) = ${esc(c.exact_after)}<br>${t('Шектеудің түзетуі','Поправка ограничения')}: ${c.clip_adjustment}<br>${t('Аудандық мәндегі үлес','Вклад в районное значение')}: ${esc(c.exact_after)} × ${c.weight} = ${c.weighted_after}</div></div><div class="notice ${c.critical?'amber':''}">${c.critical?t('40-тан төмен: бұл ұяшық критикалық шегерімге кіреді.','Ниже 40: эта ячейка входит в критический вычет.'):t('40-тан төмен емес: бұл ұяшық үшін критикалық шегерім жоқ.','Не ниже 40: критический вычет за эту ячейку отсутствует.')}</div><p class="dialog-caption">${t('Бұл — синтетикалық модельдің арифметикасы, нақты қала нәтижесінің болжамы емес.','Это арифметика синтетической модели, не прогноз результата для реального города.')}</p>`;
 if(!dlg.open)dlg.showModal();
}
function printReport(){
 if(!state.result)return;const r=state.result;
 const date=new Date().toLocaleDateString(state.lang==='kk'?'kk-KZ':'ru-RU');
 $('#printout').innerHTML=`<div class="print-head"><h1>QALA LAB</h1><p>${t('СЦЕНАРИЙ ПАСПОРТЫ','ПАСПОРТ СЦЕНАРИЯ')} · ${date} · ID ${r.passport.short_id}</p><p>${t('«5 сағатқа әкім» · Ұйымдастырушының синтетикалық деректеріне негізделген есеп','«Аким на 5 часов» · Расчёт по синтетическим данным организатора')}</p></div><div class="notice">${t('Нақты қалаға баға, нақты бюджет ұсынысы немесе болашақ болжамы емес. Адам таңдайды; код есептейді.','Не оценка реального города, не рекомендация реального бюджета и не прогноз. Человек выбирает; код рассчитывает.')}</div><div class="print-kpis"><div><strong>${fmt(r.summary.score)}</strong><span>Astana Quality of Life Score</span></div><div><strong>${r.validation.cost} / 100</strong><span>${t('Шартты бюджет','Условный бюджет')}</span></div><div><strong>${r.summary.critical_count}</strong><span>${t('Критикалық ұяшық','Критических ячеек')}</span></div></div><section class="print-section"><h2>${t('1. Таңдалған шаралар','1. Выбранные мероприятия')}</h2><table><thead><tr><th>ID</th><th>${t('Шара','Мера')}</th><th>${t('Аудан','Район')}</th><th>${t('Құны','Стоимость')}</th><th>${t('Лаг','Лаг')}</th></tr></thead><tbody>${r.decisions.map(p=>{const m=measure(p.measure_id);return `<tr><td>${m.id}</td><td>${esc(named(m))}</td><td>${p.district_id?esc(named(district(p.district_id))):t('Бүкіл қала','Весь город')}</td><td>${m.cost}</td><td>${m.lag}</td></tr>`;}).join('')}</tbody></table></section><section class="print-section"><h2>${t('2. Формуланы тексеру','2. Проверка формулы')}</h2><p>Score = 0.7 × ${r.summary.average} + 0.3 × ${r.summary.minimum} − ${r.summary.critical_count} = ${r.summary.exact_score}</p><p>${t('Есептеу дәлдігі: Decimal. Аралық дөңгелектеу жоқ. Критикалық шек: қатаң < 40.','Точность расчёта: Decimal. Без промежуточного округления. Критический порог: строго < 40.')}</p><p>${t('Синергиялар','Синергии')}: ${r.synergies.map(s=>`${s.pair.join(' + ')} (${esc(named(district(s.district_id)))})`).join('; ')||'—'}</p></section><section class="print-section"><h2>${t('3. Қайта есептеу идентификаторлары','3. Идентификаторы воспроизведения')}</h2><p class="hash">SCENARIO SHA-256: ${r.passport.scenario_sha256}<br>DATASET SHA-256: ${r.passport.dataset_sha256}<br>ENGINE SHA-256: ${r.passport.engine_sha256}</p><p>${t('Hash кіріс шешімдерді, дерек пен код нұсқасын бекітеді; бұл сандық қолтаңба емес. JSON-ды импорттау кезінде нәтиже қайта есептеледі.','Hash фиксирует входные решения, данные и версию кода; это не цифровая подпись. При импорте JSON результат пересчитывается.')}</p><p>${t('Дереккөздер: «Датасет районов.docx», §1–4; HackAlem тапсырмасының PDF файлы, 1–3-беттер.','Источники: «Датасет районов.docx», §1–4; PDF задания HackAlem, стр. 1–3.')}</p></section><section class="print-page"><h2>${t('4. Аудандар бойынша барлық кейінгі көрсеткіштер','4. Все итоговые показатели по районам')}</h2><table><thead><tr><th>${t('Аудан','Район')}</th>${state.boot.data.metrics.map(m=>`<th>${m.id}</th>`).join('')}</tr></thead><tbody>${r.districts.map(d=>`<tr><td>${esc(named(district(d.id)))}</td>${state.boot.data.metrics.map(m=>`<td>${short(d.after[m.id])}</td>`).join('')}</tr>`).join('')}</tbody></table><h2>${t('5. Өзгерген ұяшықтардың есеп ізі','5. След изменившихся ячеек')}</h2><table><thead><tr><th>${t('Аудан','Район')}</th><th>ID</th><th>${t('Бұрын','До')}</th><th>Δ</th><th>${t('Кейін','После')}</th><th>${t('Көздері','Источники')}</th></tr></thead><tbody>${r.ledger.filter(c=>c.delta!==0).map(c=>`<tr><td>${esc(named(district(c.district_id)))}</td><td>${c.metric_id}</td><td>${short(c.before)}</td><td>${sign(c.delta)}</td><td>${short(c.after)}</td><td>${c.terms.map(x=>x.measure_id||x.pair.join('+')).join('; ')}</td></tr>`).join('')}</tbody></table><h2>${t('6. Белгісіздік және қолдану шегі','6. Неопределённость и ограничения')}</h2><p>${t('Датасет ықтималдықтар мен сенімділік интервалдарын бермейді. Көрсеткіштер шынайы тұрғындар санына аударылмайды. Мерзім зертханасының тәжірибелері осы ресми паспортқа қосылмайды.','Датасет не задаёт вероятности и доверительные интервалы. Показатели не переводятся в реальное число жителей. Эксперименты лаборатории сроков не включаются в этот официальный паспорт.')}</p><p>${t('Бұл паспорттағы сандарды LLM емес, есептеу модулі жасаған. Толық 50 ұяшық журналы JSON және CSV экспортында бар.','Числа в паспорте созданы расчётным модулем, не LLM. Полный журнал 50 ячеек доступен в JSON- и CSV-экспорте.')}</p></section>`;
 window.print();
}
async function saveScenario(){
 if(!state.result)return;
 const id=state.result.passport.scenario_sha256;
 if(state.saved.some(s=>s.id===id)){toast(t('Осы сценарий бұрын сақталған.','Этот сценарий уже сохранён.'));return;}
 if(state.saved.length>=8){toast(t('8 сценарий сақталған. Біреуін жойып, қайта сақтаңыз.','Сохранено 8 сценариев. Удалите один и попробуйте снова.'));return;}
 const name=($('#scenario-name')?.value.trim() || t('Сценарий ','Сценарий ')+(state.saved.length+1)).slice(0,70);
 state.saved.push({id,name,decisions:clone(state.decisions)});safeWrite('qala.saved',state.saved);
 state.compareA=state.saved[0]?.id||'';state.compareB=state.saved[1]?.id||'';render();toast(t('Сценарий осы браузерде сақталды.','Сценарий сохранён в этом браузере.'));
}
async function askAI(){
 if(!state.result||state.aiBusy)return;
 state.question=$('#ai-question')?.value||state.question;
 const revision=state.revision,lang=state.lang;
 state.aiBusy=true;state.ai=null;render();
 try{const answer=await api('/api/explain',{decisions:clone(state.decisions),question:state.question,lang});if(revision===state.revision&&lang===state.lang)state.ai=answer;}
 catch(e){toast(errorMessage(e));}
 finally{state.aiBusy=false;render();}
}
async function handleAction(el){
 const action=el.dataset.act;
 if(action==='view'){state.view=el.dataset.view;render();$('#main').focus({preventScroll:true});window.scrollTo(0,0);return;}
 if(action==='lang'){state.lang=el.dataset.lang;state.ai=null;safeWrite('qala.lang',state.lang);render();return;}
 if(action==='filter'){state.filter=el.dataset.filter;render();return;}
 if(action==='district'){state.district=el.dataset.did;render();return;}
 if(action==='trace'){openTrace(el.dataset.cell);return;}
 if(action==='close-dialog'){$('#trace-dialog').close();return;}
 if(action==='add'){
  const m=measure(el.dataset.mid);const p={measure_id:m.id};
  if(m.scope==='district'){const did=$(`#district-${m.id}`)?.value;if(!did){toast(t('Алдымен аудан таңдаңыз.','Сначала выберите район.'));return;}p.district_id=did;}
  await commit([...state.decisions,p]);return;
 }
 if(action==='remove'){await commit(state.decisions.filter(p=>p.measure_id!==el.dataset.mid));return;}
 if(action==='reset'){await commit([]);return;}
 if(action==='undo'&&state.cursor>0){const i=state.cursor-1;if(await commit(state.history[i],false)){state.cursor=i;render();}return;}
 if(action==='redo'&&state.cursor<state.history.length-1){const i=state.cursor+1;if(await commit(state.history[i],false)){state.cursor=i;render();}return;}
 if(action==='demo'){if(await commit(state.boot.data.example)){state.view='overview';state.tour=0;render();$('#main').focus({preventScroll:true});window.scrollTo(0,0);}return;}
 if(action==='tour-close'){state.tour=-1;render();return;}
 if(action==='tour-next'){if(state.tour>=4)state.tour=-1;else{state.tour++;state.view=tourSteps()[state.tour].view;}render();$('#main').focus({preventScroll:true});window.scrollTo(0,0);return;}
 if(action==='save'){await saveScenario();return;}
 if(action==='load'){const s=state.saved.find(s=>s.id===el.dataset.id);if(s&&await commit(s.decisions)){state.view='overview';render();$('#main').focus({preventScroll:true});window.scrollTo(0,0);}return;}
 if(action==='delete-save'){state.saved=state.saved.filter(s=>s.id!==el.dataset.id);safeWrite('qala.saved',state.saved);state.comparison=null;state.compareA=state.saved[0]?.id||'';state.compareB=state.saved[1]?.id||'';render();return;}
 if(action==='compare'){
  const a=state.saved.find(s=>s.id===state.compareA),b=state.saved.find(s=>s.id===state.compareB);
  if(!a||!b||a.id===b.id){toast(t('Екі әртүрлі сценарий таңдаңыз.','Выберите два разных сценария.'));return;}
  state.comparison=await api('/api/compare',{a:a.decisions,b:b.decisions});render();return;
 }
 if(action==='question'){
  const qs=state.lang==='kk'?['Не өзгерді және неліктен?','Лаг нәтижеге қалай әсер етті?','Синергия мен компромиссті түсіндір.']:['Что изменилось и почему?','Как лаг повлиял на результат?','Объясни синергии и компромиссы.'];
  state.question=qs[Number(el.dataset.q)];if($('#ai-question'))$('#ai-question').value=state.question;return;
 }
 if(action==='ask'){await askAI();return;}
 if(action==='experiment'){
  if(!state.result)return;const rev=state.revision;
  const report=await api('/api/sensitivity',{decisions:clone(state.decisions),measure_id:$('#lab-measure').value,extra_lag:Number($('#lab-lag').value)});
  if(rev===state.revision)state.lab=report;render();return;
 }
 if(action==='export'){exportPassport();return;}
 if(action==='csv'){exportCSV();return;}
 if(action==='print'){printReport();return;}
 if(action==='share'){
  if(!state.result)return;
  const hash=btoa(JSON.stringify({decisions:state.decisions}));const url=location.origin+location.pathname+'#s='+hash;
  history.replaceState(null,'','#s='+hash);
  try{await navigator.clipboard.writeText(url);toast(t('Сілтеме көшірілді. Ол осы сервердің мекенжайында ашылады.','Ссылка скопирована. Она открывается на адресе этого сервера.'));}
  catch{window.prompt(t('Сілтемені көшіріңіз:','Скопируйте ссылку:'),url);}return;
 }
 if(action==='import'){$('#import-file').click();return;}
}
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-act]');if(!el||el.disabled)return;
 handleAction(el).catch(e=>toast(errorMessage(e)));
});
document.addEventListener('keydown',event=>{
 if(['Enter',' '].includes(event.key)){
  const el=event.target.closest('.district-shape, tr.clickable');
  if(el){event.preventDefault();handleAction(el).catch(e=>toast(errorMessage(e)));}
 }
});
document.addEventListener('input',event=>{
 if(event.target.id==='ai-question')state.question=event.target.value;
 if(event.target.id==='lab-lag'){state.extraLag=Number(event.target.value);$('#lag-label').textContent='+'+state.extraLag;}
});
document.addEventListener('change',async event=>{
 const el=event.target;
 try{
  if(el.dataset.change==='measure-district')state.drafts[el.dataset.mid]=el.value;
  if(el.dataset.change==='compare-a'){state.compareA=el.value;state.comparison=null;render();}
  if(el.dataset.change==='compare-b'){state.compareB=el.value;state.comparison=null;render();}
  if(el.dataset.change==='lab-measure'){state.labMeasure=el.value;state.lab=null;render();}
  if(el.dataset.change==='lab-lag'){state.extraLag=Number(el.value);state.lab=null;render();}
  if(el.id==='import-file'&&el.files?.[0]){
   const file=el.files[0];if(file.size>131072)throw new Error(t('JSON көлемі 128 КБ-тан аспауы керек.','Размер JSON не должен превышать 128 КБ.'));
   const obj=JSON.parse(await file.text());
   if(!obj||typeof obj!=='object'||!Array.isArray(obj.decisions))throw new Error(t('JSON ішінде decisions тізімі болуы керек.','JSON должен содержать массив decisions.'));
   if(await commit(obj.decisions)){
    let msg=t('JSON импортталды. Барлық мән серверде қайта есептелді.','JSON импортирован. Все значения пересчитаны сервером.');
    if(obj.summary?.exact_score&&state.result&&obj.summary.exact_score!==state.result.summary.exact_score)msg=t('Файлдағы дайын нәтиже сәйкес емес. Ол қолданылмады; код қайта есептеді.','Готовый результат в файле не совпадает. Он не использован; код выполнил пересчёт.');
    if(obj.passport?.scenario_sha256&&state.result&&obj.passport.scenario_sha256!==state.result.passport.scenario_sha256)msg=t('Дерек, код немесе шешім өзгерген: жаңа паспорт ID жасалды.','Данные, код или решения изменены: создан новый ID паспорта.');
    state.view='overview';render();toast(msg);
   }
  }
 }catch(e){toast(errorMessage(e));}
});
$('#trace-dialog').addEventListener('click',event=>{if(event.target===$('#trace-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();}});
async function boot(){
 try{
  state.boot=await api('/api/bootstrap');
  const stored=safeRead('qala.saved',[]);
  state.saved=Array.isArray(stored)?stored.filter(s=>s&&typeof s.name==='string'&&s.name.length<=70&&typeof s.id==='string'&&/^[a-f0-9]{64}$/.test(s.id)&&Array.isArray(s.decisions)).slice(0,8):[];
  state.compareA=state.saved[0]?.id||'';state.compareB=state.saved[1]?.id||'';
  state.validation=await api('/api/validate',{decisions:[],complete:false});render();
  let initial=safeRead('qala.draft',[]);
  if(location.hash.startsWith('#s=')){
   try{const encoded=location.hash.slice(3);if(encoded.length>12000)throw new Error('Long hash');initial=JSON.parse(atob(encoded)).decisions;}
   catch{toast(t('Сілтемедегі сценарий оқылмады.','Сценарий в ссылке не прочитан.'));initial=[];}
  }
  if(Array.isArray(initial)&&initial.length){await commit(initial,false);state.history=[clone(state.decisions)];state.cursor=0;render();}
 }catch(e){$('#app').innerHTML=`<main class="loading"><div class="brand-mark">Q</div><h1>QALA LAB</h1><p>${t('Серверге қосылу мүмкін болмады.','Не удалось подключиться к серверу.')}</p><p>START_WINDOWS.bat ${t('файлын іске қосыңыз немесе терминалда','или в терминале')}: <code>python server.py --open</code></p><p class="small muted">${esc(e.message)}</p></main>`;}
}
boot();
