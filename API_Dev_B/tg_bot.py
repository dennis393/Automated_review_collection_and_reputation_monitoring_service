import asyncio
from config import settings

from aiogram import Bot, Dispatcher,types    
from aiogram.types import Message 
from aiogram.filters import CommandStart, Command 
from orm import async_sessionlocal, Users
from sqlalchemy import select
from aiogram.utils.keyboard import InlineKeyboardBuilder


dp = Dispatcher()


async def main():
    token = settings.TG_BOT_TOKEN          
    if not token:                       
        error = "No token provided"      
        raise ValueError(error)          
    bot = Bot(token=token)               

    print("Starting bot...")
    try:
        await dp.start_polling(bot)      
    finally:
        print("Bot stopped")

@dp.message(CommandStart())
async def start(message: Message):
    token = message.text.split()[1]
    
    async with async_sessionlocal() as sess:
        res = await sess.execute(select(Users).where(Users.telegram_token == token))
        user = res.scalars().first()
        
        if not user:
            await message.answer("Неверный токен")
            return
        
        user.id_telegram_chat = message.from_user.id
        user.telegram_token = None
        
        await sess.commit()
        
        await message.answer("Аккаунт успешно привязан")


def callback_inline_keyboard(draft_id: int):
    builder = InlineKeyboardBuilder()
    builder.add(types.InlineKeyboardButton(
    text="Отправить",
    callback_data=f"edit_{draft_id}"
    ), 
    types.InlineKeyboardButton(
        text = "Одобрить",
        callback_data=f"approved_{draft_id}"
        
    ),
    types.InlineKeyboardButton(
        text = "Редактировать",
        callback_data=f"reject_{draft_id}"))
    return builder.as_markup()

#Эта функция для тестирования и больше ни для чего
@dp.message(Command("test_keyboard"))
async def test_keyboard(message: Message):
    await message.answer(
        "Тестовое уведомление об отзыве",
        reply_markup=callback_inline_keyboard(1)  # передаём тестовый draft_id=1
    )
   
if __name__ == "__main__":
    asyncio.run(main())