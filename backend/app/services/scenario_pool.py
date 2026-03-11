"""In-memory scenario pool for instant delivery. Pre-generates and caches scenarios."""
import asyncio
from collections import deque

from app.database import async_session
from app.services.scenario_engine import generate_scenario

# Pool: { "category-difficulty": deque([scenario_data, ...]) }
_pool: dict[str, deque] = {}
_lock = asyncio.Lock()
MIN_POOL_SIZE = 1
MAX_POOL_SIZE = 2


def _key(category: str, difficulty: str) -> str:
    return f"{category}-{difficulty}"


async def get_from_pool(category: str, difficulty: str) -> dict | None:
    """Pop one scenario from pool if available. Returns None if empty."""
    async with _lock:
        key = _key(category, difficulty)
        q = _pool.get(key)
        if not q or len(q) == 0:
            return None
        return q.popleft()


async def add_to_pool(category: str, difficulty: str, scenario_data: dict) -> None:
    """Add scenario to pool."""
    async with _lock:
        key = _key(category, difficulty)
        if key not in _pool:
            _pool[key] = deque(maxlen=MAX_POOL_SIZE)
        q = _pool[key]
        if len(q) < MAX_POOL_SIZE:
            q.append(scenario_data)


async def pool_size(category: str, difficulty: str) -> int:
    async with _lock:
        q = _pool.get(_key(category, difficulty))
        return len(q) if q else 0


async def refill(category: str, difficulty: str) -> None:
    """Generate one scenario and add to pool. Runs in background."""
    try:
        async with async_session() as db:
            scenario_data = await generate_scenario(db, category, difficulty)
            await add_to_pool(category, difficulty, scenario_data)
    except Exception:
        pass  # Silently fail; pool will refill on next request


def spawn_refill(category: str, difficulty: str) -> None:
    """Spawn background task to refill pool."""
    asyncio.create_task(refill(category, difficulty))
