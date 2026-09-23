"""User-facing HTTP errors. Technical error codes stay unchanged."""
from __future__ import annotations

ERRORS: dict[str, tuple[str, str, str]] = {
    "Origin not allowed": (
        "Бұл мекенжайдан сұрауға рұқсат жоқ.", "Запросы с этого адреса запрещены.", "Requests from this origin are not allowed."),
    "Not found": ("Сұралған бет табылмады.", "Запрошенная страница не найдена.", "The requested page was not found."),
    "Content-Type must be application/json": (
        "Сұрау application/json форматында болуы керек.", "Запрос должен иметь формат application/json.", "The request must use application/json."),
    "Body must be 1..65536 bytes": (
        "Сұрау көлемі 1–65536 байт болуы керек.", "Размер запроса должен быть от 1 до 65536 байт.", "The request body must be between 1 and 65536 bytes."),
    "JSON body must be an object": (
        "JSON деректері объект болуы керек.", "Тело JSON должно быть объектом.", "The JSON body must be an object."),
    "complete must be boolean": (
        "complete мәні true немесе false болуы керек.", "Значение complete должно быть true или false.", "complete must be true or false."),
    "Please wait: explanation limit is 8 requests/minute.": (
        "Сәл күтіңіз: минутына ең көбі 8 түсіндірме сұрауға болады.", "Подождите: доступно не более 8 запросов объяснения в минуту.", "Please wait: the limit is 8 explanation requests per minute."),
    "invalid_scenario": (
        "Сценарий ережелерге сәйкес емес.", "Сценарий не соответствует правилам.", "The scenario does not meet the rules."),
    "Internal server error": (
        "Серверде ішкі қате болды. Терминалды тексеріңіз.", "Внутренняя ошибка сервера. Проверьте терминал.", "Internal server error. Check the terminal."),
    "Question must be a string of at most 600 characters": (
        "Сұрақ 600 таңбадан аспайтын мәтін болуы керек.", "Вопрос должен быть текстом длиной не более 600 символов.", "The question must be text of no more than 600 characters."),
    "Supported languages are kk, ru and en": (
        "Қолдау бар тілдер: kk, ru және en.", "Поддерживаемые языки: kk, ru и en.", "Supported languages are kk, ru and en."),
    "Select a measure already in the valid scenario": (
        "Жарамды сценарийдегі шараны таңдаңыз.", "Выберите меру из допустимого сценария.", "Select a measure already included in the valid scenario."),
    "extra_lag must be an integer from 0 to 3": (
        "Қосымша кідіріс 0-ден 3-ке дейінгі бүтін сан болуы керек.", "Дополнительная задержка должна быть целым числом от 0 до 3.", "The additional delay must be an integer from 0 to 3."),
}


def error_text(message: str) -> dict[str, str]:
    """Use a safe generic message for malformed input; retain the code separately."""
    words = ERRORS.get(message, (
        "Сұрау деректері дұрыс емес. Форматты тексеріңіз.",
        "Некорректные данные запроса. Проверьте формат.",
        "Invalid request data. Check the format.",
    ))
    return dict(zip(("kk", "ru", "en"), words))
