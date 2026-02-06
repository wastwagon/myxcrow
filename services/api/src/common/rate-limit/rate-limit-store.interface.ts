export interface RateLimitResult {
  count: number;
  resetTime: number;
}

export interface IRateLimitStore {
  increment(clientId: string, windowMs: number): Promise<RateLimitResult>;
}
