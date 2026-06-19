export interface BestValueInput {
  perWattRate: number;
  allPerWattRates: number[];
  avgRating: number;
  warrantyYears: number;
  responseTimeHours: number;
  tier: 'basic' | 'silver' | 'gold';
}

export function calculateBestValue(input: BestValueInput): number {
  const { perWattRate, allPerWattRates, avgRating, warrantyYears, responseTimeHours, tier } = input;

  const minPrice = Math.min(...allPerWattRates);
  const maxPrice = Math.max(...allPerWattRates);
  const priceScore =
    maxPrice === minPrice ? 100 : 100 * (1 - (perWattRate - minPrice) / (maxPrice - minPrice));

  const ratingScore = (avgRating / 5) * 100;
  const warrantyScore = Math.min(warrantyYears / 10, 1) * 100;
  const responseScore = Math.max(0, 100 - (responseTimeHours / 48) * 100);
  const tierBonus = { gold: 100, silver: 50, basic: 0 }[tier];

  return (
    priceScore * 0.35 +
    ratingScore * 0.25 +
    warrantyScore * 0.2 +
    responseScore * 0.1 +
    tierBonus * 0.1
  );
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
