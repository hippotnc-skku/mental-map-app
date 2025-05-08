from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# .env.dev 파일 로드
load_dotenv(".env.dev")

class Settings(BaseSettings):
    # 데이터베이스 설정
    DB_USER: str = os.getenv("DB_USER", "smpapa")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "passw0rd")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5434")
    DB_NAME: str = os.getenv("DB_NAME", "mentalcenter")

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # API 설정
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Mental Map API"
    
    # 카카오 API 설정
    KAKAO_API_KEY: str = os.getenv("KAKAO_API_KEY", "")

settings = Settings() 