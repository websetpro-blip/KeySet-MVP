"""
FastAPI сервер для связи React frontend с Python backend
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

app = FastAPI(title="KeySet API")

# CORS для React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Временное хранилище (замени на реальную БД)
phrases_db: List[Dict[str, Any]] = []
groups_db: List[Dict[str, Any]] = [{"id": "default", "name": "Все фразы", "parentId": None}]

class Phrase(BaseModel):
    id: str
    text: str
    ws: Optional[int] = None
    qws: Optional[int] = None
    bws: Optional[int] = None
    groupId: str = "default"

class Group(BaseModel):
    id: str
    name: str
    parentId: Optional[str] = None

@app.get("/api/phrases")
async def get_phrases():
    return phrases_db

@app.post("/api/phrases")
async def add_phrase(phrase: Phrase):
    phrases_db.append(phrase.dict())
    return phrase

@app.get("/api/groups")
async def get_groups():
    return groups_db

@app.post("/api/groups")
async def create_group(group: Group):
    groups_db.append(group.dict())
    return group

@app.post("/api/parse")
async def start_parsing(data: Dict[str, Any]):
    """Запуск парсинга - подключи свой turbo_parser"""
    # TODO: Подключить multiparser_manager
    return {"status": "started", "taskId": "task_123"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
