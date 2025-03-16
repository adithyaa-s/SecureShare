from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True

# File schemas
class FileBase(BaseModel):
    name: str
    size: int
    content_type: Optional[str] = None
    encrypted: bool = True

class FileCreate(FileBase):
    pass

class File(FileBase):
    id: str
    owner_id: str
    created_at: datetime

    class Config:
        orm_mode = True

# File share schemas
class FileShareBase(BaseModel):
    file_id: str
    user_id: str

class FileShareCreate(BaseModel):
    email: EmailStr

class FileShare(FileShareBase):
    id: str
    shared_by: str
    created_at: datetime
    file: File

    class Config:
        orm_mode = True

# Shared file schema (for API responses)
class SharedFile(BaseModel):
    id: str
    name: str
    size: int
    shared_at: datetime
    shared_by: str
    encrypted: bool = True

    class Config:
        orm_mode = True