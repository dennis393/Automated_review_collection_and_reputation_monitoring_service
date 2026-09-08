from fastapi import FastAPI
from orm import Base, lifespan
from routs import router

app = FastAPI(lifespan=lifespan)
app.include_router(router)

def main():
    return {"msg": "Сервис_автоматического_сбора_отзывов_и_мониоринга_репутаций"}