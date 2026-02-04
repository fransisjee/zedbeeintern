from database import SessionLocal
import models
from utils import sync_user_to_files

db = SessionLocal()
users = db.query(models.User).all()

print(f"Found {len(users)} users. Syncing...")

for user in users:
    sync_user_to_files(user, db)

db.close()
print("Manual sync complete.")
