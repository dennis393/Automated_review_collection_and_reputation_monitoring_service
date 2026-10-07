import asyncio
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "API_Dev_B"))

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from orm import async_sessionlocal, MonitoringResourses, Filials, Companies, Reviews
from config import settings
from Dev_A.dispatcher import dispatch
from Dev_A.parsers.errors import MarketplaceAuthError, SourceParseError

CYCLE_SLEEP_SECONDS = 60


def interval_for(source) -> timedelta:
    minutes = settings.MAP_PARSE_INTERVAL if source.platform_type == "map" else settings.MARKETPLACE_PARSE_INTERVAL
    return timedelta(minutes=minutes)


def due_for_check(source, now: datetime) -> bool:
    if source.last_checked_at is None:
        return True
    return now - source.last_checked_at >= interval_for(source)


async def process_source(sess, source, now: datetime):
    credentials = {c.platform: c for c in source.filial.company.credentials if c.is_active}

    try:
        reviews = await dispatch(source, credentials)
    except MarketplaceAuthError as e:
        print(f"⚠️ {e}")
        credential = credentials.get(source.platform)
        if credential:
            credential.is_active = False
        source.last_checked_at = now
        return
    except SourceParseError as e:
        print(f"⚠️ Источник {source.id} ({source.platform}): {e}")
        source.last_checked_at = now
        return
    except Exception as e:
        print(f"⚠️ Источник {source.id} ({source.platform}): неожиданная ошибка — {e}")
        source.last_checked_at = now
        return

    new_count = 0
    for review in reviews:
        try:
            async with sess.begin_nested():
                sess.add(Reviews(
                    resource_id=source.id,
                    id_platform_review=review["external_id"],
                    author_name=review.get("author_name"),
                    rating=review["rating"],
                    text_review=review.get("text"),
                    url_review=review.get("review_url"),
                    product_name=review.get("product_name"),
                    reviewed_at=review["reviewed_at"],
                ))
            new_count += 1
        except IntegrityError:
            pass  # дубль (resource_id + id_platform_review) — это норма, пропускаем

    if new_count:
        print(f"✅ Источник {source.id} ({source.platform}): новых отзывов — {new_count}")

    source.last_checked_at = now


async def run_cycle():
    async with async_sessionlocal() as sess:
        res = await sess.execute(
            select(MonitoringResourses)
            .options(
                selectinload(MonitoringResourses.filial)
                .selectinload(Filials.company)
                .selectinload(Companies.credentials)
            )
            .where(MonitoringResourses.is_active == True)
        )
        sources = res.scalars().all()

        now = datetime.utcnow()
        for source in sources:
            if not due_for_check(source, now):
                continue
            await process_source(sess, source, now)

        await sess.commit()


async def main():
    print("Worker запущен...")
    while True:
        try:
            await run_cycle()
        except Exception as e:
            print(f"⚠️ Ошибка цикла воркера: {e}")
        await asyncio.sleep(CYCLE_SLEEP_SECONDS)


if __name__ == "__main__":
    asyncio.run(main())
