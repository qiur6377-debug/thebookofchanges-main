const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_MS = 10000;
const VALID_SHENGXIAO = new Set(['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']);
const shengxiaoScriptPath = path.join(__dirname, '..', 'bazi-master', 'shengxiao.py');

function stripAnsi(text) {
  return String(text).replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function cleanShengxiaoOutput(text) {
  return stripAnsi(text)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !/^\s*=+\s*$/.test(line))
    .filter((line) => !line.includes('技术支持'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeShengxiaoInput(input = {}) {
  const shengxiao = String(input.shengxiao || '').trim();

  if (!VALID_SHENGXIAO.has(shengxiao)) {
    throw new Error('请选择正确的生肖');
  }

  return { shengxiao };
}

function buildShengxiaoArgs(input) {
  const { shengxiao } = normalizeShengxiaoInput(input);
  return [shengxiaoScriptPath, shengxiao];
}

async function runShengxiaoReading(input, options = {}) {
  const args = buildShengxiaoArgs(input);
  const spawnImpl = options.spawnImpl || spawn;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const child = spawnImpl('python3', args, {
      cwd: path.join(__dirname, '..', 'bazi-master'),
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (child.kill) child.kill('SIGTERM');
      reject(new Error('生肖合婚查询超时，请稍后再试'));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`无法启动生肖合婚脚本：${error.message}`));
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(`生肖合婚脚本执行失败（退出码 ${code}）：${stripAnsi(stderr).trim() || '未返回错误信息'}`));
        return;
      }

      resolve({ output: cleanShengxiaoOutput(stdout) });
    });
  });
}

module.exports = {
  buildShengxiaoArgs,
  cleanShengxiaoOutput,
  normalizeShengxiaoInput,
  runShengxiaoReading,
};
