from sqlalchemy import Boolean, Column, Integer, String, Float, Text
from geoalchemy2 import Geometry
from database import Base

class PsychCenter(Base):
    __tablename__ = "psych_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    address = Column(String(200))
    website = Column(String(200))
    lat = Column(Float)
    lng = Column(Float)
    description = Column(Text)
    isopen = Column(Boolean, default=True)
    region = Column(String(20))
    geom = Column(Geometry(geometry_type='POINT', srid=4326))
