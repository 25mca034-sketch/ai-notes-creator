import pytest
from app.memory.memory_manager import memory_manager
from app.models.schemas import NoteStructure, TermItem, ExampleItem

def test_memory_session_creation():
    session = memory_manager.get_or_create_session("session_test_123")
    assert session.session_id == "session_test_123"
    assert session.current_notes is None

def test_memory_persistence():
    notes = NoteStructure(
        title="Photosynthesis",
        overview="Plant food production process using sunlight.",
        key_points=["Requires sunlight", "Produces oxygen"],
        important_terms=[TermItem(term="Chlorophyll", definition="Green light-absorbing pigment")],
        examples=[ExampleItem(title="Green leaves", description="Leaves capture sunlight")],
        summary="Essential bio process.",
        reading_time_minutes=2
    )
    memory_manager.update_notes("session_test_123", "Photosynthesis", notes, length="short")
    
    retrieved = memory_manager.get_session("session_test_123")
    assert retrieved is not None
    assert retrieved.topic == "Photosynthesis"
    assert retrieved.current_notes.title == "Photosynthesis"
    assert len(retrieved.current_notes.key_points) == 2

    # Clear memory test
    assert memory_manager.clear_session("session_test_123") is True
    assert memory_manager.get_session("session_test_123") is None
