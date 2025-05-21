import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from functools import lru_cache

# 현재 파일의 디렉토리 경로
current_dir = os.path.dirname(os.path.abspath(__file__))
# backend 디렉토리 경로
backend_dir = os.path.dirname(current_dir)
# .env.dev 파일 경로
env_path = os.path.join(backend_dir, '.env.dev')

# .env.dev 파일 로드
if not load_dotenv(env_path):
    raise Exception(f"Failed to load .env.dev file from {env_path}")

class Settings(BaseSettings):
    # 데이터베이스 설정
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/mental_map"
    
    # JWT 설정
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env.dev"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

if __name__ == "__main__":
    print(f"settings : {settings}")
    print(f"KAKAO_API_KEY: {settings.KAKAO_API_KEY}")

