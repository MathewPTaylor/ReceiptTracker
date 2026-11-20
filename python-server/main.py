import os, json
from pymongo import AsyncMongoClient, InsertOne
import base64
import secrets
from fastapi import FastAPI, status, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic_models import *
from dotenv import load_dotenv
from google import genai
from datetime import datetime, timezone
from pwdlib import PasswordHash
from agent import zero_shot_query

# Load environment variables
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("gemini api ",GEMINI_API_KEY)

# Initialize Argon2 password hasher
password_hasher = PasswordHash.recommended()

# Initialise FastAPI app instance
app = FastAPI()
# Allow requests from the React dev server (typically port 5173 for Vite or 3000 for CRA)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.post("/api/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, request: Request):
    print("CREDITS:", credentials)
    db = request.app.mongodb_client["receiptdb"]
    users_collection = db["customers"]

    # Inside your /api/login route:
    print("BOUTTA JUMP IN.")
    user = await users_collection.find_one({"email": credentials.email.lower().strip()})
    print("WE HERE NOW.")
    if not user or not password_hasher.verify(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return {
        "access_token": secrets.token_hex(32),
        "token_type": "bearer",
        "user": {"email": credentials.email.lower()},
    }


@app.post("/api/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, request: Request):
    # Access the database attached to your FastAPI app
    db = request.app.mongodb_client["receiptdb"]
    users_collection = db["customers"]

    normalized_email = payload.email #.lower().strip()

    # 1. Check if email is already registered
    existing_user = await users_collection.find_one({"email": normalized_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 2. Hash the plain-text password (NEVER store plain-text passwords)
    hashed_password = password_hasher.hash(payload.password)

    # 3. Insert new user document into MongoDB
    new_user_doc = {
        "name": payload.name.strip(),
        "email": normalized_email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc),
    }
    insert_result = await users_collection.insert_one(new_user_doc)

    # 4. Generate session token (or swap for a signed JWT / HttpOnly cookie)
    token = secrets.token_hex(32)

    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Account created successfully",
        "user": {
            "id": str(insert_result.inserted_id),
            "name": new_user_doc["name"],
            "email": normalized_email,
        },
    }


@app.get("/api/chat")
async def chat_response(query: str, request: Request):
    response = zero_shot_query(query)
    return {"response" : response}



# Initialize the Gemini client (automatically picks up GEMINI_API_KEY from environment)
client = genai.Client()
@app.post("/api/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    db = request.app.mongodb_client["receiptdb"]
    users_collection = db["receipts"]
    print(file)

    # Validate file type (include HEIC/HEIF for iPhones)
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
    if file.content_type not in allowed_types and not (file.filename or "").lower().endswith((".heic", ".heif")):
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
    
    contents = await file.read()
    
    try:
        # Send the image bytes and prompt to Gemini for OCR extraction
        response = client.interactions.create(
            model="gemini-3.5-flash-lite",
            input=[
                {"type": "text", "text": "Perform accurate OCR on this image. Extract all visible text exactly as it appears."},
                {
                    "type": "image",
                    "data": base64.b64encode(contents).decode('utf-8'),
                    "mime_type": file.content_type,
                }
            ],
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": Receipt.model_json_schema()
            },
        )

        print(response.output_text)
        structured_receipt_output: Receipt = Receipt.model_validate_json(response.output_text)

        mongo_doc = structured_receipt_output.model_dump(by_alias=True)

        print("MONGOOO", mongo_doc)
        json_ver = json.loads(response.output_text)
        print(json_ver)
        final_string = json_ver["company"] + "\n"
        for item in json_ver['listOfPurchasedItems']:
            line_str = f"x{item['quantity']} {item['name']}  £{item['price']}"
            final_string = final_string + line_str + "\n"
        final_string = final_string + "£" + json_ver["total_price"]


        new_user_doc = {
              "company": structured_receipt_output.company,
              "total_price": structured_receipt_output.total_price,
              # "date_on_receipt": json_ver["date_on_receipt"],
              "customer_id": '6af960454d16a4c2e1913d19',
        }

        insert_result = await users_collection.insert_one(new_user_doc)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gemini OCR processing failed: {str(e)}"
        )

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(contents),
        "message": f"Successfully extracted text from {file.filename}",
        "ocr_text": final_string,
    }