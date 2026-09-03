import asyncio
from fastapi import FastAPI
from typing import List
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from contextlib import asynccontextmanager
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func, Text, UniqueConstraint
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

#Таблица Users
class Users(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
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


#Таблица branches(филиалы / Точки на карте)
class Branches(Base):
    __tablename__ = "branches"
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(40), nullable=False) #Записываем платформы
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    company: Mapped["Companies"] = relationship(back_populates="branches")
    reviews: Mapped[List["Reviews"]] = relationship(back_populates="branch", cascade="all, delete-orphan") # При удалении филиала автоматически удалятся все его отзывы.

#Таблица отзывы
class Reviews(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id", ondelete="CASCADE"), nullable=False) # Связываем числовой ID отзыва с числовым ID филиала
    external_id: Mapped[str] = mapped_column(String(255), nullable=False) # В каком формате Яндекс отдает ID???
    author_name: Mapped[str] = mapped_column(String(200))
    rating: Mapped[int] = mapped_column(nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False) # Сам текст отзыва клиента
    pub_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ai_draft: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(default="new", nullable=False) #Автоматически для ответов ИИ 
    branch: Mapped["Branches"] = relationship(back_populates="reviews")
    __table_args__ = (UniqueConstraint("branch_id", "external_id"),)
     

async_sessionlocal = sessionmaker(bind=DATABASE_CONN, class_=AsyncSession, expire_on_commit=False)   

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with DATABASE_CONN.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await DATABASE_CONN.dispose()


