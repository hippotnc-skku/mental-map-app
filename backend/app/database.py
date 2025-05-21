from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import select, text
from config import settings
import csv
import os
import logging
import codecs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base를 별도로 정의
Base = declarative_base()

# 데이터베이스 엔진 생성
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# 세션 팩토리 생성
SessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def load_initial_data(csv_file: str = "hugmom_centers_20250509.csv"):
    """CSV 파일에서 데이터를 읽어 데이터베이스에 적재합니다."""
    if not os.path.exists(csv_file):
        logger.error(f"CSV file not found: {csv_file}")
        return

    from models import PsychCenter  # 여기서 import

    async with SessionLocal() as session:
        try:
            # BOM 문자를 처리하기 위해 codecs 사용
            with codecs.open(csv_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    logger.info(f"Processing row: {row}")
                    try:
                        # 이미 존재하는 센터인지 확인
                        existing = await session.execute(
                            select(PsychCenter).where(PsychCenter.name == row['name'])
                        )
                        if existing.scalar_one_or_none():
                            logger.info(f"Center already exists: {row['name']}")
                            continue

                        # 위도/경도가 있는 경우에만 geom 설정
                        lat = float(row['lat']) if row.get('lat') else None
                        lng = float(row['lng']) if row.get('lng') else None
                        
                        # isopen 값을 boolean으로 변환
                        isopen = bool(int(row.get('isopen', 0)))
                        
                        if lat is not None and lng is not None:
                            # geom 컬럼 설정을 위한 SQL 실행
                            await session.execute(
                                text("""
                                    INSERT INTO psych_centers (name, phone, address, website, lat, lng, isopen, region, description, geom)
                                    VALUES (:name, :phone, :address, :website, :lat, :lng, :isopen, :region, :description, 
                                            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                                """),
                                {
                                    "name": row['name'],
                                    "phone": row.get('phone', ''),
                                    "address": row.get('address', ''),
                                    "website": row.get('detail_url', ''),
                                    "lat": lat,
                                    "lng": lng,
                                    "isopen": isopen,
                                    "region": row.get('region', ''),
                                    "description": row.get('description', '')
                                }
                            )
                            logger.info(f"Added center with geom: {row['name']}")
                        else:
                            # geom이 없는 경우 일반 insert
                            center = PsychCenter(
                                name=row['name'],
                                phone=row.get('phone', ''),
                                address=row.get('address', ''),
                                website=row.get('detail_url', ''),
                                lat=lat,
                                lng=lng,
                                isopen=isopen,
                                region=row.get('region', ''),
                                description=row.get('description', '')
                            )
                            session.add(center)
                            logger.info(f"Added center without geom: {row['name']}")
                    
                    except KeyError as e:
                        logger.error(f"Missing required field in row: {e}")
                        continue
                    except ValueError as e:
                        logger.error(f"Invalid data format in row: {e}")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing row: {e}")
                        continue
                
                await session.commit()
                logger.info("Initial data loaded successfully")
                
        except Exception as e:
            await session.rollback()
            logger.error(f"Error loading initial data: {str(e)}")
            raise
