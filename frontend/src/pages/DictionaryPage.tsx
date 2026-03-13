import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, BookText } from "lucide-react";

interface Term {
  term: string;
  definition: string;
  category: string;
}

const TERMS: Term[] = [
  // Options Basics
  { term: "Call Option", definition: "A contract giving the holder the right, but not the obligation, to buy an underlying asset at a specified strike price before or at expiration.", category: "Options Basics" },
  { term: "Put Option", definition: "A contract giving the holder the right, but not the obligation, to sell an underlying asset at a specified strike price before or at expiration.", category: "Options Basics" },
  { term: "Strike Price", definition: "The fixed price at which the holder of an option can buy (call) or sell (put) the underlying asset.", category: "Options Basics" },
  { term: "Expiration Date", definition: "The last date on which an option can be exercised. After this date, the option ceases to exist.", category: "Options Basics" },
  { term: "Premium", definition: "The price paid by the buyer to the seller (writer) of an option for the rights conveyed by the contract.", category: "Options Basics" },
  { term: "Exercise", definition: "The act of using the right granted by an option contract to buy or sell the underlying asset at the strike price.", category: "Options Basics" },
  { term: "Assignment", definition: "The obligation placed on the seller (writer) of an option to fulfill the terms of the contract when the buyer exercises.", category: "Options Basics" },
  { term: "In the Money (ITM)", definition: "An option with intrinsic value. A call is ITM when the underlying price is above the strike; a put is ITM when the underlying is below the strike.", category: "Options Basics" },
  { term: "Out of the Money (OTM)", definition: "An option with no intrinsic value. A call is OTM when the underlying price is below the strike; a put is OTM when it is above.", category: "Options Basics" },
  { term: "At the Money (ATM)", definition: "An option whose strike price is equal to or very close to the current price of the underlying asset.", category: "Options Basics" },
  { term: "Intrinsic Value", definition: "The portion of an option's price that is 'in the money' — the difference between the underlying price and the strike price, if favorable.", category: "Options Basics" },
  { term: "Extrinsic Value", definition: "The portion of an option's premium above its intrinsic value, driven by time remaining, volatility, and interest rates. Also called time value.", category: "Options Basics" },
  { term: "American Option", definition: "An option that can be exercised at any time before or on the expiration date.", category: "Options Basics" },
  { term: "European Option", definition: "An option that can only be exercised on its expiration date, not before.", category: "Options Basics" },
  { term: "Open Interest", definition: "The total number of outstanding option contracts that have not been settled, closed, or exercised.", category: "Options Basics" },
  { term: "Options Chain", definition: "A listing of all available option contracts (calls and puts) for a given underlying asset, organized by strike price and expiration date.", category: "Options Basics" },
  { term: "Moneyness", definition: "Describes the relationship between the current price of the underlying asset and the strike price of an option (ITM, ATM, OTM).", category: "Options Basics" },

  // Greeks
  { term: "Delta", definition: "Measures the rate of change of an option's price relative to a $1 change in the underlying asset. Ranges from 0 to 1 for calls and 0 to -1 for puts.", category: "Greeks" },
  { term: "Gamma", definition: "Measures the rate of change of delta per $1 move in the underlying. High gamma means delta changes rapidly, creating convexity in the position.", category: "Greeks" },
  { term: "Theta", definition: "Measures the rate of time decay — how much an option's value decreases as one day passes, all else equal. Typically negative for long options.", category: "Greeks" },
  { term: "Vega", definition: "Measures the sensitivity of an option's price to a 1% change in implied volatility. Higher vega means greater sensitivity to vol changes.", category: "Greeks" },
  { term: "Rho", definition: "Measures the sensitivity of an option's price to a 1% change in interest rates. Generally more significant for longer-dated options.", category: "Greeks" },
  { term: "Charm", definition: "A second-order Greek measuring the rate of change of delta with respect to time (delta decay). Also called delta bleed.", category: "Greeks" },
  { term: "Vanna", definition: "A second-order Greek measuring the sensitivity of delta to changes in implied volatility, or equivalently, vega's sensitivity to underlying price changes.", category: "Greeks" },
  { term: "Volga (Vomma)", definition: "A second-order Greek measuring the sensitivity of vega to changes in implied volatility. Important for understanding how vol-of-vol affects pricing.", category: "Greeks" },
  { term: "Speed", definition: "A third-order Greek measuring the rate of change of gamma with respect to changes in the underlying price.", category: "Greeks" },

  // Volatility
  { term: "Implied Volatility (IV)", definition: "The market's forecast of the likely magnitude of price movement, derived from option prices using a pricing model. Higher IV means more expensive options.", category: "Volatility" },
  { term: "Historical Volatility (HV)", definition: "The actual observed volatility of the underlying asset over a past period, calculated from historical price data. Also called realized volatility.", category: "Volatility" },
  { term: "Realized Volatility (RV)", definition: "The actual volatility that occurs over a given period, as opposed to implied (expected) volatility. Compared with IV to assess if options were fairly priced.", category: "Volatility" },
  { term: "Volatility Smile", definition: "A pattern where implied volatility is higher for deep ITM and OTM options than ATM options, creating a U-shaped curve when plotted against strike price.", category: "Volatility" },
  { term: "Volatility Skew", definition: "The difference in implied volatility across strike prices. Equity markets typically show higher IV for lower strikes (put skew) due to crash risk demand.", category: "Volatility" },
  { term: "Volatility Surface", definition: "A three-dimensional plot of implied volatility across both strike prices and expiration dates, representing the full term structure of volatility.", category: "Volatility" },
  { term: "Volatility Term Structure", definition: "The pattern of implied volatility across different expiration dates for a given strike. Can be in contango (upward sloping) or backwardation (downward).", category: "Volatility" },
  { term: "VIX", definition: "The CBOE Volatility Index, measuring the market's expectation of 30-day forward-looking volatility derived from S&P 500 index options. Often called the 'fear gauge.'", category: "Volatility" },
  { term: "Volatility Crush", definition: "A sharp decline in implied volatility, often occurring after anticipated events like earnings reports. Hurts long option positions even if the underlying moves.", category: "Volatility" },
  { term: "Variance Swap", definition: "A derivative contract where the payoff is based on the difference between realized variance and a fixed strike variance, providing pure exposure to volatility.", category: "Volatility" },
  { term: "Volatility Risk Premium", definition: "The tendency for implied volatility to exceed realized volatility on average, representing the premium sellers earn for bearing volatility risk.", category: "Volatility" },
  { term: "IV Rank", definition: "A percentile measure of where current implied volatility falls relative to its range over a lookback period (e.g. 52 weeks). 100% = highest IV in the period.", category: "Volatility" },
  { term: "IV Percentile", definition: "The percentage of days in a lookback period where IV was lower than the current level. Differs from IV Rank by measuring frequency, not range.", category: "Volatility" },
  { term: "Contango", definition: "A term structure where longer-dated futures or IV is higher than near-term. In volatility, indicates the market expects vol to rise or revert to higher levels.", category: "Volatility" },
  { term: "Backwardation", definition: "A term structure where near-term futures or IV is higher than longer-dated. In volatility, often signals acute near-term fear or an upcoming event.", category: "Volatility" },

  // Strategies
  { term: "Covered Call", definition: "A strategy where an investor owns the underlying asset and sells a call option against it to collect premium, capping upside in exchange for income.", category: "Strategies" },
  { term: "Protective Put", definition: "Buying a put option on an asset you already own to limit downside risk. Acts as insurance — you pay premium for protection.", category: "Strategies" },
  { term: "Bull Call Spread", definition: "Buying a call at a lower strike and selling a call at a higher strike with the same expiration. Limits both cost and profit potential. Bullish strategy.", category: "Strategies" },
  { term: "Bear Put Spread", definition: "Buying a put at a higher strike and selling a put at a lower strike with the same expiration. Profits from a decline in the underlying. Bearish strategy.", category: "Strategies" },
  { term: "Straddle", definition: "Buying both a call and a put at the same strike and expiration. Profits from large moves in either direction. A bet on increased volatility.", category: "Strategies" },
  { term: "Strangle", definition: "Buying an OTM call and an OTM put with the same expiration but different strikes. Cheaper than a straddle, but requires a larger move to profit.", category: "Strategies" },
  { term: "Iron Condor", definition: "A four-leg strategy combining a bull put spread and a bear call spread. Profits from low volatility — the underlying staying within a range.", category: "Strategies" },
  { term: "Iron Butterfly", definition: "A four-leg strategy selling an ATM straddle and buying OTM wings. Similar to iron condor but with a narrower profit zone and higher max profit.", category: "Strategies" },
  { term: "Calendar Spread", definition: "Selling a near-term option and buying a longer-term option at the same strike. Profits from time decay differential and rising implied volatility.", category: "Strategies" },
  { term: "Diagonal Spread", definition: "A spread using options with different strikes and different expirations. Combines elements of vertical and calendar spreads.", category: "Strategies" },
  { term: "Collar", definition: "Owning the underlying, buying a protective put, and selling a covered call. Limits both upside and downside, often for near-zero net cost.", category: "Strategies" },
  { term: "Ratio Spread", definition: "Buying and selling unequal numbers of options at different strikes. For example, buying 1 call and selling 2 calls at a higher strike.", category: "Strategies" },
  { term: "Butterfly Spread", definition: "A three-strike strategy that profits when the underlying stays near the middle strike. Constructed with calls or puts, or a combination of both.", category: "Strategies" },
  { term: "Synthetic Long", definition: "A position that mimics owning the underlying by buying a call and selling a put at the same strike and expiration.", category: "Strategies" },
  { term: "Jade Lizard", definition: "A short put combined with a short call spread (bear call spread). Eliminates upside risk while collecting premium, with risk only to the downside.", category: "Strategies" },
  { term: "Risk Reversal", definition: "Simultaneously buying an OTM call and selling an OTM put (or vice versa). Expresses a directional view and is also used to gauge market sentiment.", category: "Strategies" },

  // Risk Management
  { term: "Value at Risk (VaR)", definition: "A statistical measure estimating the maximum potential loss of a portfolio over a given time period at a given confidence level (e.g. 95% VaR).", category: "Risk Management" },
  { term: "Conditional VaR (CVaR)", definition: "Also called Expected Shortfall. Measures the expected loss given that the loss exceeds the VaR threshold — captures tail risk better than VaR.", category: "Risk Management" },
  { term: "Position Sizing", definition: "Determining how much capital to allocate to a single trade or position, based on risk tolerance, portfolio size, and expected volatility.", category: "Risk Management" },
  { term: "Max Drawdown", definition: "The largest peak-to-trough decline in portfolio value over a period. A key measure of downside risk and strategy resilience.", category: "Risk Management" },
  { term: "Sharpe Ratio", definition: "A measure of risk-adjusted return calculated as (portfolio return − risk-free rate) / portfolio standard deviation. Higher is better.", category: "Risk Management" },
  { term: "Sortino Ratio", definition: "Similar to Sharpe ratio but uses only downside deviation instead of total standard deviation, penalizing only harmful volatility.", category: "Risk Management" },
  { term: "Kelly Criterion", definition: "A formula for optimal bet sizing that maximizes long-term growth rate of capital: f* = (bp − q) / b, where b=odds, p=win probability, q=loss probability.", category: "Risk Management" },
  { term: "Beta", definition: "A measure of an asset's sensitivity to overall market movements. Beta of 1 means the asset moves with the market; >1 means more volatile.", category: "Risk Management" },
  { term: "Correlation", definition: "A statistical measure (-1 to +1) of how two assets move relative to each other. Important for diversification and hedging decisions.", category: "Risk Management" },
  { term: "Hedge Ratio", definition: "The proportion of a position that is hedged, often derived from delta. A delta-neutral portfolio has a hedge ratio that offsets directional exposure.", category: "Risk Management" },
  { term: "Tail Risk", definition: "The risk of extreme, rare events that fall in the tails of a probability distribution. Often underestimated by normal distribution models.", category: "Risk Management" },
  { term: "Margin", definition: "Collateral required by a broker or exchange to cover potential losses on a position. Can be initial margin (to open) or maintenance margin (to keep open).", category: "Risk Management" },

  // Pricing & Models
  { term: "Black-Scholes Model", definition: "A foundational options pricing model that calculates theoretical option prices using underlying price, strike, time, volatility, interest rates, and dividends.", category: "Pricing & Models" },
  { term: "Binomial Model", definition: "An options pricing model that uses a tree of possible price paths (up/down moves at each step) to calculate option value. Handles American-style options well.", category: "Pricing & Models" },
  { term: "Put-Call Parity", definition: "A fundamental relationship: Call − Put = Underlying − Strike × e^(-rT). Links the prices of European calls and puts with the same strike and expiration.", category: "Pricing & Models" },
  { term: "Risk-Neutral Pricing", definition: "A framework where option prices are calculated assuming investors are indifferent to risk, allowing expected payoffs to be discounted at the risk-free rate.", category: "Pricing & Models" },
  { term: "Monte Carlo Simulation", definition: "A computational method that uses random sampling of price paths to estimate option prices or portfolio risk, especially useful for complex or path-dependent options.", category: "Pricing & Models" },
  { term: "SABR Model", definition: "Stochastic Alpha Beta Rho — a volatility model used to capture the dynamics of the volatility smile/skew, widely used for interest rate derivatives.", category: "Pricing & Models" },

  // Market Structure
  { term: "Bid-Ask Spread", definition: "The difference between the highest price a buyer will pay (bid) and the lowest price a seller will accept (ask). A measure of liquidity and transaction costs.", category: "Market Structure" },
  { term: "Market Maker", definition: "A firm or individual that provides liquidity by continuously quoting both bid and ask prices, profiting from the spread while managing inventory risk.", category: "Market Structure" },
  { term: "Liquidity", definition: "The ease with which an asset can be bought or sold without significantly affecting its price. Higher liquidity means tighter spreads and easier execution.", category: "Market Structure" },
  { term: "Slippage", definition: "The difference between the expected price of a trade and the actual execution price, typically caused by market movement or insufficient liquidity.", category: "Market Structure" },
  { term: "Dark Pool", definition: "A private exchange or forum for trading securities away from public exchanges, allowing large orders to be executed without impacting the visible market.", category: "Market Structure" },
  { term: "NBBO", definition: "National Best Bid and Offer — the SEC-regulated best available bid and ask prices across all exchanges for a given security.", category: "Market Structure" },
  { term: "Order Flow", definition: "The stream of buy and sell orders arriving at the market. Analyzing order flow reveals supply/demand imbalances and potential price direction.", category: "Market Structure" },
  { term: "PFOF", definition: "Payment for Order Flow — the practice where brokers receive compensation from market makers for routing customer orders to them for execution.", category: "Market Structure" },

  // Fixed Income & Rates
  { term: "Yield Curve", definition: "A graph plotting interest rates of bonds with equal credit quality but different maturities. Its shape (normal, flat, inverted) signals economic expectations.", category: "Fixed Income" },
  { term: "Duration", definition: "A measure of a bond's price sensitivity to interest rate changes. Higher duration means greater sensitivity. Measured in years.", category: "Fixed Income" },
  { term: "Convexity", definition: "A measure of the curvature in the relationship between bond prices and yields. Positive convexity means prices rise more for rate drops than they fall for rate hikes.", category: "Fixed Income" },
  { term: "Credit Spread", definition: "The yield difference between a corporate bond and a comparable-maturity government bond. Wider spreads indicate higher perceived credit risk.", category: "Fixed Income" },
  { term: "Fed Funds Rate", definition: "The interest rate at which banks lend reserves to each other overnight. Set by the Federal Reserve, it is the primary tool for monetary policy.", category: "Fixed Income" },
  { term: "Basis Point", definition: "One hundredth of one percent (0.01%). Used to express small changes in interest rates, yields, or other financial percentages.", category: "Fixed Income" },

  // General Finance
  { term: "Alpha", definition: "The excess return of an investment relative to its benchmark. Positive alpha indicates outperformance; negative alpha indicates underperformance.", category: "General Finance" },
  { term: "Leverage", definition: "Using borrowed capital or derivatives to amplify potential returns (and losses). Options provide inherent leverage due to their lower capital requirement.", category: "General Finance" },
  { term: "Short Selling", definition: "Selling a borrowed asset with the intention of buying it back at a lower price. Profits from price declines but has theoretically unlimited risk.", category: "General Finance" },
  { term: "Mark to Market", definition: "The practice of valuing positions at their current market price rather than purchase price. Required daily for margin accounts and futures.", category: "General Finance" },
  { term: "Settlement", definition: "The process of transferring securities and cash between parties after a trade. Options settle T+1; equities settle T+2 in the US.", category: "General Finance" },
  { term: "Notional Value", definition: "The total value of the underlying asset controlled by a derivative contract. For options, it equals the number of contracts × 100 × underlying price.", category: "General Finance" },
  { term: "Basis Risk", definition: "The risk that the hedge instrument does not move perfectly in line with the asset being hedged, leaving residual exposure.", category: "General Finance" },
  { term: "Mean Reversion", definition: "The theory that prices or volatility tend to revert to their historical average over time. A key assumption in many volatility trading strategies.", category: "General Finance" },
  { term: "Carry Trade", definition: "A strategy of borrowing in a low-yielding asset and investing in a higher-yielding one, profiting from the interest rate differential (the 'carry').", category: "General Finance" },
  { term: "Dividend Yield", definition: "The annual dividend payment divided by the stock price, expressed as a percentage. Important for option pricing as dividends affect put-call parity.", category: "General Finance" },
  { term: "P/E Ratio", definition: "Price-to-Earnings ratio. A valuation metric dividing a company's share price by its earnings per share. Higher P/E may indicate growth expectations or overvaluation.", category: "General Finance" },
  { term: "Market Capitalization", definition: "The total market value of a company's outstanding shares, calculated as share price × total shares outstanding. Used to classify companies by size.", category: "General Finance" },
  { term: "EPS", definition: "Earnings Per Share — a company's net income divided by the number of outstanding shares. A fundamental measure of profitability.", category: "General Finance" },
  { term: "Free Cash Flow", definition: "Cash generated by a company's operations after subtracting capital expenditures. Indicates financial health and the ability to return capital to shareholders.", category: "General Finance" },

  // Exotic & Advanced
  { term: "Barrier Option", definition: "An option that activates (knock-in) or deactivates (knock-out) when the underlying crosses a specified barrier price. Cheaper than vanilla options.", category: "Exotic & Advanced" },
  { term: "Binary Option", definition: "An option with a fixed payout if the underlying is above/below a strike at expiration, and zero otherwise. Also called digital options.", category: "Exotic & Advanced" },
  { term: "Asian Option", definition: "An option whose payoff depends on the average price of the underlying over a period, rather than the price at a single point.", category: "Exotic & Advanced" },
  { term: "Lookback Option", definition: "An option whose payoff is based on the maximum or minimum price of the underlying during the option's life, eliminating timing risk.", category: "Exotic & Advanced" },
  { term: "LEAPS", definition: "Long-Term Equity Anticipation Securities — options with expiration dates more than one year out. Used for long-term directional or hedging strategies.", category: "Exotic & Advanced" },
  { term: "Quanto Option", definition: "An option on a foreign asset where the payoff is converted to the investor's domestic currency at a fixed exchange rate, eliminating currency risk.", category: "Exotic & Advanced" },
  { term: "Cliquet Option", definition: "A series of consecutive forward-start options that lock in gains periodically. Common in structured products and equity-linked notes.", category: "Exotic & Advanced" },

  // Order Types & Execution
  { term: "Limit Order", definition: "An order to buy or sell at a specified price or better. Provides price control but may not execute if the market doesn't reach the limit price.", category: "Order Types" },
  { term: "Market Order", definition: "An order to buy or sell immediately at the best available price. Guarantees execution but not the price, especially in illiquid markets.", category: "Order Types" },
  { term: "Stop Loss", definition: "An order that triggers a market sell when the price falls to a specified level, limiting downside losses. Can also be a stop-limit order.", category: "Order Types" },
  { term: "GTC Order", definition: "Good Till Cancelled — an order that remains active until executed or explicitly cancelled by the trader, unlike day orders that expire at market close.", category: "Order Types" },
  { term: "Fill or Kill", definition: "An order that must be executed immediately in its entirety or cancelled completely. No partial fills allowed. Used for large institutional orders.", category: "Order Types" },
  { term: "TWAP", definition: "Time-Weighted Average Price — an execution algorithm that spreads an order evenly over a specified time period to minimize market impact.", category: "Order Types" },
  { term: "VWAP", definition: "Volume-Weighted Average Price — the average price weighted by volume throughout the day. Used as a benchmark for execution quality.", category: "Order Types" },

  // Sentiment & Indicators
  { term: "Put/Call Ratio", definition: "The ratio of put option volume to call option volume. High ratios suggest bearish sentiment; low ratios suggest bullish sentiment. Used as a contrarian indicator.", category: "Sentiment" },
  { term: "Skew Index", definition: "A CBOE measure of the perceived tail risk in S&P 500 returns, derived from the steepness of the implied volatility skew.", category: "Sentiment" },
  { term: "Fear & Greed Index", definition: "A composite sentiment indicator combining multiple market signals (VIX, momentum, breadth, etc.) to gauge whether investors are fearful or greedy.", category: "Sentiment" },
  { term: "Max Pain", definition: "The strike price at which the greatest number of options (both calls and puts) would expire worthless, theoretically causing maximum loss for option buyers.", category: "Sentiment" },
  { term: "GEX (Gamma Exposure)", definition: "The aggregate gamma exposure of market makers across all strikes. High positive GEX tends to suppress volatility; negative GEX can amplify moves.", category: "Sentiment" },
  { term: "DIX (Dark Index)", definition: "A measure of dark pool buying pressure. High DIX readings suggest institutional accumulation; low readings suggest distribution.", category: "Sentiment" },
];

const CATEGORIES = [...new Set(TERMS.map((t) => t.category))];

export default function DictionaryPage() {
  const [search, setSearch] = useState("");
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TERMS.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (!q) return true;
      return t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
    });
  }, [search, selectedCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, Term[]>();
    for (const t of filtered) {
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="cm-page max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <BookText size={22} className="text-cm-primary" />
        <h2 className="cm-title">Dictionary</h2>
        <span className="text-cm-muted text-sm ml-auto">{TERMS.length} terms</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cm-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms..."
          className="cm-input pl-9"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null ? "cm-tab-active text-xs !px-3 !py-1" : "cm-tab text-xs !px-3 !py-1"}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={selectedCategory === cat ? "cm-tab-active text-xs !px-3 !py-1" : "cm-tab text-xs !px-3 !py-1"}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 && (
        <div className="cm-surface p-8 text-center">
          <Search size={32} className="text-cm-muted mx-auto mb-3" />
          <div className="text-cm-muted text-sm">No terms match your search.</div>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([category, terms]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-cm-muted uppercase tracking-wider mb-2 px-1">
              {category}
            </h3>
            <div className="space-y-1">
              {terms.map((t) => {
                const isOpen = openTerm === t.term;
                return (
                  <button
                    key={t.term}
                    onClick={() => setOpenTerm(isOpen ? null : t.term)}
                    className="w-full text-left cm-surface-interactive p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-cm-text">{t.term}</span>
                      {isOpen ? (
                        <ChevronUp size={14} className="text-cm-muted shrink-0" />
                      ) : (
                        <ChevronDown size={14} className="text-cm-muted shrink-0" />
                      )}
                    </div>
                    {isOpen && (
                      <p className="text-sm text-cm-muted leading-relaxed mt-2 pr-6">
                        {t.definition}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
