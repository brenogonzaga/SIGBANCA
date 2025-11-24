import { NextRequest } from "next/server";

export function getRequestMetadata(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  return {
    ipAddress: ip,
    userAgent,
  };
}

export function getExtendedRequestMetadata(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMetadata(request);

  return {
    ipAddress,
    userAgent,
    method: request.method,
    url: request.url,
    referer: request.headers.get("referer") || undefined,
    acceptLanguage: request.headers.get("accept-language") || undefined,
  };
}
