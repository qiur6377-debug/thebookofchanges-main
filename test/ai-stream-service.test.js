const assert = require('node:assert/strict');
const test = require('node:test');

const { streamQwenResponse } = require('../lib/ai-stream-service');

function createResponseRecorder() {
  return {
    headers: {},
    chunks: [],
    ended: false,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    write(chunk) {
      this.chunks.push(chunk);
    },
    end() {
      this.ended = true;
    },
  };
}

function createChunkedBody(chunks) {
  const encoder = new TextEncoder();
  let index = 0;

  return {
    getReader() {
      return {
        async read() {
          if (index >= chunks.length) {
            return { done: true };
          }
          const value = encoder.encode(chunks[index]);
          index += 1;
          return { done: false, value };
        },
      };
    },
  };
}

test('streamQwenResponse sends requests to Qwen and forwards content chunks as SSE events', async () => {
  const res = createResponseRecorder();
  const seen = [];
  let requestUrl = '';
  let requestOptions;
  const fetchImpl = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return {
      ok: true,
      body: createChunkedBody([
        'data: {"choices":[{"delta":{"content":"甲"}}]}\n',
        'data: {"choices":[{"delta":{"content":"乙"}}]}\n\n',
      ]),
    };
  };

  await streamQwenResponse({
    res,
    messages: [{ role: 'user', content: 'hello' }],
    apiKey: 'test-key',
    fetchImpl,
    onContent: (text) => seen.push(text),
  });

  assert.equal(requestUrl, 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');
  assert.equal(requestOptions.headers.Authorization, 'Bearer test-key');
  const requestBody = JSON.parse(requestOptions.body);
  assert.equal(requestBody.model, 'qwen-plus');
  assert.deepEqual(requestBody.stream_options, { include_usage: true });
  assert.equal('thinking' in requestBody, false);
  assert.equal(res.headers['Content-Type'], 'text/event-stream');
  assert.deepEqual(seen, ['甲', '乙']);
  assert.deepEqual(res.chunks, [
    'data: {"type":"content","text":"甲"}\n\n',
    'data: {"type":"content","text":"乙"}\n\n',
    'data: [DONE]\n\n',
  ]);
  assert.equal(res.ended, true);
});

test('streamQwenResponse emits a user-safe error for failed upstream responses', async () => {
  const res = createResponseRecorder();
  const fetchImpl = async () => ({
    ok: false,
    text: async () => 'upstream secret detail',
  });
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await streamQwenResponse({
      res,
      messages: [{ role: 'user', content: 'hello' }],
      apiKey: 'test-key',
      fetchImpl,
      errorPrefix: '八字 AI 解读',
    });
  } finally {
    console.error = originalConsoleError;
  }

  assert.deepEqual(res.chunks, [
    'data: {"type":"error","message":"AI 解读服务暂时不可用，请稍后再试"}\n\n',
    'data: [DONE]\n\n',
  ]);
  assert.equal(res.ended, true);
});

test('streamQwenResponse explains invalid DashScope API keys', async () => {
  const res = createResponseRecorder();
  const fetchImpl = async () => ({
    ok: false,
    status: 401,
    text: async () => '{"error":{"message":"Invalid Authentication"}}',
  });
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await streamQwenResponse({
      res,
      messages: [{ role: 'user', content: 'hello' }],
      apiKey: 'bad-key',
      fetchImpl,
      errorPrefix: 'AI',
    });
  } finally {
    console.error = originalConsoleError;
  }

  assert.deepEqual(res.chunks, [
    'data: {"type":"error","message":"DashScope API Key 无效或已过期，请检查 .env 后重启服务"}\n\n',
    'data: [DONE]\n\n',
  ]);
  assert.equal(res.ended, true);
});
