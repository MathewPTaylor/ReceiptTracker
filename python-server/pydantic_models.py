from pydantic import BaseModel, EmailStr, Field, field_serializer
from datetime import date
from typing import List
import datetime, time

# Define the expected JSON request body
class UserRequest(BaseModel):
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    email: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# --- Signup Schemas ---
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class SignupUserOut(BaseModel):
    id: str
    name: str
    email: str

class SignupResponse(BaseModel):
    access_token: str
    token_type: str
    message: str
    user: SignupUserOut





# Pydantic classes for LLM structured output
class PurchasedItem(BaseModel):
    name: str
    quantity: int
    price: float

class Receipt(BaseModel):
    company: str
    list_of_purchased_items: List[PurchasedItem] = Field(alias="listOfPurchasedItems")
    total_price: float | None = Field(default=-1)
    # date_on_receipt: date | None = Field(alias="dateOnReceipt")

    model_config = {
        # Allows you to instantiate the model using either snake_case or the JSON camelCase keys
        "populate_by_name": True
    }
    
class Response(BaseModel):
    isReceipt: bool = Field(alias="isReceipt")
    receipts: Receipt | None = Field(alias="receipt")
    error: str | None = Field(default=None, alias="error", description="Error message if the input is not a receipt")