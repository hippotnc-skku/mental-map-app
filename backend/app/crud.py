# CRUD functions
from sqlalchemy import text

def get_centers_nearby(db, lat, lng, radius):
    sql = text(f"""
        SELECT id, name, phone, website, intro,
        ST_X(location) as lng, ST_Y(location) as lat,
        ST_Distance(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) as distance_m
        FROM centers
        WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)
        ORDER BY distance_m
    """)
    result = db.execute(sql, {"lat": lat, "lng": lng, "radius": radius})
    return [dict(row) for row in result]
