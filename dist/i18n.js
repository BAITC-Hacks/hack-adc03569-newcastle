(function (root) {
  'use strict';
  const supported = ['ru', 'kk', 'en'];
  // Each row is Russian, Kazakh, English. Catalog values stay unchanged.
  const messages = {
    title: ['Firebird — умный подбор подрядчиков', 'Firebird — мердігерлерді ақылды іріктеу', 'Firebird — smart event matching'],
    description: ['До трёх event-подрядчиков из каталога с конкретными объяснениями выбора.', 'Каталогтан үшке дейін іс-шара мердігері және таңдаудың нақты себептері.', 'Up to three event professionals from your catalog, with clear reasons for each match.'],
    home: ['Firebird, главная', 'Firebird, басты бет', 'Firebird, home'],
    caption: ['Подрядчики для вашего события', 'Іс-шараңызға арналған мердігерлер', 'The people behind your event'],
    demo: ['Демо · 66 профилей', 'Демо · 66 профиль', 'Demo · 66 profiles'],
    interfaceLanguage: ['Язык интерфейса', 'Интерфейс тілі', 'Interface language'],
    dark: ['Тёмная тема', 'Қараңғы тақырып', 'Dark theme'],
    light: ['Светлая тема', 'Жарық тақырып', 'Light theme'],
    enableDark: ['Включить тёмную тему', 'Қараңғы тақырыпты қосу', 'Switch to dark theme'],
    enableLight: ['Включить светлую тему', 'Жарық тақырыпты қосу', 'Switch to light theme'],
    slogan: ['ВАШЕ СОБЫТИЕ. ВАША КОМАНДА. ВАШ ВАУ-ЭФФЕКТ.', 'СІЗДІҢ ІС-ШАРАҢЫЗ. СІЗДІҢ КОМАНДАҢЫЗ. ЕРЕКШЕ ӘСЕР.', 'YOUR EVENT. YOUR TEAM. YOUR WOW MOMENT.'],
    heading: ['Кого', 'Кімді', 'Who’s on'],
    headingAccent: ['пригласим?', 'шақырамыз?', 'your team?'],
    intro: ['До трёх вариантов из вашего каталога — с причинами выбора.', 'Каталогыңыздан үшке дейін нұсқа — әр таңдаудың себебімен.', 'Up to three matches from your catalog, with reasons for every choice.'],
    introNote: ['Только те, кто проходит по вашим условиям', 'Тек талаптарыңызға сай келетіндер', 'Only those who meet your requirements'],
    event: ['Ваше мероприятие', 'Сіздің іс-шараңыз', 'Your event'],
    city: ['Город', 'Қала', 'City'],
    date: ['Дата мероприятия', 'Іс-шара күні', 'Event date'],
    calendar: ['Календарь: 23.09–31.12.2026', 'Күнтізбе: 23.09–31.12.2026', 'Calendar: 23 Sep–31 Dec 2026'],
    format: ['Формат', 'Формат', 'Event type'],
    category: ['Кого ищем', 'Кімді іздейміз', 'Who do you need?'],
    budget: ['Бюджет на одного подрядчика', 'Бір мердігерге арналған бюджет', 'Budget per professional'],
    extra: ['Язык, длительность и пожелания', 'Тіл, ұзақтық және тілектер', 'Language, duration and preferences'],
    workLanguage: ['Язык работы', 'Қызмет көрсету тілі', 'Service language'],
    any: ['Любой', 'Кез келген', 'Any'],
    hours: ['Длительность, часов', 'Ұзақтығы, сағат', 'Duration, hours'],
    hoursPlaceholder: ['Не важна', 'Маңызды емес', 'Any duration'],
    wishes: ['Пожелания к стилю', 'Стильге қатысты тілектер', 'Style preferences'],
    wishesPlaceholder: ['Например: юмор, импровизация', 'Мысалы: юмор, импровизация', 'For example: jazz, acoustic'],
    wishesHelp: ['Совпадения слов в оригинале описания влияют на порядок, но не исключают варианты. Автоперевода запроса нет.', 'Сипаттаманың түпнұсқасындағы сөз сәйкестіктері реттілікке әсер етеді, бірақ нұсқаларды алып тастамайды. Сұрау автоматты аударылмайды.', 'Word matches in the original description affect ranking, but never exclude options. Requests are not automatically translated.'],
    submit: ['Подобрать подрядчиков', 'Мердігерлерді іріктеу', 'Find my matches'],
    priceNote: ['Цены указаны «от» за мероприятие. Итоговую стоимость нужно уточнить.', 'Іс-шараға арналған бастапқы бағалар көрсетілген. Соңғы құнын нақтылау қажет.', 'Prices are starting rates per event. Confirm the final cost with the professional.'],
    catalog: ['Каталог хакатона', 'Хакатон каталогы', 'Hackathon catalog'],
    catalogNote: ['Имена анонимизированы. Данные и занятость предназначены для демо.', 'Есімдер анонимдендірілген. Деректер мен бос уақыттар демонстрацияға арналған.', 'Names are anonymized. Profile data and availability are for demonstration.'],
    results: ['Результаты подбора', 'Іріктеу нәтижелері', 'Your matches'],
    try: ['Попробуйте', 'Байқап көріңіз', 'Try a scenario'],
    shortlist: ['ВАША КОРОТКАЯ ПОДБОРКА', 'СІЗ ҮШІН ІРІКТЕЛГЕНДЕР', 'YOUR SHORTLIST'],
    loading: ['Подбираем варианты', 'Нұсқаларды іріктеп жатырмыз', 'Finding your matches'],
    stale: ['Условия изменены. Нажмите «Подобрать подрядчиков», чтобы обновить результат.', 'Талаптар өзгерді. Нәтижені жаңарту үшін «Мердігерлерді іріктеу» түймесін басыңыз.', 'Your requirements changed. Select “Find my matches” to update the results.'],
    method: ['Как получилась эта подборка', 'Бұл іріктеу қалай жасалды', 'How we made this shortlist'],
    method1: ['Сначала проверяем город, категорию, дату, бюджет и формат. Язык и длительность становятся обязательными, если вы их указали. Занятые подрядчики исключаются, в том числе площадки.', 'Алдымен қала, санат, күн, бюджет және формат тексеріледі. Тіл мен ұзақтық көрсетілсе, олар да міндетті талап болады. Бос емес мердігерлер, соның ішінде іс-шара орындары алынып тасталады.', 'We first check city, category, date, budget and event type. Language and duration become required when specified. Unavailable professionals and venues are excluded.'],
    method2: ['Среди подходящих сначала идут профили с совпадениями слов из пожеланий, затем — из формата события. Более редкие слова имеют больший вес. При равенстве выбираем меньшую начальную цену, затем идентификатор профиля. Один запрос всегда даёт один порядок.', 'Сәйкес профильдер алдымен тілектердегі, кейін іс-шара форматындағы сөз сәйкестіктері бойынша реттеледі. Сирек сөздердің салмағы жоғары. Тең жағдайда бастапқы баға, кейін профиль идентификаторы ескеріледі. Бірдей сұрау бірдей реттілік береді.', 'Eligible profiles are ranked by word matches with your preferences, then with the event type. Rarer words carry more weight. Ties are resolved by lower starting price, then profile ID. The same request always returns the same order.'],
    method3: ['Объяснения состоят из проверенных полей и цитаты из описания. Это локальный алгоритм без языковой модели; он не распознаёт смысл отрицаний и не переводит пожелания. Цитаты и описания показаны на языке оригинала. Календарь не заменяет подтверждение подрядчика. «Без привязки к часам» означает, что присутствие на площадке не требуется.', 'Түсіндірмелер тексерілген өрістер мен сипаттамадан алынған дәйексөзге негізделеді. Бұл тілдік модельсіз жергілікті алгоритм; ол терістеудің мағынасын түсінбейді және тілектерді аудармайды. Дәйексөздер мен сипаттамалар түпнұсқа тілінде көрсетіледі. Күнтізбе мердігердің растауын алмастырмайды. «Сағатқа тәуелді емес» — іс-шара орнында болу қажет емес деген сөз.', 'Explanations use checked fields and a quote from the description. This local algorithm has no language model; it does not understand negation or translate preferences. Quotes and descriptions remain in their original language. Calendar availability must be confirmed by the professional. “No on-site time required” means attendance at the venue is not required.'],
    method4: ['В исходных данных 53 анонимизированных и 13 синтетических профилей. У 8 профилей город и у 18 цена дополнены при подготовке каталога. Эти поля отмечены на карточках. Новые профили не добавлялись.', 'Бастапқы деректерде 53 анонимдендірілген және 13 синтетикалық профиль бар. Каталог дайындалғанда 8 профильдің қаласы және 18 профильдің бағасы толықтырылған. Бұл өрістер карточкаларда белгіленген. Жаңа профильдер қосылған жоқ.', 'The source contains 53 anonymized and 13 synthetic profiles. City values for 8 profiles and prices for 18 were filled in during catalog preparation and are marked on the cards. No new profiles were added.'],
    footer: ['Умный выбор начинается с понятных причин.', 'Саналы таңдау түсінікті себептерден басталады.', 'A smart choice starts with clear reasons.'],
    matched: ['Есть из кого выбрать', 'Таңдау бар', 'Meet your matches'],
    no_category: ['Такой категории пока нет', 'Бұл санат әзірге жоқ', 'This category isn’t available yet'],
    no_match: ['Условия не совпали', 'Талаптарға сәйкес нұсқа жоқ', 'No matches for these requirements'],
    summary: ['{city} · {date} · {format} · до {budget}. ', '{city} · {date} · {format} · {budget} дейін. ', '{city} · {date} · {format} · up to {budget}. '],
    counts: ['В категории: {pool}. Проходят все условия: {eligible}. Показано: {shown}.', 'Санатта: {pool}. Барлық талапқа сай: {eligible}. Көрсетілгені: {shown}.', 'In category: {pool}. Meet all requirements: {eligible}. Shown: {shown}.'],
    missingCategory: ['В этом городе нет профилей категории «{category}».', 'Бұл қалада «{category}» санатындағы профильдер жоқ.', 'There are no “{category}” profiles in this city.'],
    emptyCategory: ['В каталоге нет этой категории', 'Каталогта бұл санат жоқ', 'This category is missing from the catalog'],
    emptyCategoryText: ['В городе «{city}» нет категории «{category}». Выберите другую категорию или город.', '«{city}» қаласында «{category}» санаты жоқ. Басқа санатты немесе қаланы таңдаңыз.', 'There are no “{category}” profiles in {city}. Choose another category or city.'],
    emptyMatch: ['Никто не проходит все условия', 'Барлық талапқа сай мердігер жоқ', 'No one meets all requirements'],
    emptyMatchText: ['В городе есть подходящая категория, но её подрядчики заняты или не соответствуют другим условиям. Причины указаны ниже.', 'Қалада қажетті санат бар, бірақ мердігерлер бос емес немесе басқа талаптарға сәйкес келмейді. Себептері төменде көрсетілген.', 'This category exists in the city, but its professionals are unavailable or do not meet other requirements. See the reasons below.'],
    fewer: ['Почему меньше трёх?', 'Неліктен үштен аз?', 'Why fewer than three?'],
    diagnostics: ['Что повлияло на выбор', 'Таңдауға не әсер етті', 'What shaped this shortlist'],
    smallPool: ['В этом городе в категории профилей: {pool}. ', 'Бұл қаладағы санатта {pool} профиль бар. ', 'This city has {pool} profile(s) in this category. '],
    eligible: ['Всем условиям соответствуют {eligible} из {pool}.', '{pool} профильдің {eligible} барлық талапқа сай.', '{eligible} of {pool} meet every requirement.'],
    overlapping: ['У одного профиля может быть несколько причин исключения.', 'Бір профиль бірнеше себеп бойынша алынып тасталуы мүмкін.', 'A profile may be excluded for more than one reason.'],
    allEligible: ['Все профили этой категории в городе проходят условия.', 'Бұл қаладағы осы санаттың барлық профилі талаптарға сай.', 'Every profile in this city and category meets your requirements.'],
    busy: ['Заняты на дату', 'Бұл күні бос емес', 'Unavailable on this date'],
    overBudget: ['Выше бюджета', 'Бюджеттен жоғары', 'Over budget'],
    wrongFormat: ['Не берут формат', 'Бұл форматта жұмыс істемейді', 'Event type not offered'],
    wrongLanguage: ['Нет нужного языка', 'Қажетті тіл жоқ', 'Required language not offered'],
    shortHours: ['Не хватает часов', 'Сағат саны жеткіліксіз', 'Duration exceeds limit'],
    suggestions: ['Если условия можно изменить, вот проверенные варианты. Остальные параметры сохранятся.', 'Талаптарды өзгертуге болса, мына тексерілген нұсқаларды қараңыз. Басқа параметрлер сақталады.', 'If your plans are flexible, try these checked alternatives. Other requirements stay the same.'],
    budgetSuggestion: ['Бюджет от {price}', 'Бюджет: {price} бастап', 'Budget from {price}'],
    dateSuggestion: ['{date} · вариантов: {count}', '{date} · нұсқа саны: {count}', '{date} · options: {count}'],
    dateChanged: ['Дата изменена: {before} → {after}. ', 'Күн өзгерді: {before} → {after}. ', 'Date changed: {before} → {after}. '],
    nowBusy: ['Теперь заняты: {names}. ', 'Енді бос емес: {names}. ', 'Now unavailable: {names}. '],
    nowFree: ['Теперь доступны: {names}. ', 'Енді бос: {names}. ', 'Now available: {names}. '],
    rechecked: ['Календарь проверен заново. ', 'Күнтізбе қайта тексерілді. ', 'The calendar has been checked again. '],
    busyCount: ['На новую дату занято профилей: {busy} из {pool}.', 'Жаңа күні {pool} профильдің {busy} бос емес.', 'Unavailable on the new date: {busy} of {pool}.'],
    available: ['{date} · свободен', '{date} · бос', '{date} · available'],
    noHours: ['Без привязки к часам', 'Сағатқа тәуелді емес', 'No on-site time required'],
    maxHours: ['До {hours} часов', '{hours} сағатқа дейін', 'Up to {hours} hours'],
    synthetic: ['Синтетический профиль', 'Синтетикалық профиль', 'Synthetic profile'],
    anonymous: ['Анонимизированный профиль', 'Анонимдендірілген профиль', 'Anonymized profile'],
    imputedPrice: ['Цена дополнена', 'Баға толықтырылған', 'Price filled in'],
    imputedCity: ['Город дополнен', 'Қала толықтырылған', 'City filled in'],
    fromPrice: ['от {price}', '{price} бастап', 'from {price}'],
    perEvent: ['за мероприятие', 'бір іс-шараға', 'per event'],
    why: ['ПОЧЕМУ ПОДХОДИТ', 'НЕЛІКТЕН СӘЙКЕС КЕЛЕДІ', 'WHY THIS MATCH WORKS'],
    quote: ['Из описания · оригинал: ', 'Сипаттамадан · түпнұсқа: ', 'From the description · original: '],
    wishQuote: ['Совпадения с пожеланиями · оригинал: ', 'Тілектерге сәйкес үзінді · түпнұсқа: ', 'Preference matches · original: '],
    details: ['Подробнее о профиле', 'Профиль туралы толығырақ', 'Profile details'],
    original: ['Описание на языке оригинала', 'Сипаттама түпнұсқа тілінде', 'Description in its original language'],
    categories: ['Категории', 'Санаттар', 'Categories'],
    formats: ['Форматы', 'Форматтар', 'Event types'],
    startingPrice: ['Начальная цена', 'Бастапқы баға', 'Starting price'],
    imputed: [' — дополнено при подготовке датасета', ' — деректер жиынын дайындау кезінде толықтырылған', ' — filled in during dataset preparation'],
    explanation: ['Берёт формат «{format}»; {date} свободен по календарю; цена от {price} при бюджете {budget}', '«{format}» форматында жұмыс істейді; күнтізбе бойынша {date} бос; бағасы {price} бастап, бюджетіңіз — {budget}', 'Offers {format} events; available on {date} according to the calendar; starting price {price} within your {budget} budget'],
    proofLanguage: ['язык — {language}', 'қызмет көрсету тілі — {language}', 'service language: {language}'],
    proofNoHours: ['присутствие на площадке не требуется', 'іс-шара орнында болу қажет емес', 'no on-site attendance required'],
    proofHours: ['{hours} ч при лимите {max} ч', 'ұзақтығы {hours} сағат, шегі — {max} сағат', '{hours} hours within a {max}-hour limit'],
    scenario0: ['Осенний корпоратив', 'Күзгі корпоратив', 'Autumn company party'],
    scenario1: ['Редкая категория', 'Сирек санат', 'Rare category'],
    scenario2: ['Без совпадений', 'Сәйкестік жоқ', 'No matches'],
    scenario3: ['Нет категории', 'Санат жоқ', 'Missing category'],
    errorParams: ['Заполните параметры мероприятия.', 'Іс-шара параметрлерін толтырыңыз.', 'Enter your event requirements.'],
    errorCity: ['Выберите город из каталога.', 'Каталогтан қаланы таңдаңыз.', 'Choose a city from the catalog.'],
    errorCategory: ['Выберите категорию из каталога.', 'Каталогтан санатты таңдаңыз.', 'Choose a category from the catalog.'],
    errorFormat: ['Выберите формат из каталога.', 'Каталогтан форматты таңдаңыз.', 'Choose an event type from the catalog.'],
    errorDate: ['Укажите корректную дату мероприятия.', 'Іс-шара күнін дұрыс көрсетіңіз.', 'Enter a valid event date.'],
    errorWindow: ['Календарь доступен с 23 сентября по 31 декабря 2026 года. За пределами этого периода занятость неизвестна.', 'Күнтізбе 2026 жылғы 23 қыркүйектен 31 желтоқсанға дейін қолжетімді. Бұл кезеңнен тыс бос уақыттар белгісіз.', 'The calendar covers 23 September–31 December 2026. Availability outside this period is unknown.'],
    errorBudget: ['Укажите бюджет от 1 до 1 000 000 000 ₸.', 'Бюджетті 1–1 000 000 000 ₸ аралығында көрсетіңіз.', 'Enter a budget from 1 to 1,000,000,000 ₸.'],
    errorHours: ['Длительность должна быть больше 0 и не больше 24 часов.', 'Ұзақтығы 0-ден көп, 24 сағаттан аспауы керек.', 'Duration must be greater than 0 and no more than 24 hours.'],
    errorLanguage: ['Выберите язык из списка.', 'Тізімнен тілді таңдаңыз.', 'Choose a language from the list.'],
    errorWishes: ['Пожелания должны быть текстом.', 'Тілектер мәтін түрінде болуы керек.', 'Preferences must be text.'],
    errorLength: ['Сократите пожелания до 240 символов.', 'Тілектерді 240 таңбаға дейін қысқартыңыз.', 'Shorten your preferences to 240 characters.']
  };
  const terms = {
    'Алматы': ['Алматы', 'Almaty'], 'Астана': ['Астана', 'Astana'], 'Зарубежье': ['Шетел', 'Abroad'],
    'Банкетный зал': ['Банкет залы', 'Banquet hall'], 'Ведущий': ['Жүргізуші', 'Event host'],
    'Ведущий церемонии': ['Рәсім жүргізушісі', 'Ceremony host'], 'Видеограф': ['Видеограф', 'Videographer'],
    'Декоратор': ['Безендіруші', 'Decorator'], 'Загородная площадка': ['Қала сыртындағы орын', 'Countryside venue'],
    'Инструменталист': ['Аспапта орындаушы', 'Instrumentalist'], 'Лайв-бэнд': ['Жанды музыка тобы', 'Live band'],
    'Национальный ансамбль': ['Ұлттық ансамбль', 'Traditional ensemble'], 'Отель': ['Қонақүй', 'Hotel'],
    'Подарки и сувениры': ['Сыйлықтар мен кәдесыйлар', 'Gifts and souvenirs'], 'Ресторан': ['Мейрамхана', 'Restaurant'],
    'Танцевальный коллектив': ['Би тобы', 'Dance group'], 'Флорист': ['Флорист', 'Florist'],
    'Фото и видеобудки': ['Фото және видеобудкалар', 'Photo and video booths'], 'Фотограф': ['Фотограф', 'Photographer'],
    'Шоу-программа': ['Шоу-бағдарлама', 'Show program'],
    'день рождения': ['Туған күн', 'Birthday'], 'конференция': ['Конференция', 'Conference'],
    'корпоратив': ['Корпоратив', 'Company party'], 'свадьба': ['Үйлену тойы', 'Wedding'],
    'той': ['Той', 'Toi celebration'], 'юбилей': ['Мерейтой', 'Anniversary'],
    'английский': ['Ағылшын', 'English'], 'казахский': ['Қазақ', 'Kazakh'], 'русский': ['Орыс', 'Russian']
  };
  const storageKey = 'firebird-locale';
  let locale = 'ru';
  try { const saved = root.localStorage?.getItem(storageKey); if (supported.includes(saved)) locale = saved; } catch (_) { /* Device preferences are optional. */ }
  const t = (key, values = {}) => {
    const template = messages[key]?.[supported.indexOf(locale)] ?? messages[key]?.[0] ?? key;
    return template.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  };
  const term = value => locale === 'ru' ? value : terms[value]?.[locale === 'kk' ? 0 : 1] ?? value;
  // Some browsers ship no Kazakh month names and render “M10”. Keep dates explicit.
  const kazakhMonths = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
  const date = (value, year = false) => {
    if (locale === 'kk') {
      const [y, m, d] = value.split('-').map(Number);
      return (year ? y + ' жылғы ' : '') + d + ' ' + kazakhMonths[m - 1];
    }
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  };
  const money = value => new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'ru-RU').format(value) + ' ₸';
  function explanation(card, query) {
    const p = card.profile;
    const parts = [t('explanation', { format: term(query.format), date: date(query.date), price: money(p.price_from_kzt), budget: money(query.budget) })];
    if (query.language) parts.push(t('proofLanguage', { language: term(query.language) }));
    if (query.hours !== null) parts.push(p.max_hours === null ? t('proofNoHours') : t('proofHours', { hours: query.hours, max: p.max_hours }));
    return parts.join('; ') + '.';
  }
  function apply() {
    if (!root.document) return;
    const doc = root.document;
    doc.documentElement.lang = locale;
    doc.title = t('title');
    const meta = doc.querySelector('meta[name="description"]');
    if (meta) meta.content = t('description');
    doc.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    for (const attr of ['placeholder', 'aria-label', 'title']) doc.querySelectorAll('[data-i18n-' + attr + ']').forEach(el => el.setAttribute(attr, t(el.getAttribute('data-i18n-' + attr))));
    const select = doc.getElementById('locale-select');
    if (select) select.value = locale;
  }
  function setLocale(value, persist = true) {
    if (!supported.includes(value)) return;
    locale = value;
    if (persist) try { root.localStorage?.setItem(storageKey, value); } catch (_) { /* Switching still works in memory. */ }
    apply();
    if (root.document) root.document.dispatchEvent(new CustomEvent('firebird:localechange'));
  }
  const error = message => {
    const key = Object.keys(messages).find(key => key.startsWith('error') && messages[key][0] === message);
    return key ? t(key) : message;
  };
  root.FirebirdI18n = { t, term, date, money, explanation, error, apply, setLocale, get locale() { return locale; }, supported, messages, terms };
  if (root.document) {
    root.document.documentElement.lang = locale;
    root.document.addEventListener('DOMContentLoaded', () => {
      apply();
      root.document.getElementById('locale-select')?.addEventListener('change', event => setLocale(event.target.value));
    });
    root.addEventListener('storage', event => { if (event.key === storageKey) setLocale(supported.includes(event.newValue) ? event.newValue : 'ru', false); });
  }
})(globalThis);
