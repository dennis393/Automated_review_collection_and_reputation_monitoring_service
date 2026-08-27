from fastapi import APIRouter, HTTPException, Depends, Header
from basemodel import UserRegistration, UserLogin, CreateCompany, UserResponse, Token, CompanyResponse
from orm import sessionlocal, Users, Companies, get_db
from secure import get_password_hash, verify_password, create_access_token, get_user, get_curr_user, auth_scheme, get_email_from_token
from fastapi.security import  OAuth2PasswordRequestForm
from config import Settings
router = APIRouter()

#Создаем нового пользователя, роут принимает Pydantic модель
@router.post("/register", response_model=str)
def create_new_user(new_user: UserRegistration, db=Depends(get_db)):
    user = db.query(Users).filter(Users.email == new_user.email).first()
    #Если пользователь уже зарегистрирован
    if user:
         raise HTTPException(
            status_code=400,
            detail="Пользователь уже зарегистрирован"
        )
    #Хэшируем пароль
    hashed_password = get_password_hash(new_user.password)
    
    #Pydantic модель нельзя добавить в бд, создаем ORM объект
    user_db = Users(email=new_user.email, password_hash=hashed_password)
    
    #добавляем пользователя в бд
    db.add(user_db)
    db.commit()

    
    return "Пользователь успешно добавлен"

#Роутер для аутентификации
@router.post("/token", response_model=Token)
def auth(user_data:  OAuth2PasswordRequestForm=Depends(), db=Depends(get_db)):
    user = get_user(db, user_data.username)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

#Роутер для получения текущего пользователя
@router.get("/users/me", response_model=UserResponse)
def get_current_user(user_email: str=Depends(get_email_from_token), db=Depends(get_db)): 
    user = db.query(Users).filter(Users.email == user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
        
    return user

#Внизу роуты для таблицы Companies Dennis@yandex.ru
@router.post("/Create_company", response_model=CompanyResponse)
def create_company(company: CreateCompany, current_user: Users = Depends(get_curr_user), db=Depends(get_db)):
    new_company = Companies(name=company.company_name, user_id=current_user.id)
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company
    