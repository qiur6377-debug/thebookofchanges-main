# 项目功能与文件说明

本文档用于快速熟悉 `thebookofchanges-main` 项目的整体功能、技术结构、数据流和主要文件职责。项目当前是一个 Node.js + Express 后端、原生前端页面、Python 命理脚本组合而成的国学工具站。

## 1. 项目定位

项目名称可以理解为“周易 · 国学解惑”。它把几个传统文化工具放在同一个网页里：

- 周易占事：输入问题后起卦，展示本卦、动爻、之卦，并调用 AI 做古韵解读和大白话解释。
- 蓍草起卦：用 Canvas 动画模拟传统“大衍筮法”的分二、挂一、揲四、归奇过程。
- 八字星盘：输入出生年月日时，调用 `bazi-master/bazi.py` 排出四柱、大运、五行、格局等内容。
- 八字大白话解读：把 Python 排盘结果交给 AI，生成现代中文解释。
- 四柱反推出生时间：输入年柱、月柱、日柱、时柱，反推可能的公历出生时间。
- 生肖合婚：选择生肖，查询三合、六合、三会，以及冲、刑、害、破关系。
- 罗喉择日：按起始日期和天数查询罗喉日时、九宫飞星、太岁岁破、月破等择日辅助信息。
- 罗喉大白话解读：把择日结果交给 AI，生成普通人能看懂的解释。

这些功能都集中在同一个单页应用里，首页通过四个入口进入不同流程。

## 2. 技术栈

- 后端：Node.js、Express。
- 前端：原生 HTML、CSS、JavaScript。
- AI：阿里云百炼 DashScope OpenAI 兼容接口，当前模型为 `qwen-plus`。
- 数据库：SQLite，本地文件为 `database.sqlite`。
- Python 命理库：`bazi-master` 目录，依赖 `bidict`、`lunar_python`、`colorama`、`sxtwl`。
- 文档站：VitePress，源码来自 `knowledge/`，构建输出在 `docs/`。
- 容器化：Dockerfile + requirements.txt。
- 测试：Node.js 内置测试框架 `node --test`。

## 3. 启动方式

### 本地启动主应用

```bash
npm start
```

默认服务地址：

```text
http://localhost:3000
```

### 运行测试

```bash
npm test
```

### 启动 VitePress 文档站

```bash
npm run docs:dev
```

### 构建 VitePress 静态文档

```bash
npm run docs:build
```

### Docker 运行思路

项目已经包含 `Dockerfile` 和 `requirements.txt`。容器会安装 Node 依赖、Python3、pip 和 Python 命理依赖，然后通过 `npm start` 启动服务，暴露 `3000` 端口。

## 4. 环境变量

项目使用 `.env` 存放本地私密配置，主要需要：

```text
DASHSCOPE_API_KEY=你的 DashScope API Key
```

注意：`.env` 已被 `.gitignore` 忽略，不应该提交到 GitHub。

## 5. 整体运行链路

### 周易占事链路

1. 用户在首页点击“周易占事”。
2. 用户输入要问的事情。
3. 快速模式点击“沐手起卦”，前端调用 `POST /api/divine`。
4. 后端读取 `knowledge/zhouyi_1.md` 到 `knowledge/zhouyi_64.md` 的卦象知识。
5. 后端生成六爻、判断本卦、动爻和之卦。
6. 前端展示卦象线条、爻辞说明、动爻提示和变卦。
7. 用户点击“请太公解卦”，前端调用 `POST /api/interpret`。
8. 后端组装周易 Prompt，调用 Qwen，以 SSE 流式返回 AI 内容。
9. 前端把 AI 结果拆成“古韵解析”和“大白话”两块展示。
10. 后端把问题、卦号、动爻、之卦和 AI 解读保存到 SQLite。

### 蓍草起卦链路

1. 用户点击“蓍草起卦（高级）”。
2. 前端进入净手静心界面，需要长按圆盘三秒。
3. `public/yarrow.js` 启动 Canvas 草棍动画。
4. 每一爻经过三变：分二、挂一、揲四、归奇。
5. 完成六爻后，前端把生成的 `yaoValues` 传给 `POST /api/divine`。
6. 后端不再随机起卦，而是用前端传来的六爻值查本卦、动爻和之卦。
7. 后续 AI 解读流程与普通周易占事一致。

### 八字星盘链路

1. 用户点击“八字星盘”。
2. 输入历法、公历/农历、性别、年月日时、是否闰月。
3. 前端调用 `POST /api/bazi`。
4. 后端 `lib/bazi-service.js` 校验输入并组装 Python 参数。
5. 后端通过 `python3 bazi-master/bazi.py ...` 执行排盘。
6. Python 脚本输出四柱、大运、五行分数、格局、刑冲合害、神煞等文本。
7. 后端去除终端颜色控制字符后返回给前端。
8. 前端显示原始排盘结果。
9. 用户点击“生成大白话解读”。
10. 前端调用 `POST /api/bazi/interpret`。
11. 后端把排盘文本交给 Qwen，流式输出普通中文解释。

### 四柱反推链路

1. 用户在八字星盘页面填写年柱、月柱、日柱、时柱。
2. 可指定起始年份和结束年份，默认 `1850` 到 `2030`。
3. 前端调用 `POST /api/bazi/reverse`。
4. 后端校验四柱是否是合法六十甲子，且年份范围最多 300 年。
5. 后端执行 `bazi-master/bazi.py -b --start ... --end ... 年柱 月柱 日柱 时柱`。
6. Python 内部使用 `sxtwl.siZhu2Year` 反推出可能出生时间。
7. 结果返回给前端展示。

### 生肖合婚链路

1. 用户点击“生肖合婚”。
2. 选择十二生肖之一。
3. 前端调用 `POST /api/shengxiao`。
4. 后端 `lib/shengxiao-service.js` 校验生肖。
5. 后端执行 `bazi-master/shengxiao.py 生肖`。
6. 后端清理输出里的 `====` 分隔线和“技术支持”字样。
7. 前端展示相合与不合生肖关系。

### 罗喉择日链路

1. 用户点击“罗喉择日”。
2. 输入起始日期和查询天数。
3. 前端调用 `POST /api/luohou`。
4. 后端校验日期范围：年份 `1900` 到 `2100`，天数 `1` 到 `90`。
5. 后端执行 `bazi-master/luohou.py -d "年 月 日" -n 天数`。
6. Python 输出九宫飞星、罗喉日时、岁破、月破、大偷休、小偷休等信息。
7. 后端清理输出里的 `----` 分隔线。
8. 前端展示择日结果。
9. 用户点击“生成大白话解读”。
10. 前端调用 `POST /api/luohou/interpret`。
11. 后端把择日文本交给 Qwen，流式输出解释。

## 6. 后端 API

### `POST /api/divine`

用途：周易起卦。

请求：

- `question`：用户所问之事，必填。
- `yaoValues`：可选，长度为 6 的爻值数组。蓍草模式会传这个字段。

返回：

- `hexagramNumber`：本卦编号。
- `title`：本卦标题。
- `yaoLines`：六爻阴阳线。
- `yaoDescriptions`：每一爻的文字说明。
- `changingPositions`：动爻位置。
- `changedHexagramNumber`：之卦编号，没有动爻时为 `null`。
- `changedTitle`：之卦标题。
- `changedYaoLines`：变卦后的六爻。

### `POST /api/interpret`

用途：对周易卦象做 AI 解读。

请求：

- `question`：用户问题。
- `hexagramNumber`：本卦编号。
- `changingPositions`：动爻位置。
- `changedHexagramNumber`：之卦编号。

返回：SSE 流式数据，每段为：

```text
data: {"type":"content","text":"..."}
```

结束时返回：

```text
data: [DONE]
```

### `POST /api/bazi`

用途：八字排盘。

请求：

- `calendar`：`solar` 或 `lunar`。
- `gender`：`male` 或 `female`。
- `year`：出生年份，范围 `1850` 到 `2030`。
- `month`：出生月份，范围 `1` 到 `12`。
- `day`：出生日期，范围 `1` 到 `31`。
- `hour`：出生小时，范围 `0` 到 `23`。
- `leapMonth`：是否农历闰月，只适用于农历。

返回：

- `output`：Python 排盘文本。

### `POST /api/bazi/reverse`

用途：根据四柱反推可能出生时间。

请求：

- `yearPillar`：年柱，例如 `丁巳`。
- `monthPillar`：月柱，例如 `己酉`。
- `dayPillar`：日柱，例如 `癸未`。
- `hourPillar`：时柱，例如 `壬戌`。
- `startYear`：起始年份，默认 `1850`。
- `endYear`：结束年份，默认 `2030`。

返回：

- `output`：可能出生时间列表。

### `POST /api/bazi/interpret`

用途：把八字排盘结果翻译成大白话。

请求：

- `baziOutput`：八字排盘文本。

返回：SSE 流式 AI 文本。

### `POST /api/shengxiao`

用途：生肖合婚关系查询。

请求：

- `shengxiao`：十二生肖之一。

返回：

- `output`：清理后的生肖关系文本。

### `POST /api/luohou`

用途：罗喉日时与风水择日辅助。

请求：

- `date`：公历日期，格式 `YYYY-MM-DD`。
- `days`：查询天数，范围 `1` 到 `90`。

也支持后端标准化时传入 `year`、`month`、`day`。

返回：

- `output`：清理后的择日文本。

### `POST /api/luohou/interpret`

用途：把罗喉择日结果翻译成大白话。

请求：

- `luohouOutput`：择日结果文本。

返回：SSE 流式 AI 文本。

## 7. AI 解读机制

项目当前有三类 AI 解读：

- 周易解卦：`/api/interpret`，Prompt 在 `server.js` 中。
- 八字大白话：`/api/bazi/interpret`，Prompt 由 `lib/bazi-service.js` 生成。
- 罗喉大白话：`/api/luohou/interpret`，Prompt 由 `lib/luohou-service.js` 生成。

共同特点：

- 使用阿里云百炼 DashScope OpenAI 兼容接口。
- 请求地址为 `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`。
- 模型为 `qwen-plus`。
- 使用 `stream: true`。
- 后端接收上游流式数据，再用 SSE 转发给浏览器。
- 前端逐字显示，形成打字机效果。

八字和罗喉的大白话 Prompt 都要求 AI：

- 只解释已有排盘或择日文本，不重新推算。
- 不编造文本中没有的信息。
- 不制造焦虑，不恐吓用户。
- 明确这是传统文化参考，不能替代现实决策。
- 直接开始解释，不要寒暄，不要 Markdown 分隔线和列表符号。

## 8. 数据库

### `database.sqlite`

本地 SQLite 数据库文件。当前主要用于保存周易占事的 AI 解读历史。

后端启动时会自动创建表：

```sql
CREATE TABLE IF NOT EXISTS divination_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT,
  hexagram_number INTEGER,
  changing_positions TEXT,
  changed_hexagram INTEGER,
  ai_interpretation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

字段说明：

- `question`：用户所问之事。
- `hexagram_number`：本卦编号。
- `changing_positions`：动爻数组，保存为 JSON 字符串。
- `changed_hexagram`：之卦编号。
- `ai_interpretation`：AI 完整解读文本。
- `created_at`：创建时间。

`database.sqlite` 已被 `.gitignore` 忽略，不建议提交。

## 9. 目录与文件总览

### 根目录

#### `server.js`

后端主入口，职责最多。

主要内容：

- 创建 Express 应用。
- 读取 `.env`。
- 初始化 SQLite。
- 启动时加载 64 卦 Markdown 知识库。
- 提供静态资源服务 `public/`。
- 提供周易、八字、生肖、罗喉相关 API。
- 调用 Qwen 生成 AI 解读。
- 处理 SSE 流式输出。
- 保存周易解读历史到 SQLite。

关键函数：

- `parseHexagramFile(filePath)`：读取单个卦象 Markdown。
- `loadKnowledgeBase()`：加载 `knowledge/zhouyi_1.md` 到 `knowledge/zhouyi_64.md`。
- `divinate()`：模拟蓍草起卦，生成六爻、本卦、动爻和之卦。

关键路由：

- `POST /api/divine`
- `POST /api/interpret`
- `POST /api/bazi`
- `POST /api/bazi/reverse`
- `POST /api/bazi/interpret`
- `POST /api/shengxiao`
- `POST /api/luohou`
- `POST /api/luohou/interpret`

#### `package.json`

Node 项目配置。

脚本：

- `npm start`：运行 `node server.js`。
- `npm test`：运行 Node 内置测试。
- `npm run docs:dev`：启动 VitePress 开发服务。
- `npm run docs:build`：构建 VitePress 文档。
- `npm run docs:preview`：预览 VitePress 构建结果。

依赖：

- `express`：Web 服务。
- `dotenv`：读取 `.env`。
- `sqlite3`：SQLite 数据库。
- `vitepress`：文档站。
- `markdown-it`：Markdown 解析相关依赖。

#### `package-lock.json`

锁定 Node 依赖版本，保证不同机器安装出来的依赖一致。

#### `requirements.txt`

Python 依赖列表：

- `bidict`
- `lunar_python`
- `colorama`
- `sxtwl`

这些是 `bazi-master` 里八字、生肖、罗喉脚本需要的依赖。

#### `Dockerfile`

容器化配置。

主要步骤：

- 使用 `node:22-bookworm`。
- 安装 `python3`、`python3-pip`、`python3-venv`。
- 执行 `npm ci` 安装 Node 依赖。
- 执行 `pip install -r requirements.txt` 安装 Python 依赖。
- 复制项目文件。
- 暴露 `3000` 端口。
- 通过 `npm start` 启动。

#### `.dockerignore`

Docker 构建时忽略不需要复制进镜像的内容：

- `node_modules`
- `npm-debug.log`
- `.git`
- `.gitignore`
- `.DS_Store`
- `.env`
- `database.sqlite`

这样可以减小镜像体积，并避免把本地私密配置和数据库带进镜像。

#### `.gitignore`

Git 忽略规则。

当前忽略：

- `node_modules`
- `.env`
- `.DS_Store`
- `database.sqlite`
- `npm-debug.log`
- `.vitepress/cache`

#### `.env`

本地环境变量文件。通常放 `DASHSCOPE_API_KEY`。不应该提交。

#### `database.sqlite`

本地 SQLite 数据库。运行项目并产生周易 AI 解读后会写入记录。不应该提交。

#### `PROJECT_INTRODUCTION.md`

较早的一版项目介绍，主要说明周易占事和 AI 解读。当前新文档比它覆盖范围更完整。

#### `PROJECT_FUNCTIONS_AND_FILES.md`

当前这份新文档。用于全面介绍功能和文件职责。

#### `index.md`

VitePress 首页 Markdown。用于文档站首页，不是主应用首页。

#### `md-slicer.js`

Markdown 拆分脚本。它读取 `knowledge/zhouyi.md`，按一级标题拆成 `knowledge/zhouyi_1.md`、`knowledge/zhouyi_2.md` 等单卦文件。属于内容整理工具。

## 10. `public/` 前端应用

### `public/index.html`

主应用页面结构。

包含这些页面区块：

- `home-section`：首页入口。
- `question-section`：周易占事输入表单。
- `bazi-section`：八字星盘、四柱反推、八字结果和大白话解读。
- `shengxiao-section`：生肖合婚。
- `luohou-section`：罗喉择日、右侧说明、大白话解读。
- `animation-section`：快速起卦时的过渡动画。
- `yarrow-section`：蓍草起卦高级模式。
- `result-section`：周易卦象结果和 AI 解读。

外部资源：

- Google Fonts 的思源宋体。
- `style.css`
- `yarrow.css`
- html2canvas CDN，用于保存分享图。
- `yarrow.js`
- `app.js`

### `public/app.js`

主前端逻辑文件。

主要职责：

- 控制首页与各功能区切换。
- 发起周易起卦请求。
- 渲染本卦、动爻、之卦。
- 读取 `/api/interpret` 的 SSE 流，拆分古韵解析与大白话。
- 处理八字排盘表单。
- 处理四柱反推表单。
- 处理八字大白话 SSE。
- 处理生肖合婚查询。
- 处理罗喉择日查询。
- 处理罗喉大白话 SSE。
- 管理蓍草起卦入口和结果提交。
- 使用 html2canvas 保存周易结果分享图。

重要状态：

- `currentQuestion`：当前周易问题。
- `currentHexagramNumber`：当前本卦编号。
- `currentChangingPositions`：当前动爻位置。
- `currentChangedHexagramNumber`：当前之卦编号。
- `currentBaziOutput`：当前八字排盘原文。
- `currentLuohouOutput`：当前罗喉择日原文。

### `public/style.css`

主样式文件。

负责：

- 深色国风视觉主题。
- 首页入口卡片。
- 表单、按钮、输入框。
- 周易卦象线条。
- 八字、生肖、罗喉结果区域。
- AI 解读内容框。
- 罗喉双栏布局。
- 响应式移动端适配。

主要 CSS 变量：

- `--bg-color`
- `--panel-bg`
- `--text-primary`
- `--text-secondary`
- `--accent-gold`
- `--accent-red`
- `--border-color`

### `public/yarrow.js`

蓍草起卦高级模式逻辑。

主要类：

- `Stalk`：单根蓍草对象，记录位置、目标位置、角度、颜色和透明度。
- `StalksCanvas`：Canvas 渲染引擎，负责创建草棍、分堆、挂一、标记余数、归拢余数和动画循环。
- `YarrowStateMachine`：六爻十八变状态机，负责每一爻的三变流程。
- `PurifyStep`：净手静心长按交互，长按三秒后进入推演。

导出方式：

- 挂到 `window.YarrowModule`，供 `app.js` 调用。

### `public/yarrow.css`

蓍草高级模式专用样式。

负责：

- 蓍草页面双栏布局。
- 左侧流程说明。
- 净手静心圆形进度环。
- Canvas 容器。
- 六爻进度点。
- 当前步骤高亮。
- 移动端单栏布局。

### `public/yi.svg`

应用 Logo 图形。主应用页和 VitePress 文档站都会用到。

## 11. `lib/` 后端服务封装

### `lib/bazi-service.js`

八字功能的 Node 封装层。

主要职责：

- 校验出生年月日时。
- 区分公历和农历。
- 处理农历闰月。
- 处理男女命参数。
- 组装 `bazi.py` 命令行参数。
- 校验四柱反推输入。
- 执行 Python 子进程。
- 设置超时。
- 清理 ANSI 颜色控制字符。
- 把 Python 依赖缺失错误转换成中文提示。
- 构建八字大白话 AI Prompt。

关键函数：

- `normalizeBaziInput(input)`
- `buildBaziArgs(input)`
- `normalizeBaziReverseInput(input)`
- `buildBaziReverseArgs(input)`
- `normalizeBaziInterpretationInput(input)`
- `buildBaziInterpretationMessages(input)`
- `runBaziReading(input, options)`
- `runBaziReverseReading(input, options)`
- `stripAnsi(text)`

输入限制：

- 出生年份：`1850` 到 `2030`。
- 月份：`1` 到 `12`。
- 日期：`1` 到 `31`。
- 小时：`0` 到 `23`。
- 四柱反推年份跨度最多 300 年。
- AI 八字输入最多取前 12000 字。

### `lib/shengxiao-service.js`

生肖合婚功能的 Node 封装层。

主要职责：

- 校验生肖是否属于十二生肖。
- 组装 `shengxiao.py` 参数。
- 执行 Python 子进程。
- 清理 ANSI 控制字符。
- 删除 `====` 分隔线。
- 删除“技术支持”相关文案。
- 合并多余空行。

关键函数：

- `normalizeShengxiaoInput(input)`
- `buildShengxiaoArgs(input)`
- `cleanShengxiaoOutput(text)`
- `runShengxiaoReading(input, options)`

### `lib/luohou-service.js`

罗喉择日功能的 Node 封装层。

主要职责：

- 校验公历日期。
- 校验查询天数。
- 组装 `luohou.py` 参数。
- 执行 Python 子进程。
- 清理 ANSI 控制字符。
- 删除 `----` 分隔线。
- 构建罗喉大白话 AI Prompt。
- 转换 Python 依赖缺失错误。

关键函数：

- `normalizeLuohouInput(input)`
- `buildLuohouArgs(input)`
- `cleanLuohouOutput(text)`
- `normalizeLuohouInterpretationInput(input)`
- `buildLuohouInterpretationMessages(input)`
- `runLuohouReading(input, options)`
- `stripAnsi(text)`

输入限制：

- 日期年份：`1900` 到 `2100`。
- 查询天数：`1` 到 `90`。
- AI 罗喉输入最多取前 12000 字。

## 12. `bazi-master/` Python 命理脚本

`bazi-master` 是原始 Python 命理工具目录，Node 后端通过子进程调用其中部分脚本。

### `bazi-master/bazi.py`

八字排盘主脚本。

支持参数：

- `year month day time`：年月日时。
- `-g`：使用公历输入。
- `-r`：农历闰月。
- `-n`：女命，默认男命。
- `-b`：直接输入四柱。
- `--start`：四柱反推起始年份，默认 `1850`。
- `--end`：四柱反推结束年份，默认 `2030`。

主要输出：

- 公历/农历日期。
- 四柱干支。
- 十神。
- 藏干。
- 空亡。
- 纳音。
- 合、冲、刑、害、破。
- 三合、三会、六合。
- 调候。
- 五行分数。
- 八字强弱。
- 神煞。
- 格局分析。
- 大运和流年。
- 古籍命理文本引用。

被 Node 调用的方式：

- 八字排盘：`python3 bazi.py [-g] [-r] [-n] 年 月 日 时`
- 四柱反推：`python3 bazi.py -b --start 起年 --end 止年 年柱 月柱 日柱 时柱`

### `bazi-master/shengxiao.py`

生肖合婚脚本。

输入一个生肖，输出：

- 你的生肖。
- 年支。
- 三合生肖。
- 六合生肖。
- 三会生肖。
- 相冲生肖。
- 你刑的生肖。
- 被你刑的生肖。
- 相害生肖。
- 相破生肖。
- 合与不合同时出现时的抵消说明。

Node 后端会对它的原始输出做清理，去掉技术支持文案和分隔符。

### `bazi-master/luohou.py`

罗喉日时和风水择日辅助脚本。

支持参数：

- `-d "年 月 日"`：起始公历日期。
- `-n 天数`：查询多少天。

主要输出：

- 九宫飞星说明。
- 年九宫飞星盘。
- 月份九宫飞星。
- 太岁压祭主。
- 日压祭主。
- 每一天的公历、农历、年月日干支。
- 杀师时。
- 年猴、月罗、季猴。
- 日九星。
- 十二地支对应时飞星。
- 岁破、月破、大偷休、小偷休等择日提示。

Node 后端会清理纯横线分隔符，再返回前端。

### `bazi-master/ganzhi.py`

干支、十神、地支关系和大量命理基础数据。

包含：

- 天干地支枚举。
- 天干合冲。
- 地支冲、刑、害、破、合、会、六合、暗合。
- 纳音。
- 十二长生。
- 神煞、桃花、驿马等基础数据。
- 根据干支查询年份等辅助函数。

这是 `bazi.py`、`luohou.py`、`shengxiao.py` 等脚本的重要数据源。

### `bazi-master/datas.py`

命理资料数据表。

包含：

- 十二建除。
- 日柱解释。
- 禄、贵人、神煞。
- 调候、金不换大运等文字。
- 生肖与地支映射。
- 大量用于排盘输出的文本素材。

### `bazi-master/common.py`

八字通用辅助函数。

包含：

- 天干合冲检查。
- 阴阳判断。
- 空亡计算。
- 地支藏干细节。
- 三合拱等关系检查。

### `bazi-master/convert.py`

干支转换类小工具。接收天干、地支参数，用于转换或辅助查询。

### `bazi-master/sizi.py`

四字/四柱相关辅助数据或逻辑文件，被八字分析脚本引用。

### `bazi-master/yue.py`

月令、月份相关命理数据或逻辑文件，被八字分析脚本引用。

### `bazi-master/README.md`

原 `bazi-master` 项目的说明文档。

内容包括：

- 八字排盘功能简介。
- 罗喉日时功能简介。
- 生肖合婚功能简介。
- Python 依赖安装方式。
- 命令行使用示例。
- 原作者的资料链接和说明。

### `bazi-master/books/`

命理书籍 Markdown 资料目录。

当前文件：

- `zipingzhenquan.md`
- `zipingzhenquanjizhu.md`
- `穷通宝鉴.md`

这些是命理文本资料，不是 Web 应用直接调用的 API。

### `bazi-master/examples/`

八字案例 Markdown。

当前文件：

- `examples.md`
- `cai.md`
- `guan.md`
- `pianguan.md`
- `shangguan.md`

用于保存不同格局或案例说明。

### `bazi-master/.gitignore`

`bazi-master` 子目录自己的忽略规则。

### `bazi-master/.venv/`

本地 Python 虚拟环境目录。一般不应该提交，也不需要在文档中依赖它。

### `bazi-master/__pycache__/`

Python 运行后生成的缓存目录。一般不应该提交。

## 13. `knowledge/` 周易知识库

`knowledge/` 是 VitePress 文档源码，也是后端起卦解读的本地知识来源。

### `knowledge/zhouyi.md`

完整《周易》内容汇总 Markdown。`md-slicer.js` 可从它拆分出 64 个单卦文件。

### `knowledge/zhouyi_1.md` 到 `knowledge/zhouyi_64.md`

六十四卦单卦 Markdown 文件。

后端启动时会逐个读取这些文件：

```text
knowledge/zhouyi_1.md
...
knowledge/zhouyi_64.md
```

每个文件第一行标题会被解析为卦名，全文会作为 AI 解卦 Prompt 的知识内容。

### `knowledge/what.md`

《周易》是什么的说明文章。主要用于 VitePress 文档站。

## 14. `.vitepress/` 文档站配置

### `.vitepress/config.mts`

VitePress 配置文件。

主要内容：

- 站点标题：`周易`。
- 描述：`周易`。
- `base`：`/thebookofchanges/`。
- 输出目录：`docs`。
- 导航：首页、阅读。
- 侧边栏：自动生成《周易》是什么和 64 卦目录。
- Logo：`/yi.svg`。
- GitHub 链接：指向原始项目地址。

### `.vitepress/theme/index.ts`

自定义主题入口。继承 VitePress 默认主题，并使用 `MyLayout.vue` 覆盖布局。

### `.vitepress/theme/MyLayout.vue`

自定义 VitePress Layout。主要在 `home-hero-image` 插槽中注入 `yi.svg`。

### `.vitepress/theme/style.css`

VitePress 主题变量和首页视觉样式。

## 15. `docs/` 静态文档输出

`docs/` 是 VitePress 构建后的静态站点目录，不是手写业务源码。

主要内容：

- `docs/index.html`：文档站首页。
- `docs/what.html`：说明页构建结果。
- `docs/zhouyi.html`：周易汇总页构建结果。
- `docs/zhouyi_1.html` 到 `docs/zhouyi_64.html`：64 卦页面构建结果。
- `docs/404.html`：静态站 404 页面。
- `docs/hashmap.json`：VitePress 构建辅助文件。
- `docs/yi.svg`：文档站 Logo。
- `docs/assets/`：VitePress 生成的 JS、CSS、字体和页面资源，文件名带 hash。
- `docs/assets/chunks/`：VitePress 代码分块资源。

`docs/assets/` 下文件数量很多，通常不需要手工编辑。如果修改了 `knowledge/` 或 `.vitepress/`，应重新运行 `npm run docs:build` 生成。

## 16. `test/` 测试文件

项目使用 Node 内置测试框架。

### `test/bazi-service.test.js`

测试八字服务封装。

覆盖：

- 公历女命参数组装。
- 农历闰月输入标准化。
- 无效出生时辰校验。
- Python 输出清理 ANSI 控制字符。
- 四柱反推参数组装。
- 四柱默认年份范围。
- 无效四柱校验。
- 四柱反推输出清理。
- 八字 AI Prompt 生成。
- 空排盘文本拒绝调用 AI。
- 超长排盘文本截断到 12000 字。

### `test/shengxiao-service.test.js`

测试生肖服务封装。

覆盖：

- 生肖参数组装。
- 生肖输入标准化。
- 非法生肖拒绝。
- Python 输出清理。
- 去除技术支持文案。
- 去除 `====` 分隔线。

### `test/luohou-service.test.js`

测试罗喉服务封装。

覆盖：

- 日期和天数参数组装。
- 日期输入标准化。
- 无效日期拒绝。
- 查询天数上限拒绝。
- Python 输出清理。
- 去除 `----` 分隔线。
- 罗喉 AI Prompt 生成。
- 空择日文本拒绝调用 AI。

### `test/home-entry.test.js`

测试前端静态结构。

覆盖：

- 首页是否有四个入口。
- 八字页面是否有四柱反推。
- 罗喉页面是否有右侧说明区。
- 罗喉页面是否有大白话解读按钮。
- 前端 JS 是否绑定各页面导航。
- 前端是否调用 `/api/bazi/reverse` 和 `/api/luohou/interpret`。

## 17. 文件职责速查表

| 路径 | 类型 | 作用 |
| --- | --- | --- |
| `server.js` | 后端入口 | Express 服务、API、AI 流式解读、SQLite |
| `public/index.html` | 前端页面 | 单页应用 DOM 结构 |
| `public/app.js` | 前端逻辑 | 页面切换、请求 API、渲染结果、SSE 打字机 |
| `public/style.css` | 前端样式 | 主视觉、表单、按钮、结果区、响应式 |
| `public/yarrow.js` | 前端逻辑 | 蓍草 Canvas 动画和六爻状态机 |
| `public/yarrow.css` | 前端样式 | 蓍草高级模式样式 |
| `public/yi.svg` | 图片资源 | Logo |
| `lib/bazi-service.js` | 后端服务 | 八字排盘、四柱反推、八字 AI Prompt |
| `lib/shengxiao-service.js` | 后端服务 | 生肖合婚脚本调用和输出清理 |
| `lib/luohou-service.js` | 后端服务 | 罗喉择日脚本调用和 AI Prompt |
| `bazi-master/bazi.py` | Python | 八字排盘和四柱反推 |
| `bazi-master/shengxiao.py` | Python | 生肖合婚 |
| `bazi-master/luohou.py` | Python | 罗喉日时和择日辅助 |
| `bazi-master/ganzhi.py` | Python 数据 | 干支、十神、刑冲合害等基础表 |
| `bazi-master/datas.py` | Python 数据 | 命理文本、生肖映射、调候等资料 |
| `bazi-master/common.py` | Python 工具 | 八字通用计算辅助 |
| `bazi-master/convert.py` | Python 工具 | 干支转换辅助 |
| `bazi-master/sizi.py` | Python 辅助 | 四柱相关辅助 |
| `bazi-master/yue.py` | Python 辅助 | 月令相关辅助 |
| `knowledge/zhouyi_*.md` | 内容 | 64 卦知识库 |
| `knowledge/zhouyi.md` | 内容 | 周易汇总原文 |
| `knowledge/what.md` | 内容 | 周易介绍 |
| `.vitepress/config.mts` | 文档配置 | VitePress 站点配置 |
| `.vitepress/theme/*` | 文档主题 | VitePress 自定义主题 |
| `docs/` | 构建产物 | VitePress 静态站输出 |
| `test/*.test.js` | 测试 | 服务封装和前端结构测试 |
| `package.json` | 配置 | Node 依赖和脚本 |
| `requirements.txt` | 配置 | Python 依赖 |
| `Dockerfile` | 部署 | Docker 镜像构建 |
| `.dockerignore` | 部署 | Docker 构建忽略规则 |
| `.gitignore` | Git | Git 忽略规则 |
| `database.sqlite` | 数据 | 本地占卜历史数据库 |
| `.env` | 配置 | 本地 API Key 等私密环境变量 |
| `md-slicer.js` | 工具 | 拆分周易 Markdown |
| `PROJECT_INTRODUCTION.md` | 文档 | 旧版项目介绍 |
| `PROJECT_FUNCTIONS_AND_FILES.md` | 文档 | 当前完整功能与文件说明 |

## 18. 当前功能完成度

已经接入并可从页面访问：

- 周易占事。
- 快速起卦。
- 蓍草起卦。
- 周易 AI 古韵解析。
- 周易 AI 大白话解释。
- 保存周易占事历史到 SQLite。
- 八字排盘。
- 八字 AI 大白话解释。
- 四柱反推可能出生时间。
- 生肖合婚。
- 罗喉择日。
- 罗喉 AI 大白话解释。
- VitePress 周易文档站。
- Docker 部署基础文件。
- Node 自动化测试。

## 19. 注意事项

- AI 功能依赖 `DASHSCOPE_API_KEY`，没有 Key 时排盘类本地功能可以工作，但 AI 解读会失败。
- 八字、生肖、罗喉功能依赖 Python 和 `requirements.txt` 中的依赖。
- `database.sqlite` 是本地运行数据，不建议提交。
- `.env` 是私密配置，不建议提交。
- `docs/` 是构建产物，修改文档源码后需要重新构建。
- `node_modules/`、`.venv/`、`__pycache__/` 都属于本地依赖或缓存，不应该手工维护。
- 命理、周易和择日结果都应作为传统文化参考，不能替代医疗、法律、投资、婚姻等现实决策。
