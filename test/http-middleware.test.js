const assert = require('node:assert/strict');
const test = require('node:test');

const { createApiRateLimiter } = require('../lib/http-middleware');

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test('rate limiter allows requests up to the configured limit', () => {
  let now = 1000;
  const limiter = createApiRateLimiter({ windowMs: 1000, max: 2, now: () => now });
  const req = { ip: '127.0.0.1' };
  const first = createResponse();
  const second = createResponse();
  let nextCalls = 0;

  limiter(req, first, () => { nextCalls += 1; });
  limiter(req, second, () => { nextCalls += 1; });

  assert.equal(nextCalls, 2);
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
});

test('rate limiter rejects requests after the configured limit', () => {
  let now = 1000;
  const limiter = createApiRateLimiter({ windowMs: 1000, max: 1, now: () => now });
  const req = { ip: '127.0.0.1' };
  const first = createResponse();
  const second = createResponse();
  let nextCalls = 0;

  limiter(req, first, () => { nextCalls += 1; });
  limiter(req, second, () => { nextCalls += 1; });

  assert.equal(nextCalls, 1);
  assert.equal(second.statusCode, 429);
  assert.deepEqual(second.payload, { error: '请求太频繁，请稍后再试' });
});

test('rate limiter resets the bucket after the window expires', () => {
  let now = 1000;
  const limiter = createApiRateLimiter({ windowMs: 1000, max: 1, now: () => now });
  const req = { ip: '127.0.0.1' };
  let nextCalls = 0;

  limiter(req, createResponse(), () => { nextCalls += 1; });
  now = 2101;
  limiter(req, createResponse(), () => { nextCalls += 1; });

  assert.equal(nextCalls, 2);
}
);

