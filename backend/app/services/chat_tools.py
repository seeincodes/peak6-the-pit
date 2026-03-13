"""LangChain tools for the AI chatbot – generate chart data for inline visualisation."""

import math
from typing import Optional

from langchain_core.tools import tool


def _bs_d1(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Black-Scholes d1."""
    if T <= 0 or sigma <= 0:
        return 0.0
    return (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))


def _norm_cdf(x: float) -> float:
    """Approximation of the standard normal CDF."""
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def _norm_pdf(x: float) -> float:
    return math.exp(-0.5 * x**2) / math.sqrt(2 * math.pi)


@tool
def option_payoff_chart(
    strategy: str,
    strike: float,
    premium: float,
    strike2: Optional[float] = None,
    premium2: Optional[float] = None,
) -> dict:
    """Generate an option strategy payoff diagram.

    Args:
        strategy: One of 'long_call', 'short_call', 'long_put', 'short_put',
                  'bull_call_spread', 'bear_put_spread', 'straddle', 'strangle'.
        strike: Primary strike price.
        premium: Premium paid/received for the primary leg.
        strike2: Second strike (required for spreads, straddle uses same strike).
        premium2: Premium for the second leg (required for spreads/strangle).
    """
    lo = strike * 0.7
    hi = strike * 1.3
    if strike2:
        lo = min(strike, strike2) * 0.7
        hi = max(strike, strike2) * 1.3
    step = (hi - lo) / 60
    prices = [round(lo + i * step, 2) for i in range(61)]

    def _payoff(S: float) -> float:
        if strategy == "long_call":
            return max(S - strike, 0) - premium
        elif strategy == "short_call":
            return premium - max(S - strike, 0)
        elif strategy == "long_put":
            return max(strike - S, 0) - premium
        elif strategy == "short_put":
            return premium - max(strike - S, 0)
        elif strategy == "bull_call_spread":
            k2 = strike2 or strike + 10
            p2 = premium2 or premium * 0.4
            return (max(S - strike, 0) - premium) + (p2 - max(S - k2, 0))
        elif strategy == "bear_put_spread":
            k2 = strike2 or strike - 10
            p2 = premium2 or premium * 0.4
            return (max(strike - S, 0) - premium) + (p2 - max(k2 - S, 0))
        elif strategy == "straddle":
            p2 = premium2 or premium
            return max(S - strike, 0) + max(strike - S, 0) - premium - p2
        elif strategy == "strangle":
            k2 = strike2 or strike + 10
            p2 = premium2 or premium
            return max(S - k2, 0) + max(strike - S, 0) - premium - p2
        return 0.0

    labels = {
        "long_call": "Long Call",
        "short_call": "Short Call",
        "long_put": "Long Put",
        "short_put": "Short Put",
        "bull_call_spread": "Bull Call Spread",
        "bear_put_spread": "Bear Put Spread",
        "straddle": "Long Straddle",
        "strangle": "Long Strangle",
    }

    data = [{"price": p, "pnl": round(_payoff(p), 2)} for p in prices]
    return {
        "chart_type": "line",
        "title": f"{labels.get(strategy, strategy)} Payoff (K={strike})",
        "x_label": "Underlying Price",
        "y_label": "Profit / Loss",
        "zero_line": True,
        "series": [{"name": labels.get(strategy, strategy), "key": "pnl"}],
        "data": data,
    }


@tool
def greeks_chart(
    strike: float = 100,
    time_to_expiry: float = 0.25,
    volatility: float = 0.25,
    risk_free_rate: float = 0.05,
    option_type: str = "call",
) -> dict:
    """Generate a chart of option Greeks (Delta, Gamma, Theta, Vega) vs underlying price.

    Args:
        strike: Strike price.
        time_to_expiry: Time to expiry in years (e.g. 0.25 = 3 months).
        volatility: Implied volatility as a decimal (e.g. 0.25 = 25%).
        risk_free_rate: Risk-free rate as a decimal.
        option_type: 'call' or 'put'.
    """
    lo = strike * 0.7
    hi = strike * 1.3
    step = (hi - lo) / 50
    data = []

    for i in range(51):
        S = lo + i * step
        T = max(time_to_expiry, 0.001)
        sigma = volatility
        d1 = _bs_d1(S, strike, T, risk_free_rate, sigma)
        d2 = d1 - sigma * math.sqrt(T)
        sqrt_T = math.sqrt(T)

        if option_type == "call":
            delta = _norm_cdf(d1)
        else:
            delta = _norm_cdf(d1) - 1

        gamma = _norm_pdf(d1) / (S * sigma * sqrt_T) if S > 0 else 0

        theta_common = -(S * _norm_pdf(d1) * sigma) / (2 * sqrt_T)
        if option_type == "call":
            theta = (theta_common - risk_free_rate * strike * math.exp(-risk_free_rate * T) * _norm_cdf(d2)) / 365
        else:
            theta = (theta_common + risk_free_rate * strike * math.exp(-risk_free_rate * T) * _norm_cdf(-d2)) / 365

        vega = S * _norm_pdf(d1) * sqrt_T / 100

        data.append({
            "price": round(S, 2),
            "delta": round(delta, 4),
            "gamma": round(gamma, 4),
            "theta": round(theta, 4),
            "vega": round(vega, 4),
        })

    return {
        "chart_type": "multi_line",
        "title": f"{option_type.title()} Option Greeks (K={strike}, IV={volatility*100:.0f}%)",
        "x_label": "Underlying Price",
        "y_label": "Greek Value",
        "series": [
            {"name": "Delta", "key": "delta", "color": "#4D34EF"},
            {"name": "Gamma", "key": "gamma", "color": "#34D399"},
            {"name": "Theta", "key": "theta", "color": "#FB7185"},
            {"name": "Vega", "key": "vega", "color": "#FBBF24"},
        ],
        "data": data,
    }


@tool
def volatility_smile_chart(
    atm_vol: float = 0.20,
    skew_strength: float = 0.5,
    num_strikes: int = 11,
) -> dict:
    """Generate a volatility smile / skew chart showing IV across strike prices.

    Args:
        atm_vol: At-the-money implied volatility as a decimal (e.g. 0.20 = 20%).
        skew_strength: How pronounced the skew is (0.1 = mild, 1.0 = steep).
        num_strikes: Number of strike points to plot.
    """
    center = 100
    data = []
    half = num_strikes // 2
    for i in range(num_strikes):
        moneyness = (i - half) / half  # -1 to +1
        skew_term = skew_strength * 0.05 * (moneyness**2 + 0.3 * moneyness)
        iv = atm_vol + skew_term
        strike_pct = center + moneyness * 15
        data.append({
            "strike": round(strike_pct, 1),
            "iv": round(iv * 100, 2),
        })

    return {
        "chart_type": "area",
        "title": f"Volatility Smile (ATM IV={atm_vol*100:.0f}%)",
        "x_label": "Strike (% of Spot)",
        "y_label": "Implied Volatility (%)",
        "series": [{"name": "IV", "key": "iv"}],
        "data": data,
    }


@tool
def price_history_chart(
    ticker: str = "SPY",
    start_price: float = 100,
    num_days: int = 60,
    daily_vol: float = 0.015,
    trend: float = 0.0003,
) -> dict:
    """Generate a simulated price history chart for educational purposes.

    Args:
        ticker: Ticker symbol label.
        start_price: Starting price.
        num_days: Number of trading days to simulate.
        daily_vol: Daily volatility (standard deviation of daily returns).
        trend: Daily drift / trend component.
    """
    import random
    random.seed(hash(ticker) % 2**31)

    prices = [start_price]
    for _ in range(num_days - 1):
        ret = trend + daily_vol * random.gauss(0, 1)
        prices.append(prices[-1] * (1 + ret))

    data = [{"day": i + 1, "price": round(p, 2)} for i, p in enumerate(prices)]

    return {
        "chart_type": "area",
        "title": f"{ticker} Simulated Price History ({num_days}d)",
        "x_label": "Trading Day",
        "y_label": "Price ($)",
        "series": [{"name": ticker, "key": "price"}],
        "data": data,
    }


# All tools exported for binding to the model
CHAT_TOOLS = [
    option_payoff_chart,
    greeks_chart,
    volatility_smile_chart,
    price_history_chart,
]
