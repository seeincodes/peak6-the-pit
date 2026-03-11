import { seededRandom } from "../../theme/chartTheme";

export interface PricePoint {
  time: string;
  price: number;
  volume?: number;
}

export interface CandlePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface HeatmapCell {
  strike: string;
  expiry: string;
  iv: number;
}

function formatDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function generateLineData(seed: string, points = 20): PricePoint[] {
  const rand = seededRandom(seed);
  const data: PricePoint[] = [];
  let price = 80 + rand() * 40; // start between 80-120

  for (let i = 0; i < points; i++) {
    price += (rand() - 0.48) * 3; // slight upward drift
    price = Math.max(60, Math.min(160, price));
    data.push({
      time: formatDate(points - 1 - i),
      price: Math.round(price * 100) / 100,
    });
  }
  return data;
}

export function generateAreaData(seed: string, points = 20): PricePoint[] {
  return generateLineData(seed + "_area", points);
}

export function generateCandleData(seed: string, points = 15): CandlePoint[] {
  const rand = seededRandom(seed);
  const data: CandlePoint[] = [];
  let prevClose = 80 + rand() * 40;

  for (let i = 0; i < points; i++) {
    const open = prevClose + (rand() - 0.5) * 2;
    const close = open + (rand() - 0.48) * 4;
    const high = Math.max(open, close) + rand() * 3;
    const low = Math.min(open, close) - rand() * 3;

    data.push({
      time: formatDate(points - 1 - i),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
    prevClose = close;
  }
  return data;
}

export function generateHeatmapData(seed: string): HeatmapCell[] {
  const rand = seededRandom(seed);
  const strikes = ["90", "95", "100", "105", "110"];
  const expiries = ["1W", "1M", "3M", "6M"];
  const data: HeatmapCell[] = [];

  for (const expiry of expiries) {
    const expiryIdx = expiries.indexOf(expiry);
    for (const strike of strikes) {
      const strikeIdx = strikes.indexOf(strike);
      // Realistic IV skew: higher IV at lower strikes, higher at near-term
      const baseIV = 20 + rand() * 10;
      const skew = (2 - strikeIdx) * 3; // higher for lower strikes
      const term = (3 - expiryIdx) * 2; // higher for near-term
      const iv = Math.max(8, baseIV + skew + term + (rand() - 0.5) * 4);
      data.push({
        strike,
        expiry,
        iv: Math.round(iv * 10) / 10,
      });
    }
  }
  return data;
}
