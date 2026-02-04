from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import timedelta as TimeDelta

import models, schemas, auth, database
from utils import sync_user_to_files

router = APIRouter(
    prefix="/api",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    sync_user_to_files(new_user, db)
    return {"message": "User created successfully"}

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user:
        # Checking logic like the Node.js app
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not auth.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = TimeDelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"username": db_user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "username": db_user.username}

@router.get("/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {"username": current_user.username}

@router.post("/change-password")
def change_password(body: schemas.ChangePassword, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if not auth.verify_password(body.currentPassword, current_user.password):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    
    hashed_password = auth.get_password_hash(body.newPassword)
    current_user.password = hashed_password
    db.commit()
    sync_user_to_files(current_user, db)
    return {"message": "Password updated successfully"}

@router.post("/reset-password")
def reset_password(body: schemas.PasswordReset, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == body.username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    hashed_password = auth.get_password_hash(body.new_password)
    db_user.password = hashed_password
    db.commit()
    sync_user_to_files(db_user, db)
    return {"message": "Password reset successfully"}

@router.post("/logout")
def logout():
    # Stateless JWT logout usually handled on client, but providing endpoint for completeness
    return {"message": "Logout successful"}
