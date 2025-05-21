from fastapi import FastAPI, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import SessionLocal, init_db, load_initial_data
from models import PsychCenter
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

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

# DB 세션 의존성
async def get_db():
    async with SessionLocal() as session:
        yield session

# 심리센터 거리순 정렬 + 반경 필터링 API
@app.get("/centers")
async def get_centers(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(2000),  # 기본 반경 2000m
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
