from pydantic import BaseModel

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
