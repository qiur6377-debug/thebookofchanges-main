const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');

const {
  buildShengxiaoArgs,
  cleanShengxiaoOutput,
  normalizeShengxiaoInput,
  runShengxiaoReading,
} = require('../lib/shengxiao-service');

test('builds shengxiao.py arguments for a valid zodiac', () => {
  const args = buildShengxiaoArgs({ shengxiao: '虎' });

  assert.match(args[0], /bazi-master\/shengxiao\.py$/);
  assert.equal(args[1], '虎');
});

test('normalizes valid zodiac input', () => {
  assert.deepEqual(normalizeShengxiaoInput({ shengxiao: '  兔  ' }), {
    shengxiao: '兔',
  });
});

test('rejects invalid zodiac input before invoking python', async () => {
  await assert.rejects(
    () => runShengxiaoReading({ shengxiao: '猫' }),
    /请选择正确的生肖/
  );
});

test('returns stdout from shengxiao.py without terminal escape codes', async () => {
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};

    process.nextTick(() => {
      child.stdout.emit('data', Buffer.from('\u001b[32m与你三合的生肖：马狗\u001b[0m'));
      child.emit('close', 0);
    });

    return child;
  };

  const result = await runShengxiaoReading(
    { shengxiao: '虎' },
    { spawnImpl: fakeSpawn }
  );

  assert.equal(result.output, '与你三合的生肖：马狗');
});

test('removes technical support copy and separator lines from shengxiao output', () => {
  const output = cleanShengxiaoOutput(`
你的生肖是： 鼠
你的年支是： 子
================================================================================
合生肖是合八字的一小部分，有一定参考意义，但是不是全部。
合婚请以八字为准，技术支持：钉钉或微信pythontesting
以下为相合的生肖：
============================

与你三合的生肖：猴龙
  =====  
与你六合的生肖：牛
`);

  assert.match(output, /你的生肖是： 鼠/);
  assert.match(output, /与你三合的生肖：猴龙/);
  assert.doesNotMatch(output, /技术支持/);
  assert.doesNotMatch(output, /=/);
});
