from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import select, text
from config import settings
import csv
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base를 별도로 정의
Base = declarative_base()

engine = create_async_engine(settings.DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def load_initial_data(csv_file: str = "hugmom_centers_20250507_162727.csv"):
    """CSV 파일에서 데이터를 읽어 데이터베이스에 적재합니다."""
    if not os.path.exists(csv_file):
        logger.error(f"CSV file not found: {csv_file}")
        return

    from models import PsychCenter  # 여기서 import

    async with SessionLocal() as session:
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # 이미 존재하는 센터인지 확인
                    existing = await session.execute(
                        select(PsychCenter).where(PsychCenter.name == row['name'])
                    )
                    if existing.scalar_one_or_none():
                        continue

                    # 위도/경도가 있는 경우에만 geom 설정
                    lat = float(row['lat']) if row['lat'] else None
                    lng = float(row['lng']) if row['lng'] else None
                    
                    if lat is not None and lng is not None:
                        # geom 컬럼 설정을 위한 SQL 실행
                        await session.execute(
                            text("""
                                INSERT INTO psych_centers (name, phone, address, website, lat, lng, description, geom)
                                VALUES (:name, :phone, :address, :website, :lat, :lng, :description, 
                                        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                            """),
                            {
                                "name": row['name'],
                                "phone": row['phone'],
                                "address": row['address'],
                                "website": row['detail_url'],
                                "lat": lat,
                                "lng": lng,
                                "description": None
                            }
                        )
                    else:
                        # geom이 없는 경우 일반 insert
                        center = PsychCenter(
                            name=row['name'],
                            phone=row['phone'],
                            address=row['address'],
                            website=row['detail_url'],
                            lat=lat,
                            lng=lng
                        )
                        session.add(center)
                
                await session.commit()
                logger.info("Initial data loaded successfully")
                
        except Exception as e:
            await session.rollback()
            logger.error(f"Error loading initial data: {str(e)}")
            raise
