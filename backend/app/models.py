from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from .database import Base

class PsychCenter(Base):
    __tablename__ = "psych_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    phone = Column(String)
    address = Column(String)
    website = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    isopen = Column(Boolean, default=True)
    region = Column(String)
    description = Column(Text)
