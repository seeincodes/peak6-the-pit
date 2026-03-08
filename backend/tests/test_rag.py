import pytest
from app.services.rag import chunk_text, build_retrieval_query


def test_chunk_text_splits_by_section():
    text = "## Section A\nContent A paragraph.\n\n## Section B\nContent B paragraph."
    chunks = chunk_text(text, max_tokens=50, overlap=10)
    assert len(chunks) >= 2
    assert "Content A" in chunks[0]


def test_chunk_text_respects_max_tokens():
    text = "word " * 1000
    chunks = chunk_text(text, max_tokens=100, overlap=20)
    for chunk in chunks:
        assert len(chunk.split()) <= 120


def test_build_retrieval_query():
    query = build_retrieval_query("iv_analysis", "beginner")
    assert "implied volatility" in query.lower() or "iv" in query.lower()
