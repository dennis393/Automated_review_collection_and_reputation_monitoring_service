from cryptography.fernet import Fernet #Для кодирования токенов продавцов маркетплейсов

import hmac
import hashlib
import json
from urllib.parse import parse_qsl
from datetime import datetime, timezone, timedelta
from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status
from config import settings
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from basemodel import TokenData
from orm import Users, async_sessionlocal
import os
from sqlalchemy import select

ENCRYPTION_TOKEN_FOR_MARKETPLACES = settings.ENCRYPTION_KEY
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
LIVE_TOKEN_MINUTES = settings.LIVE_MINUTES_TOKEN
TG_BOT_TOKEN = settings.TG_BOT_TOKEN
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = 86400

auth_scheme = OAuth2PasswordBearer(tokenUrl="auth/telegram-webapp", auto_error=False)

#Создаем токен и его время жизни
def create_access_token(data: dict, time: Optional[timedelta] = None):
    to_encode = data.copy()
    if time:
        expire = datetime.now(timezone.utc) + time
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=LIVE_TOKEN_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

#верификация токена
def verify_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        raw_sub = payload.get("sub")
        if raw_sub is None:
            raise credentials_exception
        user_id = int(raw_sub)
        token_data = TokenData(user_id=user_id)
    except InvalidTokenError:
        raise credentials_exception
    return token_data

#Ищем пользователя в бд по id
async def get_user_by_id(user_id):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.id == user_id))
        return res.scalars().first()
        
#Декодируем JWT и вытаскиваем email
def get_user_id_from_token(token: str=Depends(auth_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        raw_sub = payload.get("sub")
        if raw_sub is None:
            raise HTTPException(status_code=401, detail="Невалидный токен")
        return int(raw_sub)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Невалидный токен")


#Проверка initData из Telegram Mini App (HMAC-подпись бот-токеном)
def verify_telegram_init_data(init_data: str) -> dict:
    invalid_data_exception = HTTPException(status_code=401, detail="Невалидные данные Telegram")

    data = dict(parse_qsl(init_data))
    received_hash = data.pop("hash", None)
    if not received_hash:
        raise invalid_data_exception

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))

    secret_key = hmac.new(b"WebAppData", TG_BOT_TOKEN.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise invalid_data_exception

    auth_date = int(data.get("auth_date", 0))
    now = datetime.now(timezone.utc).timestamp()
    if now - auth_date > TELEGRAM_INIT_DATA_MAX_AGE_SECONDS:
        raise HTTPException(status_code=401, detail="initData устарел")

    try:
        user_data = json.loads(data["user"])
    except (KeyError, json.JSONDecodeError):
        raise invalid_data_exception

    return {
        "id_telegram_chat": user_data["id"],
        "full_name": user_data.get("first_name", "Пользователь"),
        "language_code": user_data.get("language_code", "ru"),
    }

#Текущий пользователь
async def get_curr_user(token: Annotated[str, Depends(auth_scheme )]):
    credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Не удалось проверить учетные данные",
    headers={"WWW-Authenticate": "Bearer"},
    )
        
    token_data = verify_token(token, credentials_exception)
    user = await get_user_by_id(token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

#Получаем и декодируем токен для маркетплейсов
def encrypt_token(token: str):
    fernet = Fernet(os.getenv("ENCRYPTION_KEY"))
    return fernet.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str):
    fernet = Fernet(os.getenv("ENCRYPTION_KEY"))
    return fernet.decrypt(encrypted_token.encode()).decode()

