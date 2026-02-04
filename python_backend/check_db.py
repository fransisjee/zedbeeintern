from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM users"))
        users = result.fetchall()
        print(f"Total Users Found: {len(users)}")
        for user in users:
            print(f"User: {user.username}, Created: {user.created_at}")
        
        if len(users) == 0:
            print("\nWARNING: No users found. You may need to run the initialization script or sign up.")
except Exception as e:
    print(f"Error connecting to database: {e}")
