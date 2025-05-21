from fastapi import FastAPI, Depends, Query, HTTPException, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from .database import SessionLocal, init_db, load_initial_data
from .models import PsychCenter
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.security.api_key import APIKeyHeader
from .config import settings
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await load_initial_data()  # 초기 데이터 로드
    yield

app = FastAPI(lifespan=lifespan)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 환경에서는 특정 도메인만 허용하도록 수정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 키 인증 설정
api_key_header = APIKeyHeader(name="Authorization", auto_error=True)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header != settings.API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid API Key"
        )
    return api_key_header

# DB 세션 의존성
async def get_db():
    async with SessionLocal() as session:
        yield session

# 심리센터 거리순 정렬 + 반경 필터링 API
@app.get("/api/v1/centers", dependencies=[Depends(get_api_key)])
async def get_centers(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(10000),  # 기본 반경 10000m(10km)
    db: AsyncSession = Depends(get_db)
):
    query = text("""
        SELECT id, name, phone, website, description, lat, lng, region, description,
            ST_DistanceSphere(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) AS distance
        FROM psych_centers
        WHERE ST_DistanceSphere(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) <= :radius
            AND isopen = true
        ORDER BY distance ASC;
    """)
    result = await db.execute(query, {"lat": lat, "lng": lng, "radius": radius})
    centers = result.fetchall()

    return [
        {
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "website": c.website,
            "description": c.description,
            "lat": c.lat,
            "lng": c.lng,
            "region": c.region,
            "description": c.description,
            "distance_m": int(c.distance) if c.distance else None
        }
        for c in centers
    ]


@app.get("/api/v1/centers/{center_id}", dependencies=[Depends(get_api_key)])
async def get_center(center_id: int):
    async with SessionLocal() as session:
        result = await session.execute(select(PsychCenter).where(PsychCenter.id == center_id))
        center = result.scalar_one_or_none()
        if center is None:
            raise HTTPException(status_code=404, detail="Center not found")
        return center


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
