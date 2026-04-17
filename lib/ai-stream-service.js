const QWEN_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEFAULT_MODEL = 'qwen-plus';
const DEFAULT_AI_ERROR_MESSAGE = 'AI 解读服务暂时不可用，请稍后再试';
const DEFAULT_NETWORK_ERROR_MESSAGE = '网络错误，请稍后再试';
const INVALID_AUTH_ERROR_MESSAGE = 'DashScope API Key 无效或已过期，请检查 .env 后重启服务';

function setSseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

function writeSsePayload(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function writeDone(res) {
  res.write('data: [DONE]\n\n');
}

function getUpstreamErrorMessage(status, errorText) {
  if (status === 401 || /invalid authentication|invalid api key|unauthorized/i.test(errorText)) {
    return INVALID_AUTH_ERROR_MESSAGE;
  }

  return DEFAULT_AI_ERROR_MESSAGE;
}

function forwardOpenAiStreamLine(line, res, callbacks = {}) {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('data: ')) return;

  const data = trimmed.slice(6);
  if (data === '[DONE]') return;

  try {
    const parsed = JSON.parse(data);

    if (parsed.usage && typeof callbacks.onUsage === 'function') {
      callbacks.onUsage(parsed.usage);
    }

    const content = parsed.choices?.[0]?.delta?.content;
    if (content) {
      if (typeof callbacks.onContent === 'function') {
        callbacks.onContent(content);
      }
      writeSsePayload(res, { type: 'content', text: content });
    }
  } catch (error) {
    // Upstream can occasionally emit non-JSON keepalive fragments.
  }
}

async function streamQwenResponse(options) {
  const {
    res,
    messages,
    apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY,
    fetchImpl = fetch,
    model = DEFAULT_MODEL,
    errorPrefix = 'AI 解读',
    onContent,
    onUsage,
  } = options;

  setSseHeaders(res);

  if (!apiKey) {
    console.error(`${errorPrefix} API Key 未配置`);
    writeSsePayload(res, { type: 'error', message: DEFAULT_AI_ERROR_MESSAGE });
    writeDone(res);
    res.end();
    return { ok: false };
  }

  try {
    const response = await fetchImpl(QWEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${errorPrefix} API 错误:`, errorText);
      writeSsePayload(res, { type: 'error', message: getUpstreamErrorMessage(response.status, errorText) });
      writeDone(res);
      res.end();
      return { ok: false };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        forwardOpenAiStreamLine(line, res, { onContent, onUsage });
      }
    }

    if (buffer.trim()) {
      forwardOpenAiStreamLine(buffer, res, { onContent, onUsage });
    }

    writeDone(res);
    res.end();
    return { ok: true };
  } catch (error) {
    console.error(`请求${errorPrefix}失败:`, error);
    writeSsePayload(res, { type: 'error', message: DEFAULT_NETWORK_ERROR_MESSAGE });
    writeDone(res);
    res.end();
    return { ok: false };
  }
}

module.exports = {
  forwardOpenAiStreamLine,
  getUpstreamErrorMessage,
  setSseHeaders,
  streamQwenResponse,
};
