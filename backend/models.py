from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    files = relationship("File", back_populates="owner")
    shared_files = relationship("FileShare", back_populates="user")

class File(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    size = Column(Integer)
    content_type = Column(String)
    encrypted = Column(Boolean, default=True)
    encryption_key = Column(Text)  # Base64 encoded encryption key
    owner_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="files")
    shares = relationship("FileShare", back_populates="file")

class FileShare(Base):
    __tablename__ = "file_shares"

    id = Column(String, primary_key=True, index=True)
    file_id = Column(String, ForeignKey("files.id"))
    user_id = Column(String, ForeignKey("users.id"))
    shared_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    file = relationship("File", back_populates="shares")
    user = relationship("User", foreign_keys=[user_id], back_populates="shared_files")
    sharer = relationship("User", foreign_keys=[shared_by])