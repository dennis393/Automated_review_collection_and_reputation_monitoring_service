from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from basemodel import UserRegistration, UserLogin, CreateCompany, UserResponse, Token, CompanyResponse, RenameCompany,  CreateBranch, ResponseBranch,  UpdateBranch
from orm import async_sessionlocal, Users, Companies, Branches
from secure import get_password_hash, verify_password, create_access_token, get_user, get_curr_user, auth_scheme, get_email_from_token
from fastapi.security import OAuth2PasswordRequestForm
from config import Settings
from fastapi import Depends


router = APIRouter()

#Создаем нового пользователя, роут принимает Pydantic модель 
@router.post("/register", response_model=str)
async def create_new_user(new_user: UserRegistration):
    async with async_sessionlocal() as sess:
        result = await sess.execute(select(Users).where(Users.email == new_user.email))
        user = result.scalars().first()
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
        sess.add(user_db)
        await sess.commit()
    
        return "Пользователь успешно добавлен"


#Роутер для аутентификации
@router.post("/token", response_model=Token)
async def auth(user_data:  OAuth2PasswordRequestForm=Depends()):
    user = await get_user(user_data.username)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

#Роутер для получения текущего пользователя
@router.get("/users/me", response_model=UserResponse)
async def get_current_user(user_email: str=Depends(get_email_from_token)): 
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.email == user_email))
        user = res.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        return user
#___________________________________________________________________________________________________________________
#Внизу роуты для таблицы Companies 
@router.post("/Create_company", response_model=CompanyResponse)
async def create_company(company: CreateCompany, current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        new_company = Companies(name=company.company_name, user_id=current_user.id)
        sess.add(new_company)
        await sess.commit()
        await sess.refresh(new_company)
        return new_company

#Роутер для просмотра компании
@router.get("/View_company", response_model=list[CompanyResponse])
async def view_company(current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Companies).where(Companies.user_id==current_user.id))
        return res.scalars().all()

#Роутер для изменения названия компании
@router.patch("/rename_company/{id_company}", response_model=CompanyResponse)
async def rename_company(id_company: int, new_name: RenameCompany, current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Companies).where(Companies.id == id_company, Companies.user_id == current_user.id))
        company = res.scalars().first()
         
        if company is None:
            raise HTTPException(status_code=404, detail="Компания не найдена")
        
        company.name = new_name.name
        await sess.commit()
        await sess.refresh(company)
        return company 

#____________________________________________________________________________________________________________________
#Роуты для таблицы branches(добавление филиалов)
@router.post("/add_branch", response_model=str)
async def add_branch(add_brnch: CreateBranch, current_user: Users =  Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Companies).where(Companies.id == add_brnch.company_id, Companies.user_id == current_user.id))
        
        company = res.scalars().first()
        
        if company is None:
            raise HTTPException(status_code=404, detail="Компания не найдена")
        
        new_branch = Branches(
            company_id=add_brnch.company_id,
            platform=add_brnch.platform,
            title=add_brnch.title,
            url=str(add_brnch.url),
        )
        sess.add(new_branch)
        await sess.commit()
        
    return "Филиал успешно добавлен"


#Показываем пользователю все его филиалы
@router.get("/get_branches", response_model=list[ResponseBranch])
async def get_branch(current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Branches).join(Companies).where(Companies.user_id == current_user.id))
        branches = res.scalars().all()
    return branches


#Обновляем название филиала или ссылки
@router.put("/update_name_or_url/{id_branch}", response_model=ResponseBranch)
async def update_name_url(id_branch: int, new_names:UpdateBranch, current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Branches).join(Companies).where(Companies.user_id == current_user.id, Branches.id == id_branch))
        branch = res.scalars().first()
        
        if branch is None:
             raise HTTPException(status_code=404, detail="Филиал не найден")
            
        if new_names.title is not None:
            branch.title = new_names.title
            
        if new_names.url is not None:
            branch.url = str(new_names.url)
        await sess.commit()
        await sess.refresh(branch)    
        return branch
    
            
 
        
             
    
    

    
