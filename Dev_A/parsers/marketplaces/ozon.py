import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "API_Dev_B"))

from datetime import datetime

import aiohttp

from secure import decrypt_token
from Dev_A.parsers.errors import MarketplaceAuthError, SourceParseError

REVIEW_LIST_URL = "https://api-seller.ozon.ru/v1/review/list"
REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=30)

#НЕ ПРОВЕРЕНО по официальной документации (она требует авторизованный доступ,
#сайт отдаёт пустой каркас без JS) — названия полей ниже основаны на общей
#конвенции Ozon Seller API (snake_case). Сверить при первом реальном ответе:
#dev-api.ozon.ru/docs, раздел ReviewAPI → ReviewList


async def fetch_reviews(source, credential) -> list[dict]:
    """
    source — строка MonitoringResourses (платформа ozon)
    credential — строка PlatformData, credential.extra_data_marketplaces
                 должен содержать {"client_id": "..."}
    """
    token = decrypt_token(credential.seller_token_from_marketplaces)
    client_id = (credential.extra_data_marketplaces or {}).get("client_id")
    if not client_id:
        raise SourceParseError("Ozon: не указан client_id в extra_data_marketplaces")

    headers = {
        "Client-Id": client_id,
        "Api-Key": token,
    }

    reviews = []
    cursor = ""

    async with aiohttp.ClientSession() as session:
        while True:
            body = {"limit": 100, "cursor": cursor, "status": "UNPROCESSED"}

            async with session.post(
                REVIEW_LIST_URL, headers=headers, json=body, timeout=REQUEST_TIMEOUT
            ) as response:
                if response.status == 401 or response.status == 403:
                    raise MarketplaceAuthError(f"Ozon: токен невалиден (credential_id={credential.id})")
                if response.status != 200:
                    text = await response.text()
                    raise SourceParseError(f"Ozon вернул {response.status}: {text[:200]}")

                data = await response.json()

            for review in data.get("reviews", []):
                reviews.append({
                    "external_id": str(review["id"]),
                    "author_name": review.get("author_name"),
                    "rating": review.get("rating"),
                    "text": review.get("text"),
                    "review_url": None,
                    "product_name": review.get("product_title") or review.get("sku"),
                    "reviewed_at": datetime.fromisoformat(review["published_at"].replace("Z", "+00:00")),
                })

            cursor = data.get("cursor")
            if not cursor or not data.get("has_next", False):
                break

    return reviews
