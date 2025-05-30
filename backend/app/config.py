import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from functools import lru_cache

# 현재 파일의 디렉토리 경로
current_dir = os.path.dirname(os.path.abspath(__file__))
# backend 디렉토리 경로
backend_dir = os.path.dirname(current_dir)
# .env.dev 파일 경로
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")
env_path = os.path.join(backend_dir, f".env.{ENVIRONMENT}")

# .env.dev 파일 로드
if not load_dotenv(env_path):
    raise Exception(f"Failed to load .env.dev file from {env_path}")

class Settings(BaseSettings):
    # API 설정
    API_KEY: str = "api_key_mentalcentermap"
    
    # 데이터베이스 설정
    DB_USER: str = "smpapa"
    DB_PASSWORD: str = "passw0rd"
    DB_HOST: str = "3.38.5.248"
    DB_PORT: str = "5434"
    DB_NAME: str = "mentalcenter"
    
    # 카카오 API 설정
    KAKAO_API_KEY: str = "c416d595df7465b0494535422d0e5ca4"
    
    # JWT 설정
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = env_path
        case_sensitive = True
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

# DATABASE_URL 생성
settings.DATABASE_URL = f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

if __name__ == "__main__":
    print(f"settings : {settings}")
    print(f"KAKAO_API_KEY: {settings.KAKAO_API_KEY}")

