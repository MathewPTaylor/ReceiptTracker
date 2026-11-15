import os
from pymongo import AsyncMongoClient

import secrets
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic_models import *

app = FastAPI()
# Allow requests from the React dev server (typically port 5173 for Vite or 3000 for CRA)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



MONGODB_URI = "mongodb+srv://threephyluo_db_user:Uy1wxwFugmcOBJbA@cluster0.f0mvs7u.mongodb.net/"

@app.on_event("startup")
async def startup_event():
    app.mongodb_client = AsyncMongoClient(MONGODB_URI)

@app.on_event("shutdown")
async def shutdown_event():
    await app.mongodb_client.close()



@app.get("/")
async def root():
    return {"message": "Hello World. FastAPI + AsyncMongoClient is running. Try GET /ping-db"}

@app.get("/ping-db")
async def ping_db():
    try:
        await app.mongodb_client.admin.command("ping")
        return {"ok": True, "message": "MongoDB is reachable"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})



# Single endpoint handling communication
@app.post("/api/greet")
async def greet_user(request: UserRequest):
    print("THIS IS A REQUEST BITCHES", request)
    return {
        "message": f"Hello, {request.name}! This response came directly from FastAPI.",
        "character_count": len(request.name)
    }


MOCK_USERS = {
    "you@example.com": "secret123"
}

@app.post("/api/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    print("CREDITS:", credentials)
    # This is where we put mongo fetch stuff
    stored_password = MOCK_USERS.get(credentials.email.lower())

    if not stored_password or not secrets.compare_digest(stored_password, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return {
        "access_token": secrets.token_hex(32),
        "token_type": "bearer",
        "user": {"email": credentials.email.lower()},
    }