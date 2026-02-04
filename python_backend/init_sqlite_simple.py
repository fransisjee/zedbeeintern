from database import engine, SessionLocal
import models
from passlib.context import CryptContext

# Match auth.py scheme
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# Create tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check and create default user
    user = db.query(models.User).filter(models.User.username == "zedbee").first()
    if not user:
        hashed_password = get_password_hash("zedbee123")
        new_user = models.User(username="zedbee", password=hashed_password)
        db.add(new_user)
        db.commit()
        print("Default user 'zedbee' created with password 'zedbee123'")
    else:
        print("User 'zedbee' already exists")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
