import asyncio
from config import settings

from aiogram import Bot, Dispatcher,types    
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart, Command 
from orm import async_sessionlocal, Users, AiDrafts, Reviews, MonitoringResourses, Filials, Companies
from sqlalchemy import select
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext
from sqlalchemy.orm import selectinload
from LLM import generate_draft


dp = Dispatcher()

Translate_buttons = {
    "ru": {
        "send": "Отправить",
        "approve": "Одобрить",
        "edit": "Редактировать",
        
        "style_formal": "Официальный",
        "style_casual": "Неофициальный",
        "style_neutral": "Нейтральный"
    },
    "uz": {
        "send": "Yuborish",
        "approve": "Tasdiqlash",
        "edit": "Tahrirlash",
        
        "style_formal": "Rasmiy",
        "style_casual": "Norasmiy",
        "style_neutral": "Neytral"
    }
}

def get_text(key, lang="ru"):
    return Translate_buttons.get(lang, Translate_buttons["ru"]).get(key, key)



#Основная функция для запуска бота
async def main():
    token = settings.TG_BOT_TOKEN          
    if not token:                       
        error = "No token provided"      
        raise ValueError(error)          
    bot = Bot(token=token)               

    print("Starting bot...")
    try:
        await asyncio.gather(dp.start_polling(bot), #Одновременный запуск
        polling_new_drafts(bot))      
    finally:
        print("Bot stopped")

@dp.message(CommandStart())
async def start(message: Message):
    args = message.text.split()
    if len(args) < 2:
        await message.answer("Введите токен: /start ваш_токен")
        return
    
    token = args[1] 
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.telegram_token == token))
        user = res.scalars().first()
        
        if not user:
            await message.answer("Неверный токен / Noto'g'ri token")
            return
        
        user.id_telegram_chat = message.from_user.id
        user.telegram_token = None
        
        await sess.commit()
        
    builder = InlineKeyboardBuilder()
    builder.add(
        types.InlineKeyboardButton(text="Русский", callback_data="start_lang_ru"),
        types.InlineKeyboardButton(text="O'zbekcha", callback_data="start_lang_uz"))

    await message.answer(
        "Выберите язык интерфейса / Bot tilini tanlang:", 
        reply_markup=builder.as_markup())
    
# Обработка выбора языка при старте
@dp.callback_query(lambda c: c.data.startswith("start_lang_"))
async def start_language_callback(callback: CallbackQuery):
    # Извлекаем язык из callback_data
    chosen_lang = callback.data.split("_")[2]
    
    async with async_sessionlocal() as sess:
        res = await sess.execute(
            select(Users).where(Users.id_telegram_chat == callback.from_user.id)
        )
        user = res.scalars().first()
        
        if not user:
            await callback.answer("Пользователь не найден / Foydalanuvchi topilmadi")
            return
        
        # Сохраняем выбранный язык в базу данных
        user.language_code = chosen_lang
        await sess.commit()
        
    # Удаляем сообщение с кнопками выбора языка
    await callback.message.delete()
    
    # Отправляем приветствие на выбранном языке
    if chosen_lang == "uz":
        await callback.message.answer("Hisob muvaffaqiyatli bog‘landi")
    else:
        await callback.message.answer("Аккаунт успешно привязан")
    
    await callback.answer()

#Кнопки для выбора стиля ответа ИИ
def button_for_ai_style(lang: str):
    builder = InlineKeyboardBuilder()
    builder.add(
        types.InlineKeyboardButton(text=Translate_buttons[lang]["style_formal"], callback_data=f"ai_style:{lang}:formal"),
        types.InlineKeyboardButton(text=Translate_buttons[lang]["style_casual"], callback_data=f"ai_style:{lang}:casual"),
        types.InlineKeyboardButton(text=Translate_buttons[lang]["style_neutral"], callback_data=f"ai_style:{lang}:neutral"))
    return builder.as_markup()


#Обработка кнопок стиля ответа ИИ
@dp.message(Command("style"))
async def show_style_menu(message: Message):
    user_id = message.from_user.id
    
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.id_telegram_chat == user_id))
        user = res.scalars().first()
        
        if not user:
            await message.answer("Пользователь не найден  / Foydalanuvchi topilmadi")
            return
        
        user_lang = user.language_code if user else "ru"
        
        if user_lang == "uz":
            await message.answer(
                text="Sun'iy intellekt javob uslubini tanlang:",
                reply_markup=button_for_ai_style(user_lang))
        else:
            await message.answer(
                text="Выберите стиль ответов искусственного интеллекта:",
                reply_markup=button_for_ai_style(user_lang))

#Callback для кнопок выбора стиля ИИ            
@dp.callback_query(lambda c: c.data.startswith("ai_style:"))
async def save_ai_style(callback: CallbackQuery):
    _, lang, style = callback.data.split(":")
    
    async with async_sessionlocal() as sess:
        res = await sess.execute(
            select(Users).where(Users.id_telegram_chat == callback.from_user.id))
        user = res.scalars().first()
        
        if not user:
            await callback.answer("Пользователь не найден / Foydalanuvchi topilmadi")
            return
        
        user.ai_style = style
        await sess.commit()
        
    await callback.answer("Стиль сохранён!" if lang == "ru" else "Uslub saqlandi!")
    await callback.message.delete()        
            
    
        
    
def callback_inline_keyboard(draft_id: int, lang: str = "ru"):
    builder = InlineKeyboardBuilder()
    builder.add(types.InlineKeyboardButton(
    text=get_text("send", lang),
    callback_data=f"send_{draft_id}"
    ), 
    types.InlineKeyboardButton(
        text=get_text("approve", lang),
        callback_data=f"approve_{draft_id}"   
    ),
    types.InlineKeyboardButton(
        text=get_text("edit", lang),
        callback_data=f"edit_{draft_id}"))
    return builder.as_markup()

#Обработка нажатия кнопки "Одобрить"
@dp.callback_query(lambda c: c.data.startswith("approve_"))
async def approve_draft(callback: CallbackQuery):
    draft_id = int(callback.data.split("_")[1])
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.id_telegram_chat == callback.from_user.id))
        user = res.scalars().first()
        
        if not user:
            await callback.answer("Пользователь не найден / Foydalanuvchi topilmadi")
            return
        
        draft = await sess.execute(select(AiDrafts).join(Reviews).join(MonitoringResourses).join(Filials).join(Companies).where(AiDrafts.id == draft_id, Companies.users_id == user.id))
        draft_user_id = draft.scalars().first()
        if not draft_user_id:
            await callback.answer("Черновик не найден / Qoralama topilmadi")
            return
        
        draft_user_id.status = "approved"
        await sess.commit()
        await callback.answer("Одобрено!")

#Обработка нажатия кнопки "Отправить"
@dp.callback_query(lambda c: c.data.startswith("send_"))
async def send_mes(callback: CallbackQuery):
    send_id_mes = int(callback.data.split("_")[1])
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.id_telegram_chat == callback.from_user.id))
        user = res.scalars().first()
        
        if not user:
            await callback.answer("Пользователь не найден / Foydalanuvchi topilmadi")
            return
        
        send_id = await sess.execute(select(AiDrafts).join(Reviews).join(MonitoringResourses).join(Filials).join(Companies).where(AiDrafts.id == send_id_mes, Companies.users_id == user.id))
        send_user_id = send_id.scalars().first()
        if not send_user_id:
            await callback.answer("Нет сообщения для отправки / Yuborish uchun xabar yo'q")
            return
        
        send_user_id.status = "approved"
        await sess.commit()
        await callback.answer("Сообщение отправлено! / Xabar yuborildi!")

#Для редактирования сообщения        
class EditDraft(StatesGroup):
    waiting_for_text = State()  

#Когда юзер нажал на кнопку ожидаем от него новый ответ    
@dp.callback_query(lambda c: c.data.startswith("edit_"))
async def edit_draft(callback: CallbackQuery, state: FSMContext):
    draft_id = int(callback.data.split("_")[1])
    await state.set_state(EditDraft.waiting_for_text)
    await state.update_data(draft_id=draft_id)
    await callback.message.answer("Введите новый текст ответа: / Yangi javob matnini kiriting:")   
    
      
#Обновляем базу если юзер ввел новый текст
@dp.message(EditDraft.waiting_for_text)
async def save_edited_text(message: Message, state: FSMContext):
    data = await state.get_data()
    draft_id = data["draft_id"]
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.id_telegram_chat == message.from_user.id))
        user = res.scalars().first()
        
        if not user:
            await message.answer("Пользователь не найден / Foydalanuvchi topilmadi")
            return
        
        send_id = await sess.execute(select(AiDrafts).join(Reviews).join(MonitoringResourses).join(Filials).join(Companies).where(AiDrafts.id == draft_id, Companies.users_id == user.id))
        draft_send_user_id = send_id.scalars().first()
        
        if not draft_send_user_id:
            await message.answer("Черновик не найден / Qoralama topilmadi")
            return
        
        draft_send_user_id.edited_text = message.text
        await sess.commit()
        await message.answer("Ответ обновлён / Javob yangilandi")
        
    await state.clear()    

        
async def polling_new_drafts(bot: Bot): #Фоновая задача
    while True:
        print("Проверяем...")
        async with async_sessionlocal() as sess:
            res = await sess.execute(
                select(Reviews)
                .options(
                    selectinload(Reviews.source).options(
                        selectinload(MonitoringResourses.filial).options(
                            selectinload(Filials.company).options(
                                selectinload(Companies.user)
                            )
                        )
                    )
                )
                .join(MonitoringResourses)
                .join(Filials)
                .join(Companies)
                .join(Users)
                .where(Reviews.is_notified == False)
            )
            reviews = res.scalars().all()
            print(f"Найдено: {len(reviews)}")
            for review in reviews:
                company = review.source.filial.company
                user = company.user
                
                if not user.id_telegram_chat:
                    print(f"⚠️ Пропуск отзыва ID {review.id}: У пользователя {user.id} (Компания: {company.company_name}) НЕ ПРИВЯЗАН Telegram-чат (id_telegram_chat равен None)!")
                    continue # Переходим к следующему отзыву, цикл не ломается
                
                generated_text = await generate_draft(
                review_text=review.text_review,
                company_name=company.company_name,
                company_description=company.company_description,
                platform=review.source.platform,
                rating=review.rating,
                product_name=review.product_name,
                ai_style=user.ai_style or "neutral")
                
                new_draft = AiDrafts(
                review_id=review.id,
                original_text=generated_text)
                sess.add(new_draft)
                await sess.flush()
                
                user_lang = getattr(user, 'language_code', 'ru') or 'ru'    
                # Формируем текст сообщения
                text = (
                    f"Рейтинг: {review.rating}/5\n"
                    f"Автор: {review.author_name}\n"
                    f"Отзыв: {review.text_review}\n\n"
                    f"Черновик ответа:\n{generated_text}")
                
                
                # Отправляем в Telegram
                sent = await bot.send_message(
                    chat_id=user.id_telegram_chat,
                    text=text,
                    reply_markup=callback_inline_keyboard(new_draft.id, lang=user_lang)
                )

                # Сохраняем tg_message_id
                new_draft.tg_message_id = sent.message_id

                # Помечаем что уведомление отправлено
                review.is_notified = True
                await sess.commit()

            # Ждём 30 секунд и повторяем
            await asyncio.sleep(30)
        
#Клавиатура для теста
@dp.message(Command("test_keyboard"))
async def test_keyboard(message: Message):
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.id_telegram_chat == message.from_user.id))
        user = res.scalars().first()
        lang = user.language_code if user else "ru"
    await message.answer(
        "Тест кнопок",
        reply_markup=callback_inline_keyboard(1, lang=lang)
    )
   
if __name__ == "__main__":
    asyncio.run(main())