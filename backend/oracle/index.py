"""
Оракул — ИИ-поиск через OpenRouter API с сохранением в БД.
Поддерживает разделы: oracle, folk, official, immortality.
"""

import json
import os
import urllib.request
import psycopg2


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}

SECTION_PROMPTS = {
    "folk": """Ты — эксперт народной медицины и фитотерапии. 
Найди и предоставь подробные рецепты, планы лечения и методы поддержания здоровья.
Формат ответа — структурированный текст с разделами: Показания, Рецепт/Метод, Применение, Предупреждения.
Отвечай на русском языке. Будь конкретным и практичным.""",

    "official": """Ты — врач-исследователь с доступом к актуальным медицинским базам данных (PubMed, WHO, Cochrane).
Ищи официальные медицинские протоколы, клинические рекомендации, результаты испытаний.
Структурируй ответ: Диагноз/Тема, Официальный протокол, Доказательная база, Источники.
Отвечай на русском языке. Указывай международные стандарты лечения.""",

    "immortality": """Ты — исследователь науки о долголетии и бессмертии.
Анализируй последние достижения в геронтологии, CRISPR, нанотехнологиях, загрузке сознания.
Структурируй: Технология, Текущий статус, Перспективы, Ключевые исследователи/организации.
Отвечай на русском языке. Ссылайся на реальные исследования и лаборатории.""",

    "oracle": """Ты — Оракул Бессмертия, эксперт по науке о долголетии, биохакингу и трансгуманизму.
Отвечай глубоко и научно, используя актуальные данные из PubMed, arXiv, bioRxiv, клинических испытаний.
Охватывай: геномику, нейронауку, крионику, нанотехнологии, эпигенетику, регенеративную медицину.
Отвечай на русском языке. Будь точным, цитируй исследования если знаешь.""",
}

SAVE_PROMPTS = {
    "folk": """Ты — эксперт народной медицины. Исследуй тему и создай подробную статью-рецепт.
Структура: ## Название лечебного метода\n\n### Показания\n...\n\n### Рецепт/Метод\n...\n\n### Способ применения\n...\n\n### Предостережения\n...\n\nОтвечай на русском языке, конкретно и подробно.""",

    "official": """Ты — врач с доступом к мировым медицинским базам. Создай медицинский протокол по теме.
Структура: ## Название заболевания/метода\n\n### Диагностика\n...\n\n### Официальный протокол лечения\n...\n\n### Доказательная база\n...\n\n### Международные рекомендации\n...\n\nОтвечай на русском языке, научно и точно.""",

    "immortality": """Ты — исследователь бессмертия. Создай подробный материал по теме.
Структура: ## Название технологии/метода\n\n### Суть метода\n...\n\n### Текущие достижения\n...\n\n### Ключевые исследования\n...\n\n### Перспективы\n...\n\nОтвечай на русском языке.""",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def call_openrouter(messages: list, model: str = "openrouter/auto") -> str:
    api_key = os.environ["OPENROUTER_API_KEY"]
    payload = json.dumps({
        "model": model,
        "messages": messages,
        "max_tokens": 2000,
        "temperature": 0.7,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://poehali.dev",
            "X-Title": "Oracle Longevity",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"]


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path_params = event.get("queryStringParameters") or {}
    action = path_params.get("action", "chat")
    section = path_params.get("section", "oracle")

    schema = os.environ.get("MAIN_DB_SCHEMA", "t_p30629249_ai_longevity_researc")

    # GET — загрузить статьи раздела
    if method == "GET":
        if action == "articles":
            conn = get_db()
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, title, content, tags, source, created_at FROM {schema}.articles WHERE section = %s ORDER BY created_at DESC LIMIT 50",
                (section,)
            )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            articles = [
                {"id": r[0], "title": r[1], "content": r[2], "tags": r[3], "source": r[4], "created_at": str(r[5])}
                for r in rows
            ]
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"articles": articles})}

        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Unknown action"})}

    # POST — чат или генерация статьи
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        question = body.get("question", "").strip()
        save = body.get("save", False)
        article_id = body.get("article_id")
        # section и action могут прийти либо из query params, либо из body
        section = body.get("section", section)
        action = body.get("action", action)

        if not question and action != "delete":
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "question is required"})}

        system_prompt = SAVE_PROMPTS.get(section, SECTION_PROMPTS.get(section, SECTION_PROMPTS["oracle"])) if save else SECTION_PROMPTS.get(section, SECTION_PROMPTS["oracle"])

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]

        # DELETE статьи
        if action == "delete" and article_id:
            conn = get_db()
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {schema}.articles WHERE id = %s AND section = %s", (article_id, section))
            conn.commit()
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"deleted": True})}

        answer = call_openrouter(messages)

        if save and section in ("folk", "official", "immortality"):
            title_line = answer.split("\n")[0].replace("##", "").replace("#", "").strip()
            if not title_line:
                title_line = question[:100]
            conn = get_db()
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {schema}.articles (section, title, content, source) VALUES (%s, %s, %s, %s) RETURNING id",
                (section, title_line, answer, "OpenRouter AI")
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({"answer": answer, "saved": True, "id": new_id, "title": title_line}),
            }

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"answer": answer, "saved": False}),
        }

    return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}