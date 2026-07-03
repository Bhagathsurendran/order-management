"""
app/schemas/user.py
Pydantic V2 schemas for User data returned in API responses.
"""
from datetime import datetime
from pydantic import BaseModel


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    username: str
    email: str
    role: str
    created_at: datetime
