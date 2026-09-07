import asyncio
from fastapi import FastAPI
from typing import List, Optional
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from contextlib import asynccontextmanager
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func, Text, UniqueConstraint, BigInteger, SmallInteger, Enum
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from dotenv import load_dotenv #Для postgree, данные подключения тоже хранятся в .env
import os



class Base(DeclarativeBase):
    pass

load_dotenv()

DATABASE_CONN = create_async_engine(f"postgresql+asyncpg://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}")

platforms = Enum(
"yandex",
"2GIS",
"google_maps",
"wildberries",
"yandex_market",
"uzum",
"ozon",
name= "platforms")

#Тип платформы, точка на карте или маркетплейс
platformType = Enum(
"map",
"marketplace",
name = "platformType")

statusForAi = Enum(
"pending", #Ии создал ответ
"approved", #Менеджер одобрил ответ
name="statusForAi")

#Таблица Users
class Users(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    id_telegram_chat: Mapped[Optional[int]] =  mapped_column(BigInteger, unique=True, nullable=True)
    telegram_token: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    companies: Mapped[list["Companies"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    
#Таблица companies(Компании)         
class Companies(Base):
    __tablename__ = "companies"
    id: Mapped[int] = mapped_column(primary_key=True)
    users_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_description: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    user: Mapped["Users"] = relationship(back_populates="companies")
    filials: Mapped[list["Filials"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    credentials: Mapped[list["PlatformData"]] = relationship(back_populates="company", cascade="all, delete-orphan")

#Для платформ
class PlatformData(Base):
    __tablename__ = "platform_data"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(platforms, nullable=False)
    seller_token_from_marketplaces: Mapped[str] = mapped_column(Text, nullable=False)
    extra_data_marketplaces: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True) #у каждой платформы свои дополнительные поля помимо токена. Для того, чтобы не писать много колонок можно использовать JSONB
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now()) #когда была создана запись
    update_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())#Дата последнего изменения записи. При создании совпадает с created_at. Но в отличие от него должен обновляться при каждом UPDATE.
    company: Mapped["Companies"] = relationship(back_populates="credentials")
    __table_args__ = (UniqueConstraint("company_id", "platform"),)#одна компания не может подключить один и тот же маркетплейс дважды  

#Для филиалов    
class Filials(Base):
    __tablename__ = "filials"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    filial_name: Mapped[str] = mapped_column(String(255), nullable=False)
    filial_address: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    company: Mapped["Companies"] = relationship(back_populates="filials")
    resourses: Mapped[list["MonitoringResourses"]] = relationship(back_populates="filial", cascade="all, delete-orphan")

#Источники откуда брать отзывы    
class MonitoringResourses(Base):
    __tablename__ = "monitoringresourses"
    id: Mapped[int] = mapped_column(primary_key=True)
    filial_id: Mapped[int] = mapped_column(ForeignKey("filials.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(platforms, nullable=False)
    platform_type: Mapped[str] = mapped_column(platformType, nullable=False)
    url: Mapped[str] = mapped_column(Text)
    marketplace_shop_id_only: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)#Для разраб.А, "Последняя проверка"
    filial: Mapped["Filials"] = relationship(back_populates="resourses")
    reviews: Mapped[list["Reviews"]] = relationship(back_populates="source", cascade="all, delete-orphan")

#Таблица отзывов
class Reviews(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    resource_id: Mapped[int] = mapped_column(ForeignKey("monitoringresourses.id", ondelete="CASCADE"), nullable=False)
    id_platform_review: Mapped[str] = mapped_column(String(255), nullable=False)
    author_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    rating: Mapped[int] =  mapped_column(SmallInteger, nullable=False)
    text_review: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    url_review: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    product_name: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    is_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped["MonitoringResourses"] = relationship(back_populates="reviews")
    draft: Mapped[Optional["AiDrafts"]] = relationship(back_populates="review", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("resource_id", "id_platform_review"),) 

#Таблица для ИИ    
class AiDrafts(Base):
    __tablename__ = "ai_drafts"
    id: Mapped[int] = mapped_column(primary_key=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("reviews.id", ondelete="CASCADE"), unique=True)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    edited_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(statusForAi, default="pending")
    tg_message_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    review: Mapped["Reviews"] = relationship(back_populates="draft", uselist=False)    

async_sessionlocal = sessionmaker(bind=DATABASE_CONN, class_=AsyncSession, expire_on_commit=False)   

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with DATABASE_CONN.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await DATABASE_CONN.dispose()


'''
#Таблица Users
class Users(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    language_code: Mapped[str] = mapped_column(String(200), default="ru")
    companies: Mapped[List["Companies"]] = relationship(back_populates="user", cascade="all, delete-orphan") #Связь с таблицой companies, у одного юзера может быть несколько компаний,
                                                                                                                        #При удалении юзера удаляться все его компании
    
#Таблица Companies
class Companies(Base):
    __tablename__ = "companies"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id")) #Связываем через внешний ключ
    name: Mapped[str] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    user: Mapped["Users"] = relationship(back_populates="companies") #Связь с таблицой users
    # При удалении компании автоматически удалятся все её филиалы.
    branches: Mapped[List["Branches"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    telegram_settings: Mapped[List["Telegram"]] = relationship(back_populates="company", cascade="all, delete-orphan")

#Таблица branches(филиалы / Точки на карте)
class Branches(Base):
    __tablename__ = "branches"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(40), nullable=False) #Записываем платформы
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    company: Mapped["Companies"] = relationship(back_populates="branches")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reply_language: Mapped[str] = mapped_column(String(200), default="auto")
    reviews: Mapped[List["Reviews"]] = relationship(back_populates="branch", cascade="all, delete-orphan") # При удалении филиала автоматически удалятся все его отзывы.

#Таблица отзывы
class Reviews(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id", ondelete="CASCADE"), nullable=False) # Связываем числовой ID отзыва с числовым ID филиала
    external_id: Mapped[str] = mapped_column(String(255), nullable=False) # В каком формате Яндекс отдает ID???
    author_name: Mapped[str] = mapped_column(String(200), nullable=True)
    rating: Mapped[int] = mapped_column(nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False) # Сам текст отзыва клиента
    pub_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ai_draft: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(default="new", nullable=False) #Автоматически для ответов ИИ 
    branch: Mapped["Branches"] = relationship(back_populates="reviews")
    __table_args__ = (UniqueConstraint("branch_id", "external_id"),)
    
#Таблица для телеграмма, одна компания может иметь несколько тг чатов
class Telegram(Base):
    __tablename__ = "telegram_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    chat_id: Mapped[int] = mapped_column(nullable=False)
'''
