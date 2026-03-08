"""RAG service: PDF ingestion, chunking, embedding, and retrieval."""
import re

from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.document import Document

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

CATEGORY_QUERIES = {
    "iv_analysis": "implied volatility analysis IV levels percentiles",
    "greeks": "option greeks delta gamma theta vega",
    "order_flow": "order flow unusual options activity volume open interest",
    "macro": "macroeconomic indicators fed rates yield curve",
    "term_structure": "volatility term structure contango backwardation",
    "skew": "implied volatility skew put call risk reversal",
    "correlation": "correlation dispersion implied realized",
    "event_vol": "event volatility earnings announcements FOMC",
    "tail_risk": "tail risk black swan convexity hedging",
    "position_sizing": "position sizing notional risk kelly criterion",
    "trade_structuring": "option spreads strategies structures",
    "vol_surface": "volatility surface strike delta sticky",
    "microstructure": "market microstructure bid ask spread liquidity",
    "risk_management": "risk management VaR stress testing stop loss",
    "capman_tooling": "Atlas trading tools platform analysis",
}


def chunk_text(text_content: str, max_tokens: int = 500, overlap: int = 50) -> list[str]:
    """Split text into chunks, preferring section boundaries."""
    sections = re.split(r"\n(?=#{1,3}\s)", text_content)

    chunks = []
    for section in sections:
        words = section.split()
        if len(words) <= max_tokens:
            if section.strip():
                chunks.append(section.strip())
        else:
            start = 0
            while start < len(words):
                end = start + max_tokens
                chunk = " ".join(words[start:end])
                if chunk.strip():
                    chunks.append(chunk.strip())
                start = end - overlap

    return chunks


def build_retrieval_query(category: str, difficulty: str) -> str:
    """Build a search query string for a given scenario category."""
    base = CATEGORY_QUERIES.get(category, category.replace("_", " "))
    return f"{base} {difficulty} trading scenario"


async def embed_text(text_content: str) -> list[float]:
    """Generate embedding for a single text string using OpenAI."""
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text_content,
    )
    return response.data[0].embedding


async def ingest_text(
    db: AsyncSession,
    filename: str,
    content: str,
    max_tokens: int = 500,
    overlap: int = 50,
) -> int:
    """Chunk text, embed chunks, and store in database. Returns chunk count."""
    chunks = chunk_text(content, max_tokens=max_tokens, overlap=overlap)

    for i, chunk in enumerate(chunks):
        embedding = await embed_text(chunk)
        doc = Document(
            filename=filename,
            chunk_index=i,
            content=chunk,
            embedding=embedding,
            metadata_={"category": "volatility_framework", "chunk_tokens": len(chunk.split())},
        )
        db.add(doc)

    await db.commit()
    return len(chunks)


async def retrieve_chunks(
    db: AsyncSession,
    query: str,
    top_k: int = 5,
) -> list[dict]:
    """Retrieve the most relevant document chunks for a query."""
    query_embedding = await embed_text(query)

    result = await db.execute(
        text("""
            SELECT id, filename, chunk_index, content, metadata,
                   embedding <=> :embedding AS distance
            FROM documents
            ORDER BY embedding <=> :embedding
            LIMIT :limit
        """),
        {"embedding": str(query_embedding), "limit": top_k},
    )

    rows = result.fetchall()
    return [
        {
            "id": str(row.id),
            "filename": row.filename,
            "chunk_index": row.chunk_index,
            "content": row.content,
            "distance": float(row.distance),
        }
        for row in rows
    ]
