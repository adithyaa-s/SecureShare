from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import os
import jwt
import bcrypt
import uuid
from cryptography.fernet import Fernet
import base64
import socketio
import asyncio

# Import database models and schemas
from database import SessionLocal, engine
import models
import schemas

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Secure File Sharing API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Socket.io
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["*"]  # In production, replace with specific origins
)
socket_app = socketio.ASGIApp(sio)
app.mount("/socket.io", socket_app)

# Connected clients
connected_clients: Dict[str, Dict] = {}

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")  # Use environment variable in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Generate encryption key for files
def generate_encryption_key():
    return Fernet.generate_key()

# Encrypt file content
def encrypt_file(file_content: bytes, key: bytes) -> bytes:
    f = Fernet(key)
    return f.encrypt(file_content)

# Decrypt file content
def decrypt_file(encrypted_content: bytes, key: bytes) -> bytes:
    f = Fernet(key)
    return f.decrypt(encrypted_content)

# Hash password
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

# Verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Authenticate user
def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

# Create access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = schemas.TokenData(user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Socket.io event handlers
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    connected_clients[sid] = {"authenticated": False}

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    if sid in connected_clients:
        del connected_clients[sid]

@sio.event
async def authenticate(sid, data):
    try:
        token = data.get("token")
        if not token:
            return {"success": False, "error": "No token provided"}
        
        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        # Get user info
        db = SessionLocal()
        user = db.query(models.User).filter(models.User.id == user_id).first()
        db.close()
        
        if not user:
            return {"success": False, "error": "Invalid token"}
        
        # Store user info
        connected_clients[sid] = {
            "authenticated": True,
            "user_id": user_id,
            "user_email": data.get("userEmail"),
            "user_name": data.get("userName") or user.name
        }
        
        await sio.emit("authentication_success", {"user_id": user_id}, room=sid)
        return {"success": True}
    except Exception as e:
        print(f"Authentication error: {e}")
        return {"success": False, "error": str(e)}

@sio.event
async def start_upload(sid, data):
    if sid in connected_clients and connected_clients[sid]["authenticated"]:
        file_name = data.get("fileName")
        print(f"Upload started for {file_name}")

@sio.event
async def file_uploaded(sid, data):
    if sid in connected_clients and connected_clients[sid]["authenticated"]:
        # Broadcast to all authenticated users except sender
        for client_sid, client_data in connected_clients.items():
            if client_sid != sid and client_data.get("authenticated"):
                await sio.emit("file_upload_notification", {
                    "fileName": data.get("fileName"),
                    "size": data.get("size"),
                    "uploadedBy": data.get("uploadedBy") or connected_clients[sid].get("user_name", "User")
                }, room=client_sid)

@sio.event
async def share_file(sid, data):
    if sid in connected_clients and connected_clients[sid]["authenticated"]:
        shared_with_email = data.get("sharedWith")
        
        # Find the recipient's socket id
        recipient_sid = None
        for client_sid, client_data in connected_clients.items():
            if client_data.get("authenticated") and client_data.get("user_email") == shared_with_email:
                recipient_sid = client_sid
                break
        
        # Send notification to recipient if they're connected
        if recipient_sid:
            await sio.emit("file-shared-with-you", {
                "fileId": data.get("fileId"),
                "fileName": data.get("fileName"),
                "sharedBy": data.get("sharedBy") or connected_clients[sid].get("user_name", "User"),
                "recipient": shared_with_email
            }, room=recipient_sid)

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "name": user.name}}

# User registration
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        id=str(uuid.uuid4()),
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Get current user info
@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# File upload endpoint
@app.post("/files/upload/", response_model=schemas.File)
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Read file content
    file_content = await file.read()
    
    # Generate encryption key
    key = generate_encryption_key()
    
    # Encrypt file content
    encrypted_content = encrypt_file(file_content, key)
    
    # Create file record in database
    db_file = models.File(
        id=str(uuid.uuid4()),
        name=file.filename,
        size=len(file_content),
        content_type=file.content_type,
        encrypted=True,
        owner_id=current_user.id,
        encryption_key=base64.b64encode(key).decode('utf-8')
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    # Save encrypted file to storage
    file_path = f"files/{db_file.id}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(encrypted_content)
    
    # Emit socket.io event for upload completion
    for sid, client_data in connected_clients.items():
        if client_data.get("authenticated") and client_data.get("user_id") == current_user.id:
            await sio.emit("upload-complete", {
                "fileId": db_file.id,
                "fileName": db_file.name,
                "size": db_file.size
            }, room=sid)
    
    return db_file

# Get user's files
@app.get("/files/", response_model=List[schemas.File])
def get_user_files(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    files = db.query(models.File).filter(models.File.owner_id == current_user.id).all()
    return files

# Get files shared with user
@app.get("/files/shared/", response_model=List[schemas.SharedFile])
def get_shared_files(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shared_files = db.query(models.FileShare).filter(
        models.FileShare.user_id == current_user.id
    ).join(models.File).all()
    
    return shared_files

# Download file
@app.get("/files/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get file from database
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user has access to file
    if file.owner_id != current_user.id:
        # Check if file is shared with user
        share = db.query(models.FileShare).filter(
            models.FileShare.file_id == file_id,
            models.FileShare.user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Read encrypted file
    file_path = f"files/{file_id}"
    with open(file_path, "rb") as f:
        encrypted_content = f.read()
    
    # Decrypt file
    key = base64.b64decode(file.encryption_key)
    decrypted_content = decrypt_file(encrypted_content, key)
    
    # Return file content
    from fastapi.responses import Response
    return Response(
        content=decrypted_content,
        media_type=file.content_type,
        headers={
            "Content-Disposition": f"attachment; filename={file.name}"
        }
    )

# Share file with another user
@app.post("/files/{file_id}/share/", response_model=schemas.FileShare)
def share_file(
    file_id: str,
    share: schemas.FileShareCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get file from database
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user owns the file
    if file.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get user to share with
    user = db.query(models.User).filter(models.User.email == share.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if file is already shared with user
    existing_share = db.query(models.FileShare).filter(
        models.FileShare.file_id == file_id,
        models.FileShare.user_id == user.id
    ).first()
    if existing_share:
        raise HTTPException(status_code=400, detail="File already shared with this user")
    
    # Create file share
    db_share = models.FileShare(
        id=str(uuid.uuid4()),
        file_id=file_id,
        user_id=user.id,
        shared_by=current_user.id
    )
    
    db.add(db_share)
    db.commit()
    db.refresh(db_share)
    
    # Emit socket.io event for file sharing
    for sid, client_data in connected_clients.items():
        if client_data.get("authenticated") and client_data.get("user_id") == user.id:
            asyncio.create_task(sio.emit("file-shared", {
                "fileId": file_id,
                "fileName": file.name,
                "sharedBy": current_user.name
            }, room=sid))
    
    return db_share

# Delete file
@app.delete("/files/{file_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get file from database
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user owns the file
    if file.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete file shares
    db.query(models.FileShare).filter(models.FileShare.file_id == file_id).delete()
    
    # Delete file from database
    db.delete(file)
    db.commit()
    
    # Delete file from storage
    file_path = f"files/{file_id}"
    if os.path.exists(file_path):
        os.remove(file_path)
    
    return None

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)