type RateLimitRecord = {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Every minute

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

export const rateLimit = (
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult => {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

// Predefined limiters
export const apiLimiter = (ip: string) => rateLimit(`api:${ip}`, 100, 60000) // 100 req/min
export const authLimiter = (ip: string) => rateLimit(`auth:${ip}`, 10, 60000) // 10 req/min
export const gitLimiter = (ip: string) => rateLimit(`git:${ip}`, 50, 60000) // 50 req/min
