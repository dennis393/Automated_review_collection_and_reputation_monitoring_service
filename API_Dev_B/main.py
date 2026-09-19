from fastapi import FastAPI
from orm import Base, lifespan
from routs import router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(lifespan=lifespan)
app.include_router(router)

def main():
    return {"msg": "Сервис_автоматического_сбора_отзывов_и_мониторинга_репутаций"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)