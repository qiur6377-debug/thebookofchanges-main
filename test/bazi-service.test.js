const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');

const {
  buildBaziArgs,
  buildBaziInterpretationMessages,
  buildBaziReverseArgs,
  normalizeBaziInput,
  normalizeBaziInterpretationInput,
  normalizeBaziReverseInput,
  runBaziReading,
  runBaziReverseReading,
  stripAnsi,
} = require('../lib/bazi-service');

test('builds bazi.py arguments for solar female readings', () => {
  const args = buildBaziArgs({
    year: 1990,
    month: 5,
    day: 12,
    hour: 9,
    calendar: 'solar',
    gender: 'female',
  });

  assert.match(args[0], /bazi-master\/bazi\.py$/);
  assert.deepEqual(args.slice(1), [
    '-g',
    '-n',
    '--minute',
    '0',
    '--zi-mode',
    'midnight',
    '1990',
    '5',
    '12',
    '9',
  ]);
});

test('builds precise bazi.py arguments for true solar time and zi-hour mode', () => {
  const args = buildBaziArgs({
    year: 2000,
    month: 6,
    day: 3,
    hour: 23,
    minute: 45,
    calendar: 'solar',
    gender: 'female',
    birthPlace: '北京',
    longitude: '116.397',
    trueSolar: true,
    ziMode: 'zi-start',
  });

  assert.match(args[0], /bazi-master\/bazi\.py$/);
  assert.deepEqual(args.slice(1), [
    '-g',
    '-n',
    '--minute',
    '45',
    '--birth-place',
    '北京',
    '--longitude',
    '116.397',
    '--true-solar',
    '--zi-mode',
    'zi-start',
    '2000',
    '6',
    '3',
    '23',
  ]);
});

test('normalizes lunar leap-month male readings', () => {
  assert.deepEqual(
    normalizeBaziInput({
      year: '1988',
      month: '4',
      day: '18',
      hour: '23',
      calendar: 'lunar',
      gender: 'male',
      leapMonth: true,
    }),
    {
      year: 1988,
      month: 4,
      day: 18,
      hour: 23,
      minute: 0,
      calendar: 'lunar',
      gender: 'male',
      leapMonth: true,
      birthPlace: '',
      longitude: null,
      trueSolar: false,
      ziMode: 'midnight',
    }
  );
});

test('rejects invalid birth hours before invoking python', async () => {
  await assert.rejects(
    () => runBaziReading({ year: 1990, month: 5, day: 12, hour: 24 }),
    /出生时辰必须在 0 到 23 之间/
  );
});

test('rejects invalid birth minutes and true-solar longitude before invoking python', async () => {
  await assert.rejects(
    () => runBaziReading({ year: 1990, month: 5, day: 12, hour: 9, minute: 60 }),
    /出生分钟必须在 0 到 59 之间/
  );

  await assert.rejects(
    () => runBaziReading({ year: 1990, month: 5, day: 12, hour: 9, trueSolar: true }),
    /使用真太阳时必须填写出生地经度/
  );
});

test('returns stdout and strips terminal escape codes', async () => {
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};

    process.nextTick(() => {
      child.stdout.emit('data', Buffer.from('\u001b[31m女命\u001b[0m\n八字结果'));
      child.emit('close', 0);
    });

    return child;
  };

  const result = await runBaziReading(
    { year: 1990, month: 5, day: 12, hour: 9, calendar: 'solar', gender: 'female' },
    { spawnImpl: fakeSpawn }
  );

  assert.equal(result.output, '女命\n八字结果');
});

test('removes bazi upstream contact copy from reading output', async () => {
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};

    process.nextTick(() => {
      child.stdout.emit('data', Buffer.from('四柱：癸未 辛酉 己酉 乙亥 解读:钉ding或v信pythontesting\n正常结果'));
      child.emit('close', 0);
    });

    return child;
  };

  const result = await runBaziReading(
    { year: 1990, month: 5, day: 12, hour: 9, calendar: 'solar', gender: 'female' },
    { spawnImpl: fakeSpawn }
  );

  assert.equal(result.output, '四柱：癸未 辛酉 己酉 乙亥\n正常结果');
  assert.doesNotMatch(result.output, /钉|微信|v信|pythontesting|技术支持|解读:/);
});

test('builds bazi.py arguments for reverse four-pillar lookup', () => {
  const args = buildBaziReverseArgs({
    yearPillar: '丁巳',
    monthPillar: '己酉',
    dayPillar: '癸未',
    hourPillar: '壬戌',
    startYear: 1970,
    endYear: 1980,
  });

  assert.match(args[0], /bazi-master\/bazi\.py$/);
  assert.deepEqual(args.slice(1), [
    '-b',
    '--start',
    '1970',
    '--end',
    '1980',
    '丁巳',
    '己酉',
    '癸未',
    '壬戌',
  ]);
});

test('normalizes reverse four-pillar input with default year range', () => {
  assert.deepEqual(
    normalizeBaziReverseInput({
      yearPillar: ' 丁巳 ',
      monthPillar: '己酉',
      dayPillar: '癸未',
      hourPillar: '壬戌',
    }),
    {
      yearPillar: '丁巳',
      monthPillar: '己酉',
      dayPillar: '癸未',
      hourPillar: '壬戌',
      startYear: 1850,
      endYear: 2030,
    }
  );
});

test('rejects invalid reverse four-pillar input before invoking python', async () => {
  await assert.rejects(
    () => runBaziReverseReading({
      yearPillar: '甲丑',
      monthPillar: '己酉',
      dayPillar: '癸未',
      hourPillar: '壬戌',
    }),
    /年柱必须是有效的六十甲子/
  );
});

test('returns reverse lookup stdout without terminal escape codes', async () => {
  const fakeSpawn = (command, args) => {
    assert.equal(command, 'python3');
    assert.deepEqual(args.slice(1), [
      '-b',
      '--start',
      '1970',
      '--end',
      '1980',
      '丁巳',
      '己酉',
      '癸未',
      '壬戌',
    ]);

    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};

    process.nextTick(() => {
      child.stdout.emit('data', Buffer.from('\u001b[32m可能出生时间: python bazi.py -g 1977 9 23 19 :0:0\u001b[0m'));
      child.emit('close', 0);
    });

    return child;
  };

  const result = await runBaziReverseReading(
    {
      yearPillar: '丁巳',
      monthPillar: '己酉',
      dayPillar: '癸未',
      hourPillar: '壬戌',
      startYear: 1970,
      endYear: 1980,
    },
    { spawnImpl: fakeSpawn }
  );

  assert.equal(result.output, '可能出生时间: python bazi.py -g 1977 9 23 19 :0:0');
});

test('stripAnsi removes color control sequences', () => {
  assert.equal(stripAnsi('\u001b[32mhello\u001b[0m'), 'hello');
});

test('builds plain-language AI messages from a bazi reading', () => {
  const messages = buildBaziInterpretationMessages({
    baziOutput: '女命\n四柱：庚午 辛巳 丁丑 乙巳\n五行：火旺，水弱',
  });

  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'system');
  assert.match(messages[0].content, /大白话/);
  assert.match(messages[0].content, /不要制造焦虑/);
  assert.match(messages[0].content, /不要寒暄/);
  assert.match(messages[0].content, /不要使用 emoji/);
  assert.match(messages[0].content, /不要使用 Markdown/);
  assert.match(messages[0].content, /懂命理、也懂年轻人情绪的朋友/);
  assert.match(messages[0].content, /不要下命运结论/);
  assert.match(messages[0].content, /第一行必须是「你给人的底色：」/);
  assert.match(messages[0].content, /禁止出现“这份八字排盘/);
  assert.equal(messages[1].role, 'user');
  assert.match(messages[1].content, /四柱：庚午 辛巳 丁丑 乙巳/);
  assert.match(messages[1].content, /五行：火旺，水弱/);
});

test('rejects empty bazi outputs before calling AI', () => {
  assert.throws(
    () => normalizeBaziInterpretationInput({ baziOutput: '   ' }),
    /请先完成八字排盘/
  );
});

test('truncates very long bazi outputs for AI interpretation', () => {
  const input = normalizeBaziInterpretationInput({ baziOutput: '甲'.repeat(20000) });

  assert.equal(input.baziOutput.length, 12000);
});
