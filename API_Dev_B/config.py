from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    LIVE_MINUTES_TOKEN: int = 30
    ENCRYPTION_KEY: str
    TG_BOT_TOKEN: str
    
    model_config = SettingsConfigDict(env_file=Path(__file__).parent.parent / ".env", env_file_encoding="utf-8", extra="ignore") #Если файлы находятся в на разных уровнях юзаем это

settings = Settings()