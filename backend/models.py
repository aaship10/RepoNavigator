from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    repo_url = Column(String)
    repo_name = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    summary_data = Column(Text, nullable=True) # Optional JSON string of analysis
