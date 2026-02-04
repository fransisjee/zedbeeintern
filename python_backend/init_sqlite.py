from database import engine, SessionLocal
import models
from auth import get_password_hash

# Create tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

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

db.close()
