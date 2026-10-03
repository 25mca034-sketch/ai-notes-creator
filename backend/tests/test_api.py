import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "tools" in data
    assert "summarize_text" in data["tools"]
    assert "extract_key_points" in data["tools"]

def test_generate_notes_empty_validation():
    response = client.post("/api/notes/generate", json={"topic": "", "content": ""})
    assert response.status_code == 400

def test_chat_empty_validation():
    response = client.post("/api/chat", json={"message": "", "sessionId": "test_sess"})
    assert response.status_code == 400

def test_memory_clear():
    response = client.delete("/api/memory/non_existent_session")
    assert response.status_code == 200
    assert response.json()["cleared"] is False
