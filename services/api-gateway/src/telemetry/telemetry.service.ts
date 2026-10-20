import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface DriverTelemetry {
  orderId: string;
  deliveryId?: string;
  partnerUserId?: string;
  prev: LocationPoint;
  curr: LocationPoint;
  bearing: number;
  speed: number;
  updatedAt: string;
}

export interface DriverPresence {
  partnerUserId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  isAvailable: boolean;
  updatedAt: string;
  timestamp: number;
}

export interface NearestDriverResult {
  partnerUserId: string;
  distanceKm: number;
  distanceMeters: number;
  estimatedPickupMinutes: number;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

/**
 * Calculate precise spherical distance using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): { distanceKm: number; distanceMeters: number } {
  const R = 6371; // Earth's mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = parseFloat((R * c).toFixed(3));
  const distanceMeters = Math.round(distanceKm * 1000);
  return { distanceKm, distanceMeters };
}

export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = toDeg(Math.atan2(y, x));
  return (theta + 360) % 360;
}

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);
  private redis: Redis | null = null;
  private readonly memoryCache = new Map<string, DriverTelemetry>();
  private readonly driverPresenceCache = new Map<string, DriverPresence>();
  private readonly TTL_SECONDS = 600; // 10 minutes cache lifetime

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 2,
          lazyConnect: true,
          enableReadyCheck: false,
          connectTimeout: 5000,
        });

        this.redis.on('error', (err) => {
          this.logger.warn(`Redis connection warning: ${err.message}. Using high-speed memory fallback.`);
        });

        await this.redis.connect();
        this.logger.log('⚡ TelemetryService: Connected to Redis Cache for Driver GPS');
      } catch (err: any) {
        this.logger.warn(`Could not connect to Redis: ${err.message}. Operating with in-memory telemetry.`);
        this.redis = null;
      }
    } else {
      this.logger.log('⚡ TelemetryService: Running in high-speed in-memory mode');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {}
    }
  }

  /**
   * Record new driver location, shift previous point, and compute bearing
   */
  async recordLocation(payload: {
    orderId: string;
    deliveryId?: string;
    partnerUserId?: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp?: number;
  }): Promise<DriverTelemetry> {
    const orderId = payload.orderId;
    const now = payload.timestamp || Date.now();
    const newPoint: LocationPoint = {
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: now,
    };

    // 1. Retrieve existing telemetry to get previous point
    const existing = await this.getTelemetry(orderId);

    let prevPoint: LocationPoint;
    let bearing: number;

    if (existing && existing.curr) {
      prevPoint = existing.curr;
      // Calculate bearing from previous point to new point if heading is not provided
      bearing =
        payload.heading !== undefined && payload.heading !== null
          ? payload.heading
          : calculateBearing(
              prevPoint.latitude,
              prevPoint.longitude,
              newPoint.latitude,
              newPoint.longitude,
            );
    } else {
      prevPoint = newPoint;
      bearing = payload.heading || 0;
    }

    const telemetry: DriverTelemetry = {
      orderId,
      deliveryId: payload.deliveryId || existing?.deliveryId,
      partnerUserId: payload.partnerUserId || existing?.partnerUserId,
      prev: prevPoint,
      curr: newPoint,
      bearing: Math.round(bearing),
      speed: payload.speed || 0,
      updatedAt: new Date().toISOString(),
    };

    // 2. Persist to Redis with 10-minute TTL and update memory cache
    const key = `telemetry:order:${orderId}`;
    this.memoryCache.set(orderId, telemetry);
    if (payload.deliveryId) {
      this.memoryCache.set(`delivery:${payload.deliveryId}`, telemetry);
    }

    // Console log coordinates before persisting to Redis
    console.log(`\n======================================================`);
    console.log(`📍 [REDIS PRE-WRITE] Driver GPS Telemetry Coordinates:`);
    console.log(`   • Order ID:       ${orderId}`);
    console.log(`   • Delivery ID:    ${payload.deliveryId || telemetry.deliveryId || 'N/A'}`);
    console.log(`   • Current Lat:    ${newPoint.latitude}`);
    console.log(`   • Current Lng:    ${newPoint.longitude}`);
    console.log(`   • Previous Lat:   ${prevPoint.latitude}`);
    console.log(`   • Previous Lng:   ${prevPoint.longitude}`);
    console.log(`   • Bearing:        ${telemetry.bearing}°`);
    console.log(`   • Speed:          ${telemetry.speed} km/h`);
    console.log(`   • Timestamp:      ${new Date(now).toISOString()}`);
    console.log(`   • Target Redis:   ${key} (TTL: ${this.TTL_SECONDS}s)`);
    console.log(`======================================================\n`);

    if (this.redis) {
      try {
        const serialized = JSON.stringify(telemetry);
        await this.redis.set(key, serialized, 'EX', this.TTL_SECONDS);
        if (payload.deliveryId) {
          await this.redis.set(`telemetry:delivery:${payload.deliveryId}`, serialized, 'EX', this.TTL_SECONDS);
        }
      } catch (err: any) {
        this.logger.warn(`Redis write failed: ${err.message}. Retained in memory cache.`);
      }
    }

    return telemetry;
  }

  /**
   * Get latest 2 points and bearing for an order
   */
  async getTelemetry(orderIdOrDeliveryId: string): Promise<DriverTelemetry | null> {
    // 1. Check in-memory cache first
    const mem = this.memoryCache.get(orderIdOrDeliveryId);
    if (mem) return mem;

    // 2. Check Redis
    if (this.redis) {
      try {
        const raw = await this.redis.get(`telemetry:order:${orderIdOrDeliveryId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.memoryCache.set(orderIdOrDeliveryId, parsed);
          return parsed;
        }

        const rawDelivery = await this.redis.get(`telemetry:delivery:${orderIdOrDeliveryId}`);
        if (rawDelivery) {
          const parsed = JSON.parse(rawDelivery);
          this.memoryCache.set(orderIdOrDeliveryId, parsed);
          return parsed;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Purge delivered order telemetry from Redis and sever tracking session
   */
  async cleanupOrderTelemetry(orderId: string, deliveryId?: string): Promise<void> {
    this.memoryCache.delete(orderId);
    if (deliveryId) this.memoryCache.delete(deliveryId);

    if (this.redis) {
      try {
        const keysToDelete = [`telemetry:order:${orderId}`];
        if (deliveryId) {
          keysToDelete.push(`telemetry:delivery:${deliveryId}`);
        }
        await this.redis.del(...keysToDelete);

        console.log(`\n======================================================`);
        console.log(`🧹 [REDIS PURGE] Order DELIVERED - Telemetry Cleared:`);
        console.log(`   • Order ID:     ${orderId}`);
        console.log(`   • Redis Keys:   ${keysToDelete.join(', ')} deleted`);
        console.log(`   • Connection:   Redis tracking session severed for user`);
        console.log(`======================================================\n`);
      } catch (err: any) {
        this.logger.warn(`Failed to delete delivered telemetry from Redis: ${err.message}`);
      }
    }
  }

  /**
   * Record online driver's GPS location into Redis Geospatial index and presence cache
   */
  async recordDriverLocation(payload: {
    partnerUserId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    isAvailable?: boolean;
  }): Promise<DriverPresence> {
    const isAvailable = payload.isAvailable ?? true;
    const now = Date.now();
    const presence: DriverPresence = {
      partnerUserId: payload.partnerUserId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      speed: payload.speed || 0,
      heading: payload.heading,
      isAvailable,
      updatedAt: new Date(now).toISOString(),
      timestamp: now,
    };

    // 1. In-memory presence cache
    this.driverPresenceCache.set(payload.partnerUserId, presence);

    // 2. Persist to Redis (GEO index + presence info key)
    if (this.redis) {
      try {
        const geoKey = 'drivers:available:geo';
        const infoKey = `driver:presence:${payload.partnerUserId}`;

        if (isAvailable) {
          // Add to Redis Geospatial index: GEOADD key longitude latitude member
          await this.redis.geoadd(
            geoKey,
            payload.longitude,
            payload.latitude,
            payload.partnerUserId,
          );
          await this.redis.expire(geoKey, 3600);
        } else {
          // Remove from available set if busy on delivery
          await this.redis.zrem(geoKey, payload.partnerUserId);
        }

        // Store full metadata with 120s heartbeat TTL
        await this.redis.set(infoKey, JSON.stringify(presence), 'EX', 120);
      } catch (err: any) {
        this.logger.warn(`Redis GEO write warning: ${err.message}`);
      }
    }

    return presence;
  }

  /**
   * Remove a driver from available geo pool (offline / duty toggle)
   */
  async removeDriverFromPool(partnerUserId: string): Promise<void> {
    this.driverPresenceCache.delete(partnerUserId);
    if (this.redis) {
      try {
        await this.redis.zrem('drivers:available:geo', partnerUserId);
        await this.redis.del(`driver:presence:${partnerUserId}`);
      } catch {}
    }
  }

  /**
   * Find the single nearest available delivery partner to a pickup coordinate
   */
  async findNearestDriver(
    pickupLat: number,
    pickupLng: number,
    maxRadiusKm = 15,
  ): Promise<NearestDriverResult | null> {
    const nearby = await this.findAllNearbyDrivers(pickupLat, pickupLng, maxRadiusKm);
    if (!nearby || nearby.length === 0) {
      this.logger.warn(`No online drivers found within ${maxRadiusKm} km of (${pickupLat}, ${pickupLng})`);
      return null;
    }

    const nearest = nearby[0]; // Already sorted by distance ascending

    console.log(`\n======================================================`);
    console.log(`🎯 [REDIS GEO] Nearest Delivery Partner Found:`);
    console.log(`   • Pickup Location:    (${pickupLat}, ${pickupLng})`);
    console.log(`   • Nearest Partner ID: ${nearest.partnerUserId}`);
    console.log(`   • Partner Location:   (${nearest.latitude}, ${nearest.longitude})`);
    console.log(`   • Exact Distance:     ${nearest.distanceKm} km (~${nearest.distanceMeters} meters)`);
    console.log(`   • Est. Pickup Arrival:~${nearest.estimatedPickupMinutes} mins`);
    console.log(`   • Total Candidates:   ${nearby.length} online driver(s) in radius`);
    console.log(`======================================================\n`);

    return nearest;
  }

  /**
   * Find and rank all available delivery partners from Redis by distance
   */
  async findAllNearbyDrivers(
    pickupLat: number,
    pickupLng: number,
    maxRadiusKm = 15,
  ): Promise<NearestDriverResult[]> {
    const results: NearestDriverResult[] = [];
    const geoKey = 'drivers:available:geo';

    // 1. Try Redis GEORADIUS / GEOSEARCH first
    if (this.redis) {
      try {
        let rawCandidates: any[] = [];
        try {
          rawCandidates = (await (this.redis as any).geosearch(
            geoKey,
            'FROMLONLAT',
            pickupLng,
            pickupLat,
            'BYRADIUS',
            maxRadiusKm,
            'km',
            'WITHDIST',
            'WITHCOORD',
            'ASC',
          )) || [];
        } catch {
          rawCandidates = (await (this.redis as any).georadius(
            geoKey,
            pickupLng,
            pickupLat,
            maxRadiusKm,
            'km',
            'WITHDIST',
            'WITHCOORD',
            'ASC',
          )) || [];
        }

        if (Array.isArray(rawCandidates) && rawCandidates.length > 0) {
          for (const item of rawCandidates) {
            const partnerUserId = typeof item === 'string' ? item : item[0];
            const distKm = parseFloat(item[1]) || 0;
            const coords = item[2];
            const lon = coords ? parseFloat(coords[0]) : pickupLng;
            const lat = coords ? parseFloat(coords[1]) : pickupLat;
            const estimatedPickupMinutes = Math.max(1, Math.round((distKm / 25) * 60));

            results.push({
              partnerUserId,
              distanceKm: parseFloat(distKm.toFixed(2)),
              distanceMeters: Math.round(distKm * 1000),
              estimatedPickupMinutes,
              latitude: lat,
              longitude: lon,
            });
          }
          return results;
        }
      } catch (err: any) {
        this.logger.warn(`Redis GEO search failed: ${err.message}. Using Haversine fallback.`);
      }
    }

    // 2. Haversine calculation fallback across active drivers in memory & Redis
    const candidates: DriverPresence[] = Array.from(this.driverPresenceCache.values()).filter(
      (d) => d.isAvailable && Date.now() - d.timestamp < 120000,
    );

    if (candidates.length === 0 && this.redis) {
      try {
        const keys = await this.redis.keys('driver:presence:*');
        for (const k of keys) {
          const val = await this.redis.get(k);
          if (val) {
            const parsed: DriverPresence = JSON.parse(val);
            if (parsed.isAvailable) candidates.push(parsed);
          }
        }
      } catch {}
    }

    for (const driver of candidates) {
      const { distanceKm, distanceMeters } = calculateHaversineDistance(
        pickupLat,
        pickupLng,
        driver.latitude,
        driver.longitude,
      );

      if (distanceKm <= maxRadiusKm) {
        const estimatedPickupMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
        results.push({
          partnerUserId: driver.partnerUserId,
          distanceKm,
          distanceMeters,
          estimatedPickupMinutes,
          latitude: driver.latitude,
          longitude: driver.longitude,
          speed: driver.speed,
          heading: driver.heading,
        });
      }
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return results;
  }
}
