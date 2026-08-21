from pydantic import BaseModel
from datetime import datetime

#Для создания компании
class CreateCompany(BaseModel):
    company_name: str

#Для регистрации
class UserRegistration(BaseModel):
    email: str
    password: str

#Для входа    
class UserLogin(BaseModel):
    email: str
    password: str

#Возвращаем пользователю ответ 
class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime   
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    email: str | None = None
    
