function defaultKeyGenerator(req) {
  return req.ip || req.socket?.remoteAddress || 'anonymous';
}

function createApiRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const now = options.now || Date.now;
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const buckets = new Map();

  return function apiRateLimiter(req, res, next) {
    const key = keyGenerator(req);
    const currentTime = now();
    let bucket = buckets.get(key);

    if (!bucket || currentTime >= bucket.resetAt) {
      bucket = { count: 0, resetAt: currentTime + windowMs };
      buckets.set(key, bucket);
    }

    if (bucket.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000));
      if (typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', String(retryAfterSeconds));
      }
      return res.status(429).json({ error: '请求太频繁，请稍后再试' });
    }

    bucket.count += 1;

    if (buckets.size > 1000) {
      for (const [bucketKey, value] of buckets.entries()) {
        if (currentTime >= value.resetAt) {
          buckets.delete(bucketKey);
        }
      }
    }

    return next();
  };
}

module.exports = {
  createApiRateLimiter,
};
