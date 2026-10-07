import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "API_Dev_B"))

from datetime import datetime

import aiohttp

from secure import decrypt_token
from Dev_A.parsers.errors import MarketplaceAuthError, SourceParseError

REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=30)

#ВАЖНО: эндпоинт из ТЗ (v2/campaigns/{campaignId}/reviews, GET) устарел —
#Yandex Market перевёл Partner API на бизнес-кабинеты. Актуальная версия
#(проверено по официальной документации на 2026-10):
#POST https://api.partner.market.yandex.ru/v2/businesses/{businessId}/goods-feedback


async def fetch_reviews(source, credential) -> list[dict]:
    """
    source — строка MonitoringResourses (платформа yandex_market)
    credential — строка PlatformData, credential.extra_data_marketplaces
                 должен содержать {"business_id": "..."} (не "campaign_id" —
                 актуальный API работает через кабинеты, не кампании)
    """
    token = decrypt_token(credential.seller_token_from_marketplaces)
    business_id = (credential.extra_data_marketplaces or {}).get("business_id")
    if not business_id:
        raise SourceParseError("Yandex Market: не указан business_id в extra_data_marketplaces")

    url = f"https://api.partner.market.yandex.ru/v2/businesses/{business_id}/goods-feedback"
    headers = {"Authorization": f"Bearer {token}"}
    #Только отзывы, на которые ещё не отвечено — аналог isAnswered=false у WB
    body = {"reactionStatus": "NEED_REACTION"}

    reviews = []
    page_token = None

    async with aiohttp.ClientSession() as session:
        while True:
            params = {"limit": 50}
            if page_token:
                params["pageToken"] = page_token

            async with session.post(
                url, headers=headers, params=params, json=body, timeout=REQUEST_TIMEOUT
            ) as response:
                if response.status == 401 or response.status == 403:
                    raise MarketplaceAuthError(f"Yandex Market: токен невалиден (credential_id={credential.id})")
                if response.status != 200:
                    text = await response.text()
                    raise SourceParseError(f"Yandex Market вернул {response.status}: {text[:200]}")

                data = await response.json()

            for feedback in data.get("result", {}).get("feedbacks", []):
                description = feedback.get("description", {})
                text_parts = [
                    description.get("comment"),
                    description.get("advantages"),
                    description.get("disadvantages"),
                ]
                text = " ".join(p for p in text_parts if p) or None

                reviews.append({
                    "external_id": str(feedback["feedbackId"]),
                    "author_name": feedback.get("author"),
                    "rating": feedback.get("statistics", {}).get("rating"),
                    "text": text,
                    "review_url": None,
                    #Эндпоинт отдаёт только offerId (SKU), не человекочитаемое
                    #название товара — отдельного поля "название" тут нет
                    "product_name": feedback.get("identifiers", {}).get("offerId"),
                    "reviewed_at": datetime.fromisoformat(feedback["createdAt"].replace("Z", "+00:00")),
                })

            page_token = data.get("result", {}).get("paging", {}).get("nextPageToken")
            if not page_token:
                break

    return reviews
