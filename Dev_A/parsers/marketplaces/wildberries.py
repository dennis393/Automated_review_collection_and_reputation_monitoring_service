import os
import sys

#Корень репозитория — чтобы были видны пакеты вне Dev_A/ (например, API_Dev_B/secure)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "API_Dev_B"))

from datetime import datetime

import aiohttp

from secure import decrypt_token
from Dev_A.parsers.errors import MarketplaceAuthError, SourceParseError

FEEDBACKS_URL = "https://feedbacks-api.wildberries.ru/api/v1/feedbacks"
REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=30)


async def fetch_reviews(source, credential) -> list[dict]:
    """
    source — строка MonitoringResourses (платформа wildberries, маркетплейс)
    credential — строка PlatformData с зашифрованным токеном продавца

    Возвращает список словарей по общему контракту:
    external_id, author_name, rating, text, review_url, product_name, reviewed_at
    """
    token = decrypt_token(credential.seller_token_from_marketplaces)
    headers = {"Authorization": f"Bearer {token}"}
    params = {"isAnswered": "false", "take": 100, "skip": 0}

    async with aiohttp.ClientSession() as session:
        async with session.get(
            FEEDBACKS_URL, headers=headers, params=params, timeout=REQUEST_TIMEOUT
        ) as response:
            if response.status == 401:
                raise MarketplaceAuthError(f"WB: токен продавца невалиден (credential_id={credential.id})")

            if response.status != 200:
                body = await response.text()
                raise SourceParseError(f"WB вернул {response.status}: {body[:200]}")

            data = await response.json()

    # ВАЖНО: ключи "data"/"feedbacks" и имена полей внутри feedback — взяты из ТЗ
    # частично, частично предположены по аналогии с публичным API WB. Нужно
    # свериться с реальным ответом (dev.wildberries.ru, раздел "Вопросы и отзывы")
    # когда появится тестовый токен продавца, и поправить здесь при расхождении.
    feedbacks = data.get("data", {}).get("feedbacks", [])

    reviews = []
    for feedback in feedbacks:
        reviews.append({
            "external_id": feedback["id"],
            "author_name": feedback.get("userName"),
            "rating": feedback["productValuation"],
            "text": feedback.get("text"),
            "review_url": None,  # прямой ссылки на конкретный отзыв WB не даёт
            "product_name": feedback.get("productDetails", {}).get("productName"),
            "reviewed_at": datetime.fromisoformat(feedback["createdDate"]),
        })

    return reviews
