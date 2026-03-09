"""RAG service: PDF ingestion, chunking, embedding, and retrieval."""
import asyncio
import re

from openai import AsyncOpenAI
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.document import Document
from app.models.embedding_cache import EmbeddingCache
from app.database import async_session as session_factory

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

# In-memory cache backed by DB — survives restarts and is shared across instances
_embedding_cache: dict[str, list[float]] = {}

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
    """Generate embedding. Checks: memory cache → DB cache → OpenAI API (writes through to both)."""
    cached = _embedding_cache.get(text_content)
    if cached is not None:
        return cached

    # Check DB cache
    async with session_factory() as db:
        row = await db.execute(
            select(EmbeddingCache).where(EmbeddingCache.query_text == text_content)
        )
        entry = row.scalar_one_or_none()
        if entry is not None:
            embedding = [float(x) for x in entry.embedding]
            _embedding_cache[text_content] = embedding
            return embedding

    # Cache miss — call OpenAI and persist
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text_content,
    )
    embedding = response.data[0].embedding
    _embedding_cache[text_content] = embedding

    # Write through to DB
    async with session_factory() as db:
        db.add(EmbeddingCache(query_text=text_content, embedding=embedding))
        await db.commit()

    return embedding


async def prewarm_embeddings() -> None:
    """Load cached embeddings from DB, then compute any missing ones."""
    # Load all existing cached embeddings from DB into memory
    async with session_factory() as db:
        result = await db.execute(select(EmbeddingCache))
        rows = result.scalars().all()
        for row in rows:
            _embedding_cache[row.query_text] = [float(x) for x in row.embedding]
    loaded = len(_embedding_cache)

    # Compute any missing embeddings (writes through to DB)
    tasks = []
    for category in CATEGORY_QUERIES:
        for difficulty in ("beginner", "intermediate"):
            query = build_retrieval_query(category, difficulty)
            if query not in _embedding_cache:
                tasks.append(embed_text(query))
    if tasks:
        await asyncio.gather(*tasks)

    print(f"RAG embeddings: {loaded} from DB, {len(tasks)} newly computed")


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
