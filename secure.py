
from datetime import datetime, timezone, timedelta
from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status
from config import Settings
from pwdlib import PasswordHash
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from jwt.exceptions import InvalidTokenError
from basemodel import UserRegistration, Token, TokenData
from orm import Users, async_sessionlocal
import os
from sqlalchemy import select

password_hash = PasswordHash.recommended()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
LIVE_TOKEN_MINUTES = int(os.getenv("LIVE_MINUTES_TOKEN"))

auth_scheme = OAuth2PasswordBearer(tokenUrl="token", description="Сюда вводим Email")

#Верификация пароля, возвращает True / False
def verify_password(plain_password: str, hashed_password: str):
    return password_hash.verify(plain_password, hashed_password)

#Хэширование пароля для сохранения в бд
def get_password_hash(password: str):
    return password_hash.hash(password)

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
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except InvalidTokenError:
        raise credentials_exception
    return token_data

#Ищем пользователя в бд
async def get_user(email:str):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.email == email))
        return res.scalars().first() 
        
        
#Декодируем JWT и вытаскиваем email
def get_email_from_token(token: str=Depends(auth_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Невалидный токен")
        return email
    except InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Невалидный токен")

#Текущий пользователь
async def get_curr_user(token: Annotated[str, Depends(auth_scheme )]):
    credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Не удалось проверить учетные данные",
    headers={"WWW-Authenticate": "Bearer"},
    )
        
    token_data = verify_token(token, credentials_exception)
    user = await get_user(token_data.email)
    if user is None:
        raise credentials_exception
    return user

