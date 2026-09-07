from pydantic import BaseModel, EmailStr, HttpUrl, Field
from datetime import datetime
from typing import Literal

#Для создания пользователя
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

#Для вывода пользователю информации о нем
class ResponseUser(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    created_at: datetime

#Для регистрации компании
class CreateCompany(BaseModel):
    company_name: str
    company_description: str

#Для показа пользователю
class CompanyResponse(BaseModel):
    id: int
    company_name: str
    company_description: str
    created_at: datetime
    
class RenameCompany(BaseModel):
    company_name: str
    company_description: str
    
  


class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    email: EmailStr | None = None

'''
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
    company_name: str
    user_id: int
    created_at: datetime 
    
#Для изменения имени компании
class RenameCompany(BaseModel):
    company_name: str

#Для создания ссылки на компанию, название платформы, описание
class CreateBranch(BaseModel):
    company_id: int
    title: str = Field(..., max_length=700, description="Название точки")
    platform: Literal["yandex", "2gis", "uzum"] = Field(..., description="Только платформы Yandex, 2GIS, Uzum")
    url: HttpUrl = Field(..., description="Полная ссылка на филиал")

#Для возврата пользователю всех его филиалов    
class ResponseBranch(BaseModel):
    id: int
    company_id: int
    title: str
    platform: str
    url: HttpUrl
    
#Для роута PUT обновление ссылки или названия филиала
class UpdateBranch(BaseModel):
    title: str | None = None 
    url: HttpUrl | None = None

#Для показа пользователю всех отзывов    
class ResponseReview(BaseModel):
    id: int
    branch_id: int
    author_name: str | None
    rating: int
    text: str
    pub_date: datetime
    ai_draft: str | None #Пользователь должен видеть ИИ черновик
    final_reply: str | None #Также должен видеть отправил он или нет итоговый ответ
    status: str #Требует ли отзыв внимания

#Для редактирования ИИ ответа
class UpdateReview(BaseModel):
    ai_draft: str    
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    email: EmailStr | None = None
'''
    
