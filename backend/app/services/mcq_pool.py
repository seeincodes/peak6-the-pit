"""In-memory MCQ pool for instant delivery. Pre-generates and caches MCQs."""
import asyncio
from collections import deque

from app.database import async_session
from app.services.scenario_engine import generate_mcq

# Pool: { "category-difficulty": deque([mcq_data, ...]) }
_pool: dict[str, deque] = {}
_lock = asyncio.Lock()
MIN_POOL_SIZE = 1
MAX_POOL_SIZE = 3


def _key(category: str, difficulty: str) -> str:
    return f"{category}-{difficulty}"


async def get_from_pool(category: str, difficulty: str) -> dict | None:
    """Pop one MCQ from pool if available. Returns None if empty."""
    async with _lock:
        key = _key(category, difficulty)
        q = _pool.get(key)
        if not q or len(q) == 0:
            return None
        return q.popleft()


async def add_to_pool(category: str, difficulty: str, mcq_data: dict) -> None:
    """Add MCQ to pool. Does not persist to DB."""
    async with _lock:
        key = _key(category, difficulty)
        if key not in _pool:
            _pool[key] = deque(maxlen=MAX_POOL_SIZE)
        q = _pool[key]
        if len(q) < MAX_POOL_SIZE:
            q.append(mcq_data)


async def pool_size(category: str, difficulty: str) -> int:
    async with _lock:
        q = _pool.get(_key(category, difficulty))
        return len(q) if q else 0


async def refill(category: str, difficulty: str) -> None:
    """Generate one MCQ and add to pool. Runs in background."""
    try:
        async with async_session() as db:
            mcq_data = await generate_mcq(db, category, difficulty)
            await add_to_pool(category, difficulty, mcq_data)
    except Exception:
        pass  # Silently fail; pool will refill on next request


def spawn_refill(category: str, difficulty: str) -> None:
    """Spawn background task to refill pool."""
    asyncio.create_task(refill(category, difficulty))


async def prewarm(categories: list[tuple[str, str]]) -> None:
    """Pre-generate one MCQ per category on startup."""
    for category, difficulty in categories:
        spawn_refill(category, difficulty)
