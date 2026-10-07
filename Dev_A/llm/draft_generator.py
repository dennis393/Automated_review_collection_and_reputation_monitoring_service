from API_Dev_B.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.OPENAI_TOKEN)

async def generate_draft(review_text: str, company_name: str, company_description: str, platform: str, rating: int, product_name: str = None, ai_style: str = "neutral"):
    # Стиль ответа
    style_prompt = {
        "formal": "Отвечай официально и профессионально.",
        "casual": "Отвечай дружелюбно и тепло.",
        "neutral": "Отвечай нейтрально и вежливо."
    }.get(ai_style, "Отвечай нейтрально и вежливо.") # выберет neutral по дефолту если по какой то причине будет пусто  
    
    system_prompt = f"""
Ты — менеджер компании «{company_name}».
О компании: {company_description}.
Платформа отзыва: {platform}.
{"Товар: " + product_name if product_name else ""}
{style_prompt}
Напиши ответ на отзыв клиента.
Ответ должен быть на том же языке что и отзыв.
Не используй шаблонные фразы. Будь конкретным.
Ответ не должен быть длиннее 3-4 предложений.
"""

    user_prompt = f"""
Рейтинг: {rating} из 5
Текст отзыва: {review_text}
"""

    response = await client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
    ],
    temperature= 0.7,
    stream=False
)
    return response.choices[0].message.content
