from fastapi import APIRouter, HTTPException, Depends, Header
from basemodel import UserRegistration, UserLogin, CreateCompany, UserResponse, Token
from orm import sessionlocal, Users, get_db
from secure import get_password_hash, verify_password, create_access_token, get_user, get_curr_user


router = APIRouter()

#Создаем нового пользователя, роут принимает Pydantic модель
@router.post("/register", response_model=str)
def create_new_user(new_user: UserRegistration):
    data_base = sessionlocal()
    user = data_base.query(Users).filter(Users.email == new_user.email).first()
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
    data_base.add(user_db)
    data_base.commit()
    data_base.close()
    
    return "Пользователь успешно добавлен"

#Роутер для аутентификации
@router.post("/token", response_model=Token)
def auth(user_data: UserLogin, db=Depends(get_db)):
    user = get_user(db, user_data.email)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

#Роутер для получения текущего пользователя
@router.get("/users/me", response_model=UserResponse)
def get_curr_user(user_email: str=Header(...)): #Троеточие в header делает его обязательным, иначе выкинет ошибку
    data_base = sessionlocal()
    user = data_base.query(Users).filter(Users.email == user_email).first()
    data_base.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
        
    return user