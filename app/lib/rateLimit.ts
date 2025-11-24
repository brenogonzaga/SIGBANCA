import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 10 * 60 * 1000);

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0] : realIp || "unknown";

  return ip;
}

export function rateLimit(options: RateLimitOptions) {
  const {
    maxRequests,
    windowMs,
    keyGenerator = getClientIdentifier,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const key = keyGenerator(request);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const record = store[key];

    if (record.count >= maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      return NextResponse.json(
        {
          error: "Muitas requisições. Tente novamente mais tarde.",
          retryAfter: resetIn,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetIn.toString(),
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
          },
        }
      );
    }

    if (!skipSuccessfulRequests && !skipFailedRequests) {
      record.count++;
    }

    const response = await handler();

    const isSuccess = response.status >= 200 && response.status < 300;
    const isFailed = response.status >= 400;

    if (skipSuccessfulRequests && skipFailedRequests) {
    } else if (skipSuccessfulRequests && isSuccess) {
    } else if (skipFailedRequests && isFailed) {
    } else if (!skipSuccessfulRequests && !skipFailedRequests) {
    } else {
      record.count++;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    return response;
  };
}

export const strictRateLimit = rateLimit({
  maxRequests: 5,
  windowMs: 60 * 1000,
});

export const moderateRateLimit = rateLimit({
  maxRequests: 20,
  windowMs: 60 * 1000,
});

export const lenientRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 60 * 1000,
});

export const authRateLimit = rateLimit({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  skipSuccessfulRequests: true,
});

export const publicApiRateLimit = rateLimit({
  maxRequests: 30,
  windowMs: 60 * 1000,
});
