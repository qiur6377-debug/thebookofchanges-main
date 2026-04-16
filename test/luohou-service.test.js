const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const test = require('node:test');

const {
  buildLuohouInterpretationMessages,
  buildLuohouArgs,
  cleanLuohouOutput,
  normalizeLuohouInput,
  normalizeLuohouInterpretationInput,
  runLuohouReading,
} = require('../lib/luohou-service');

test('builds luohou.py arguments for a date range', () => {
  const args = buildLuohouArgs({ date: '2026-04-16', days: 7 });

  assert.match(args[0], /bazi-master\/luohou\.py$/);
  assert.deepEqual(args.slice(1), ['-d', '2026 4 16', '-n', '7']);
});

test('normalizes compact date input and default days', () => {
  assert.deepEqual(normalizeLuohouInput({ year: '2026', month: '04', day: '16' }), {
    year: 2026,
    month: 4,
    day: 16,
    days: 15,
  });
});

test('rejects invalid luohou dates before invoking python', async () => {
  await assert.rejects(
    () => runLuohouReading({ date: '2026-02-31', days: 3 }),
    /请选择有效的公历日期/
  );
});

test('rejects luohou ranges that are too long', async () => {
  await assert.rejects(
    () => runLuohouReading({ date: '2026-04-16', days: 91 }),
    /查询天数必须在 1 到 90 之间/
  );
});

test('returns stdout from luohou.py without terminal escape codes', async () => {
  function fakeSpawn(command, args) {
    assert.equal(command, 'python3');
    assert.deepEqual(args.slice(1), ['-d', '2026 4 16', '-n', '3']);

    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};

    process.nextTick(() => {
      child.stdout.emit('data', Buffer.from('\u001b[36m2026年九宫飞星\u001b[0m\n公历:2026年4月16日'));
      child.emit('close', 0);
    });

    return child;
  }

  const result = await runLuohouReading(
    { date: '2026-04-16', days: 3 },
    { spawnImpl: fakeSpawn }
  );

  assert.equal(result.output, '2026年九宫飞星\n公历:2026年4月16日');
});

test('removes separator dash lines from luohou output', () => {
  const output = cleanLuohouOutput(`
一白水星 —— + 贪狼：事业、人缘与桃花
------------------------------------------------------------------------------------------------------------------------
2026年九宫飞星
    ----------   
公历:2026年4月16日 杀:戌19-21丑1-3
`);

  assert.match(output, /一白水星/);
  assert.match(output, /2026年九宫飞星/);
  assert.match(output, /公历:2026年4月16日/);
  assert.doesNotMatch(output, /---/);
});

test('builds plain-language AI messages from a luohou reading', () => {
  const messages = buildLuohouInterpretationMessages({
    luohouOutput: '2026年九宫飞星\n公历:2026年4月16日 杀:戌19-21丑1-3\n月破，大事不宜',
  });

  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'system');
  assert.match(messages[0].content, /罗喉择日/);
  assert.match(messages[0].content, /大白话/);
  assert.match(messages[0].content, /不要重新推算/);
  assert.match(messages[0].content, /直接开始解释/);
  assert.equal(messages[1].role, 'user');
  assert.match(messages[1].content, /月破，大事不宜/);
});

test('rejects empty luohou outputs before calling AI', () => {
  assert.throws(
    () => normalizeLuohouInterpretationInput({ luohouOutput: '   ' }),
    /请先完成罗喉择日/
  );
});
