import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

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
    DB_USER: str = os.getenv("DB_USER", "smpapa")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "passw0rd")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5434")
    DB_NAME: str = os.getenv("DB_NAME", "mentalcenter")
    
    # 카카오 API 설정
    KAKAO_API_KEY: str = os.getenv("KAKAO_API_KEY")
    if not KAKAO_API_KEY:
        raise ValueError("KAKAO_API_KEY is not set in .env.dev file")

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # API 설정
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Mental Map API"
    
settings = Settings() 

if __name__ == "__main__":
    print(f"settings : {settings}")
    print(f"KAKAO_API_KEY: {settings.KAKAO_API_KEY}")

