from fastapi import APIRouter, HTTPException
from basemodel import UserRegistration, UserLogin, CreateCompany, UserResponse
from orm import sessionlocal, Users
from secure import get_password_hash, verify_password, create_access_token, get_user, get_curr_user


router = APIRouter()

#Создаем нового пользователя, роут принимает Pydantic модель
@router.post("/register", response_model=UserResponse)
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