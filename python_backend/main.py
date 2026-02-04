from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import auth, config

# Create tables if they don't exist (though init-db.js usually handles this)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZedBee Python Backend")

# CORS setup
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:5500",  # Live Server
    "*"  # Allow all for development simplicity
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(config.router)

@app.get("/")
def read_root():
    return {"message": "ZedBee Python Backend is running"}
