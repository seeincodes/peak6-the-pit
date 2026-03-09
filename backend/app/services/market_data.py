"""Fetch and cache a lightweight market snapshot for scenario grounding."""
import time
from datetime import datetime, timezone

import httpx

_cache: dict[str, str] = {}
_cache_ts: float = 0.0
_CACHE_TTL = 1800  # 30 minutes

TICKERS = {
    "^GSPC": "S&P 500 (SPX)",
    "^VIX": "VIX",
    "^TNX": "10Y Treasury Yield",
    "^IRX": "3M T-Bill Rate",
    "GC=F": "Gold",
    "CL=F": "WTI Crude Oil",
    "DX-Y.NYB": "US Dollar Index (DXY)",
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
}

# Tickers displayed as yield % rather than price
_YIELD_TICKERS = {"^TNX", "^IRX"}
# Tickers displayed with $ prefix
_DOLLAR_TICKERS = {"^GSPC", "GC=F", "CL=F", "BTC-USD", "ETH-USD"}

FALLBACK = "Live market data temporarily unavailable."


async def _fetch_ticker(client: httpx.AsyncClient, symbol: str) -> dict | None:
    """Fetch a single ticker's current price and daily change from Yahoo Finance."""
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        resp = await client.get(
            url,
            params={"interval": "1d", "range": "2d"},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        result = data["chart"]["result"][0]
        meta = result["meta"]
        price = meta["regularMarketPrice"]
        prev_close = meta.get("chartPreviousClose") or meta.get("previousClose")
        pct_change = ((price - prev_close) / prev_close * 100) if prev_close else 0
        return {"price": price, "change_pct": pct_change}
    except Exception:
        return None


def _format_snapshot(results: dict[str, dict]) -> str:
    """Format fetched ticker data into a readable text block."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [f"As of {now}:"]
    for symbol, label in TICKERS.items():
        data = results.get(symbol)
        if not data:
            continue
        price = data["price"]
        change = data["change_pct"]
        sign = "+" if change >= 0 else ""

        if symbol in _YIELD_TICKERS:
            lines.append(f"- {label}: {price:.2f}% ({sign}{change:.1f}%)")
        elif symbol in _DOLLAR_TICKERS:
            lines.append(f"- {label}: ${price:,.2f} ({sign}{change:.1f}%)")
        else:
            lines.append(f"- {label}: {price:,.2f} ({sign}{change:.1f}%)")

    return "\n".join(lines) if len(lines) > 1 else FALLBACK


async def _fetch_all() -> str:
    """Fetch all tickers concurrently and return formatted snapshot."""
    results: dict[str, dict] = {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        import asyncio
        tasks = {sym: _fetch_ticker(client, sym) for sym in TICKERS}
        fetched = await asyncio.gather(*tasks.values(), return_exceptions=True)
        for sym, result in zip(tasks.keys(), fetched):
            if isinstance(result, dict):
                results[sym] = result

    return _format_snapshot(results)


async def get_market_snapshot() -> str:
    """Return cached market snapshot, refreshing if stale."""
    global _cache, _cache_ts
    if _cache.get("snapshot") and (time.time() - _cache_ts) < _CACHE_TTL:
        return _cache["snapshot"]

    snapshot = await _fetch_all()
    _cache["snapshot"] = snapshot
    _cache_ts = time.time()
    return snapshot


async def prewarm_market_data() -> None:
    """Fill the cache at startup."""
    snapshot = await get_market_snapshot()
    status = "ok" if snapshot != FALLBACK else "fallback"
    print(f"Market data prewarmed ({status})")
