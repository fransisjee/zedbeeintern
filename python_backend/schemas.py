from pydantic import BaseModel, Json
from typing import Optional, Dict, Any

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None

class PasswordReset(BaseModel):
    username: str
    new_password: str

class ChangePassword(BaseModel):
    currentPassword: str
    newPassword: str

class ConfigUpdate(BaseModel):
    data: Dict[str, Any] # Accepts any JSON object

class ConfigResponse(BaseModel):
    data: Dict[str, Any]
