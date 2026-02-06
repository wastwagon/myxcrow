import { Injectable } from '@nestjs/common';
import { IRateLimitStore, RateLimitResult } from './rate-limit-store.interface';

interface Entry {
  count: number;
  resetTime: number;
}

@Injectable()
export class InMemoryRateLimitStore implements IRateLimitStore {
  private store: Record<string, Entry> = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async increment(clientId: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    if (!this.store[clientId] || now > this.store[clientId].resetTime) {
      this.store[clientId] = { count: 0, resetTime: now + windowMs };
    }
    const entry = this.store[clientId];
    entry.count++;
    return { count: entry.count, resetTime: entry.resetTime };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key of Object.keys(this.store)) {
      if (this.store[key].resetTime <= now) delete this.store[key];
    }
  }
}
