from sqlalchemy import create_engine, MetaData, Column, Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from dotenv import load_dotenv #Для postgree, данные подключения тоже хранятся в .env
import os
import psycopg2


class Base(DeclarativeBase):
    pass

load_dotenv()

DATABASE_CONN = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

engine = create_engine(DATABASE_CONN)

#Таблица Users
class Users(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(50))
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    companies = relationship("Companies", back_populates="user") #Связь с таблицой companies
    
#Таблица Companies
class Companies(Base):
    __tablename__ = "companies"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id")) #Связываем через внешний ключ
    name: Mapped[str] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    user = relationship("Users", back_populates="companies") #Связь с таблицой users
    

sessionlocal = sessionmaker(bind=engine)   

Base.metadata.create_all(bind=engine)

def get_db():
    db = sessionlocal()
    try:
        yield db
    finally:
        db.close()

 