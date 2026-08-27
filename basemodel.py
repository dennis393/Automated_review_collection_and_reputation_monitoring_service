from pydantic import BaseModel, EmailStr
from datetime import datetime

#Для создания компании
class CreateCompany(BaseModel):
    company_name: str

#Для регистрации
class UserRegistration(BaseModel):
    email: EmailStr
    password: str

#Для аутентификации  
class UserLogin(BaseModel):
    email: EmailStr
    password: str

#Возвращаем пользователю ответ 
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime 

#Возвращаем ответ по компании и пользователе
class CompanyResponse(BaseModel):
    id: int 
    name: str
    user_id: int
    created_at: datetime 
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    email: EmailStr | None = None
    
