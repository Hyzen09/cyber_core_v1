from pydantic import BaseModel

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    filename: str | None = None
    agent_id: str | None = None
