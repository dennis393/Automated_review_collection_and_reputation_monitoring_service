from Dev_A.parsers.maps import yandex, two_gis, google
from Dev_A.parsers.marketplaces import wildberries, ozon, yandex_market, uzum

MAP_PARSERS = {
    "yandex": yandex.fetch_reviews,
    "2GIS": two_gis.fetch_reviews,
    "google_maps": google.fetch_reviews,
}

MARKET_CLIENTS = {
    "wildberries": wildberries.fetch_reviews,
    "ozon": ozon.fetch_reviews,
    "yandex_market": yandex_market.fetch_reviews,
    "uzum": uzum.fetch_reviews,
}


async def dispatch(source, credentials: dict) -> list[dict]:
    """
    source — строка MonitoringResourses
    credentials — словарь {platform: строка PlatformData} для компании этого источника

    Возвращает список словарей по общему контракту (external_id, author_name,
    rating, text, review_url, product_name, reviewed_at)
    """
    if source.platform_type == "map":
        return await MAP_PARSERS[source.platform](source)

    credential = credentials.get(source.platform)
    if credential is None:
        return []  # маркетплейс не подключён (нет токена) — нечего опрашивать

    return await MARKET_CLIENTS[source.platform](source, credential)
