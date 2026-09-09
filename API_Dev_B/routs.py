import secrets
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from basemodel import UserCreate, ResponseUser, CreateCompany, CompanyResponse, RenameCompany, CreateFilial, FilialResponse, UpdateFilial, CreateSource, SourceResponse
from orm import async_sessionlocal, Users, Companies, Filials, MonitoringResourses
from secure import get_password_hash, verify_password, create_access_token, get_user, get_curr_user, auth_scheme, get_email_from_token, Token
from fastapi.security import OAuth2PasswordRequestForm
from config import Settings
from fastapi import Depends


router = APIRouter()

#Создаем нового пользователя, роут принимает Pydantic модель den@gmail.com l
@router.post("/register", response_model=ResponseUser)
async def create_new_user(new_user: UserCreate):
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
        user_db = Users(full_name=new_user.full_name, email=new_user.email, password_hash=hashed_password, telegram_token=secrets.token_hex(16)) #Тут же гененрим тг токен пользователя
    
        #добавляем пользователя в бд
        sess.add(user_db)
        await sess.commit()
        await sess.refresh(user_db)
    
        return user_db


#Роутер для аутентификации
@router.post("/token", response_model=Token)
async def auth(user_data:  OAuth2PasswordRequestForm=Depends()):
    user = await get_user(user_data.username)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт отключен")
         
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

#Роутер для получения текущего пользователя
@router.get("/users/me", response_model=ResponseUser)
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
        new_company = Companies(company_name=company.company_name,company_description=company.company_description, users_id=current_user.id)
        sess.add(new_company)
        await sess.commit()
        await sess.refresh(new_company)
        return new_company

#Роутер для просмотра компании
@router.get("/View_company", response_model=list[CompanyResponse])
async def view_company(current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Companies).where(Companies.users_id==current_user.id))
        companies = res.scalars().all()
        
        if not companies:
            raise HTTPException(status_code=404, detail="Компания не найдена")
        return companies
            
#Роутер для изменения названия компании
@router.patch("/rename_company/{id_company}", response_model=CompanyResponse)
async def rename_company(id_company: int, new_name: RenameCompany, current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Companies).where(Companies.id == id_company, Companies.users_id == current_user.id))
        company = res.scalars().first()
         
        if company is None:
            raise HTTPException(status_code=404, detail="Компания не найдена")
        
        company.company_name = new_name.company_name
        company.company_description = new_name.company_description
        await sess.commit()
        await sess.refresh(company)
        return company 
    

#____________________________________________________________________________________________________________________
#Роуты для таблицы Filial(добавление филиалов)
@router.post("/add_filial", response_model=FilialResponse)
async def add_filial(add_filial: CreateFilial, current_user: Users =  Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Companies).where(Companies.id == add_filial.company_id, Companies.users_id == current_user.id))
        
        filial = res.scalars().first()
        
        if filial is None:
            raise HTTPException(status_code=404, detail="Компания не найдена")
        
        new_filial = Filials(
            company_id=add_filial.company_id,
            filial_name=add_filial.filial_name,
            filial_address=add_filial.filial_address,
        )
        sess.add(new_filial)
        await sess.commit()
        await sess.refresh(new_filial)
        
    return new_filial

#Показываем пользователю все его филиалы
@router.get("/get_filials", response_model=list[FilialResponse])
async def get_filials(current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Filials).join(Companies).where(Companies.users_id == current_user.id))
        filials = res.scalars().all()
    return filials


#Обновляем название филиала или его адрес
@router.patch("/update_name_or_address/{id_filial}", response_model=FilialResponse)
async def update_name_address(id_filial: int, new_names: UpdateFilial, current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Filials).join(Companies).where(Companies.users_id == current_user.id, Filials.id == id_filial))
        filial = res.scalars().first()
        
        if filial is None:
            raise HTTPException(status_code=404, detail="Филиал не найден")
            
        if new_names.filial_name is not None:
            filial.filial_name = new_names.filial_name
            
        if new_names.filial_address is not None:
            filial.filial_address = new_names.filial_address
            
        await sess.commit()
        await sess.refresh(filial)    
        return filial
    
#Удаляем филиал если клиент закрыл точку чтобы парсер его не отслеживал
@router.delete("/delete_filial/{id_filial}", response_model=str)
async def delete_filial(id_filial: int, current_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Filials).join(Companies).where(Companies.users_id == current_user.id, Filials.id == id_filial))
        filial = res.scalars().first()
        
        if filial is None:
            raise HTTPException(status_code=404, detail="Филиал не найден")
        
        await sess.delete(filial)
        await sess.commit()
        return "Филиал удален"
     
#________________________________________________________________________________________________________
#Роуты для таблицы MonitoringResourses
#Функция для добавления ссылки к филиалу, и определения что это "Физ точка на карте или маркетплейс"
MAP_PLATFORMS = {"yandex", "2GIS", "google_maps"}
@router.post("/sources", response_model=SourceResponse)
async def create_source(new_source: CreateSource, curr_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(
            select(Filials).join(Companies).where(
                Companies.users_id == curr_user.id,
                Filials.id == new_source.filial_id
            )
        )
        filial = res.scalars().first()

        if filial is None:
            raise HTTPException(status_code=404, detail="Филиал не найден")

        platform_type = "map" if new_source.platform in MAP_PLATFORMS else "marketplace"

        if new_source.platform in MAP_PLATFORMS and not new_source.url:
            raise HTTPException(status_code=400, detail="Для карт нужна ссылка")

        if new_source.platform not in MAP_PLATFORMS and not new_source.marketplace_shop_id_only:
            raise HTTPException(status_code=400, detail="Для маркетплейсов нужен ID магазина")

        source_db = MonitoringResourses(
            filial_id=new_source.filial_id,
            platform=new_source.platform,
            platform_type=platform_type,
            url=str(new_source.url) if new_source.url else None,
            marketplace_shop_id_only=new_source.marketplace_shop_id_only,
        )

        sess.add(source_db)
        await sess.commit()
        await sess.refresh(source_db)
        return source_db
#показат ь пользователю активные ссылки его компаании        
@router.get("/get_sourses/{filial_id}", responce_model=list[SourseResponse])
async def get_sourses(filial_id: int, curr_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(MonitoringResourses).join(Filials).join(Companies).where(Companies.users_id == curr_user.id, MonitoringResourses.filial_id == filial_id))       
        sourses = res.scalars().all()
        return sourses
'''
#Роут для редактирования ответа ИИ
@router.put("/update_ai_answer/{id_review}",response_model=ResponseReview)
async def update_ai_response(id_review: int, update_data: UpdateReview, curr_user: Users = Depends(get_curr_user)):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Reviews).join(Branches, Reviews.branch_id == Branches.id).join(Companies, Branches.company_id == Companies.id).where(Companies.user_id == curr_user.id, Reviews.id == id_review))
        rev = res.scalars().first()
        
        if rev is None:
            raise HTTPException(status_code=404, detail="Отзыв не найден")
        
        rev.ai_draft = update_data.ai_draft
        
        await sess.commit()
        await sess.refresh(rev)  
        return rev  
'''




            
 
        
             
    
    

    
