"""Ingest knowledge-base PDFs into the RAG vector store.

Run via: python -m app.ingest_docs
Idempotent — skips any filename already in the documents table.
"""
import asyncio
import os
import re

from openai import AsyncOpenAI
from pypdf import PdfReader
from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models.document import Document

_openai = AsyncOpenAI(api_key=settings.openai_api_key)

DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "docs")

# ---------------------------------------------------------------------------
# Volatility Framework PDF — structured by numbered sections 1-20
# ---------------------------------------------------------------------------
VOL_FRAMEWORK_FILE = "Volatility_Trading_Data_Framework-1.pdf"
SECTION_TO_CATEGORY: dict[int, str] = {
    1: "iv_analysis",
    2: "realized_vol",
    3: "greeks",
    4: "order_flow",
    5: "event_vol",
    6: "macro",
    7: "sentiment",
    8: "correlation",
    9: "technical_analysis",
    10: "tail_risk",
    11: "fixed_income",
    12: "seasonality",
    13: "exotic_structures",
    14: "fundamentals",
    15: "commodities",
    16: "crypto",
    17: "microstructure",
    18: "geopolitical",
    19: "alt_data",
    20: "portfolio_mgmt",
}

# ---------------------------------------------------------------------------
# Options 101 PDF — general options education, chunked by page
# ---------------------------------------------------------------------------
OPTIONS_101_FILE = "Options-101-The-Ultimate-Beginners-Guide-To-Options.pdf"

# Map Options 101 chapter titles (or page ranges) to category slugs.
# The PDF is a beginner guide covering fundamentals, greeks, and basic strategies.
OPTIONS_101_KEYWORDS: dict[str, list[str]] = {
    "fundamentals": ["what is an option", "call option", "put option", "strike price", "expiration", "premium", "intrinsic", "extrinsic", "in the money", "out of the money", "moneyness"],
    "greeks": ["delta", "gamma", "theta", "vega", "rho", "greek"],
    "iv_analysis": ["implied volatility", "iv rank", "iv percentile", "volatility smile", "volatility skew"],
    "trade_structuring": ["spread", "straddle", "strangle", "iron condor", "butterfly", "collar", "covered call", "protective put", "vertical spread", "calendar spread"],
    "risk_management": ["risk", "max loss", "max profit", "breakeven", "margin", "assignment"],
    "order_flow": ["volume", "open interest", "bid", "ask", "liquidity"],
}


async def _embed_chunk(text: str) -> list[float]:
    """Embed a document chunk directly (bypasses short-query embedding cache)."""
    resp = await _openai.embeddings.create(model="text-embedding-3-small", input=text)
    return resp.data[0].embedding


def _extract_text(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)
    full = "\n".join(pages)
    full = re.sub(r"--\s*\d+\s*of\s*\d+\s*--", "", full)
    full = full.replace("Volatility Trading Data Framework", "")
    full = re.sub(r"\n{3,}", "\n\n", full)
    return full.strip()


def _extract_pages(pdf_path: str) -> list[str]:
    """Extract text page-by-page."""
    reader = PdfReader(pdf_path)
    pages = []
    for page in reader.pages:
        text = (page.extract_text() or "").strip()
        if text:
            pages.append(text)
    return pages


def _split_vol_framework_sections(full_text: str) -> list[tuple[int, str]]:
    """Split Volatility Framework text into (section_number, section_text) pairs."""
    pattern = re.compile(r"^(\d{1,2})\.\s+([A-Z][A-Za-z].*)", re.MULTILINE)
    splits = list(pattern.finditer(full_text))
    sections: list[tuple[int, str]] = []
    seen: set[int] = set()
    for i, match in enumerate(splits):
        section_num = int(match.group(1))
        if section_num not in SECTION_TO_CATEGORY or section_num in seen:
            continue
        seen.add(section_num)
        start = match.start()
        end = splits[i + 1].start() if i + 1 < len(splits) else len(full_text)
        section_text = full_text[start:end].strip()
        if len(section_text) > 50:
            sections.append((section_num, section_text))
    return sections


def _classify_options101_chunk(text: str) -> str:
    """Classify an Options 101 page into the best-matching category."""
    text_lower = text.lower()
    scores: dict[str, int] = {}
    for category, keywords in OPTIONS_101_KEYWORDS.items():
        scores[category] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "fundamentals"


async def _already_ingested(db, filename: str) -> bool:
    result = await db.execute(
        select(Document.id).where(Document.filename == filename).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def _ingest_vol_framework(db) -> int:
    """Ingest the Volatility Trading Data Framework PDF by section."""
    pdf_path = os.path.join(DOCS_DIR, VOL_FRAMEWORK_FILE)
    if not os.path.exists(pdf_path):
        print(f"  {VOL_FRAMEWORK_FILE} not found — skipping")
        return 0

    if await _already_ingested(db, VOL_FRAMEWORK_FILE):
        print(f"  '{VOL_FRAMEWORK_FILE}' already ingested — skipping")
        return 0

    full_text = _extract_text(pdf_path)
    sections = _split_vol_framework_sections(full_text)
    count = 0

    for section_num, section_text in sections:
        category = SECTION_TO_CATEGORY[section_num]
        embedding = await _embed_chunk(section_text)
        doc = Document(
            filename=VOL_FRAMEWORK_FILE,
            chunk_index=section_num,
            content=section_text,
            embedding=embedding,
            metadata_={"category": category, "section_number": section_num, "source": "vol_framework"},
        )
        db.add(doc)
        count += 1
        print(f"  Ingested section {section_num}: {category} ({len(section_text)} chars)")

    await db.commit()
    print(f"  Vol Framework: {count} sections ingested")
    return count


async def _ingest_options_101(db) -> int:
    """Ingest the Options 101 PDF by page, classifying each into a category."""
    pdf_path = os.path.join(DOCS_DIR, OPTIONS_101_FILE)
    if not os.path.exists(pdf_path):
        print(f"  {OPTIONS_101_FILE} not found — skipping")
        return 0

    if await _already_ingested(db, OPTIONS_101_FILE):
        print(f"  '{OPTIONS_101_FILE}' already ingested — skipping")
        return 0

    pages = _extract_pages(pdf_path)
    count = 0

    for i, page_text in enumerate(pages):
        if len(page_text) < 50:
            continue
        category = _classify_options101_chunk(page_text)
        embedding = await _embed_chunk(page_text)
        doc = Document(
            filename=OPTIONS_101_FILE,
            chunk_index=i,
            content=page_text,
            embedding=embedding,
            metadata_={"category": category, "page": i + 1, "source": "options_101"},
        )
        db.add(doc)
        count += 1
        print(f"  Ingested page {i + 1}: {category} ({len(page_text)} chars)")

    await db.commit()
    print(f"  Options 101: {count} pages ingested")
    return count


async def ingest() -> int:
    """Ingest all PDFs into the documents table. Returns total chunk count."""
    async with async_session() as db:
        total = 0
        total += await _ingest_vol_framework(db)
        total += await _ingest_options_101(db)
        return total


if __name__ == "__main__":
    asyncio.run(ingest())
