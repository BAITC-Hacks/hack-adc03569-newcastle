# Оформление Firebird

Добавлены прохладный голубой фон светлой темы, глубокая синяя тёмная тема и тёплые оранжевые акценты. Переключатель находится в верхней панели, поддерживает клавиатуру, учитывает системную тему при первом посещении и сохраняет явный выбор в localStorage. Изменение темы не сбрасывает параметры подбора.

Новая фраза: **ВАШЕ СОБЫТИЕ. ВАША КОМАНДА. ВАШ ВАУ-ЭФФЕКТ.**

Тематический фон создан встроенным инструментом **imagegen**. Он является иллюстративной сценой, а не фотографией конкретного подрядчика или площадки из каталога.

Файл: `dist/assets/event-atmosphere.png`, 2172 × 724 пикселя, соотношение 3:1. Используется в верхнем блоке и шапке меню подбора с разным кадрированием и затемнением для читаемости.

## Промпт генерации

```text
Use case: photorealistic-natural
Asset type: wide photographic background for an event-contractor recommendation web app header, cropped to a 250px-tall band.
Primary request: a polished photorealistic elegant evening event backdrop, panoramic 3:1 aspect ratio, ideally 2304 x 768 pixels.
Scene/backdrop: contemporary premium event venue after dark, a modern event stage on the right with restrained architectural lighting. Subtle banquet floral decor only at the bottom right; warm amber string lights and softly defocused amber bokeh above the right side.
Style/medium: sophisticated professional event photography, realistic materials, atmospheric depth.
Composition/framing: keep the left 55 percent of the entire image dark navy, uncluttered, with subtle atmospheric lighting and ample negative space for an HTML heading. Concentrate stage details and decorative interest in the right 45 percent. The scene must remain useful when cropped as a short website header.
Lighting/mood: navy and cobalt theatrical lighting balanced with warm amber highlights, premium contemporary mood, vivid but restrained.
Constraints: no people, no text, no logos, no watermarks, no interface, no purple or pink wash. Generate exactly one finished image, no variants.
```

## Проверка

Обе темы визуально проверены при настольной и мобильной ширине. Проверены переключение клавиатурой, сохранение темы после перезагрузки, сохранение заполненных полей при смене темы, обычная и пустая выдача. Алгоритм подбора и данные каталога не изменялись.
