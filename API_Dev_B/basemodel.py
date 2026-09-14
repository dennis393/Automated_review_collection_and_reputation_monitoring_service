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

#Для изменения компании названия или описания    
class RenameCompany(BaseModel):
    company_name: str
    company_description: str
    
#Для создания филиала, физ. точка на карте
class CreateFilial(BaseModel):
    company_id: int
    filial_name: str = Field(..., max_length=500)
    filial_address: str = Field(None, max_length=500)

#Для возврата данных пользователю по филиалам
class FilialResponse(BaseModel):
    id: int
    company_id: int
    filial_name: str
    filial_address: str | None
    created_at: datetime

#Для изменения названия филиала или адреса филиала
class UpdateFilial(BaseModel):
    filial_name: str | None = Field(None, max_length=700)
    filial_address: str | None = Field(None, max_length=700)

#Для уточнения платформы(физ точка или маркетплейс)
class CreateSource(BaseModel):
    filial_id: int
    platform: Literal["yandex", "2GIS", "google_maps", "wildberries", "ozon", "yandex_market", "uzum"]
    url: HttpUrl | None = None
    marketplace_shop_id_only: str | None = None  

#Для вывода пользователю информации о зарегистрированном мониторинге    
class SourseResponse(BaseModel):
    id: int
    filial_id: int
    platform: str
    platform_type: str
    url: str | None
    marketplace_shop_id_only: str | None
    is_active: bool
    last_checked_at: datetime | None

#Для изменения статуса или ссылки  
class UpdateSourse(BaseModel):
    url: HttpUrl | None = None
    is_active: bool | None = None  
      
#Для создания данных о маркетплейсе
class CreateCredential(BaseModel):
    company_id: int
    platform: Literal["wildberries", "ozon", "yandex_market", "uzum"]
    token: str                          # токен от продавца
    client_id: str | None = None        # для Ozon
    campaign_id: str | None = None      # для Yandex Market, идентификатор компании
    business_id: str | None = None      # для Yandex Market
    shop_id: str | None = None          # для Uzum

#Для вывода пользователю данных о маркетплейсах и платформе
class CredentialResponse(BaseModel):
    id: int
    company_id: int
    platform: str
    is_active: bool
    created_at: datetime   

#Для обновления токена маркетплейса
class UpdateCredential(BaseModel):
    token: str    
    
#Для черновика   
class DraftResponse(BaseModel):
    id: int
    original_text: str
    edited_text: str | None
    status: str
    tg_message_id: int | None
    created_at: datetime
    updated_at: datetime

#Для таблицы Rewiews(два метода GET)
class ReviewResponse(BaseModel):
    id: int
    source_id: int  # это у тебя называется resource_id
    id_platform_review: str
    author_name: str | None
    rating: int
    text_review: str | None
    url_review: str | None
    product_name: str | None
    reviewed_at: datetime
    created_at: datetime
    is_notified: bool 
    draft: DraftResponse | None = None   
#Для AI черновика
class UpdateAIDraft(BaseModel):
    edited_text: str | None = None
    status: Literal["pending", "approved", "rejected"] | None = None
    
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    email: EmailStr | None = None


