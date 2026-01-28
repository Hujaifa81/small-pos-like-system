/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client: any = null;
  public readonly redlock: any = null;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      const client = new Redis(url);
      this.client = client;
      this.redlock = new Redlock([client], {
        retryCount: 3,
        retryDelay: 200,
      });
      this.logger.log('Connected to Redis and initialized Redlock');
    } catch (err) {
      this.logger.warn(
        'Redis not available; continuing without distributed locks',
      );
      this.client = null;
      this.redlock = null;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.client) await this.client.quit();
    } catch (err) {
      this.logger.error(
        'Error while disconnecting Redis client: ' + String(err),
      );
    }
  }

  // Basic helpers used by services for caching
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.warn('Redis GET failed: ' + String(err));
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    if (!this.client) return;
    try {
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) await this.client.set(key, str, 'EX', ttlSeconds);
      else await this.client.set(key, str);
    } catch (err) {
      this.logger.warn('Redis SET failed: ' + String(err));
    }
  }

  async del(key: string) {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn('Redis DEL failed: ' + String(err));
    }
  }
}
