import traceback
from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

try:
    print(f"Connecting to: {SQLALCHEMY_DATABASE_URL}")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Connected!")
        result = conn.execute(text("SELECT * FROM users"))
        users = result.fetchall()
        print(f"Total Users Found: {len(users)}")
except Exception:
    traceback.print_exc()
