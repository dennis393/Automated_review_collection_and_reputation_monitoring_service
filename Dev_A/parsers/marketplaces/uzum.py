import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "API_Dev_B"))

from secure import decrypt_token  # noqa: F401 — понадобится, когда допишешь запрос ниже

#Официального публичного API отзывов для продавцов Uzum Market НЕ НАЙДЕНО —
#ни в ТЗ, ни в открытой документации (seller.uzum.uz её не публикует).
#Единственный рабочий путь — тот же метод, что разбирали на Яндекс.Картах:
#
#1. Зайти в личный кабинет продавца на seller.uzum.uz (с реальным логином)
#2. Открыть раздел "Отзывы"
#3. DevTools (F12) → Network → фильтр Fetch/XHR → очистить лог → обновить
#   страницу / полистать отзывы
#4. Найти запрос, который возвращает JSON с отзывами — скопировать его
#   Request URL и посмотреть Request Headers (скорее всего там будет нужен
#   заголовок с токеном продавца — credential.seller_token_from_marketplaces)
#5. Проверить, срабатывает ли этот URL без браузерных cookies (только с
#   Seller Token в заголовке) — если нет, придётся тем же способом, что и
#   с Яндекс.Картами: сначала "залогиниться" через aiohttp.ClientSession,
#   сохранив cookies, потом дёргать найденный эндпоинт в той же сессии


async def fetch_reviews(source, credential) -> list[dict]:
    raise NotImplementedError(
        "Uzum: эндпоинт отзывов не задокументирован, нужна разведка через "
        "DevTools в личном кабинете продавца — см. комментарий в начале файла"
    )
