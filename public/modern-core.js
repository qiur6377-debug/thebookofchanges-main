(function attachModernCore(root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.XinanModernCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function createModernCore() {
    const BLOCKED_ANALYTICS_KEYS = new Set(['question', 'content', 'text', 'message', 'email', 'phone', 'name', 'token', 'key', 'password', 'secret']);
    const SAFE_ANALYTICS_KEYS = new Set(['questionLength', 'questionlength', 'previousQuestionLength', 'previousquestionlength', 'questionSource', 'questionsource']);
    const SHORT_INTENT_PATTERN = /(辞职|离职|跳槽|分手|复合|表白|联系|合作|接offer|offer|转行|搬家|创业|发视频|投稿|报价|续约|面试|接不接|去不去|买不买|卖不卖|要不要|上班|投流|发布|停滞)/;
    const WEAK_JUDGMENT_PATTERN = /(这一卦|本卦|变卦|之卦|卦象|动爻|爻|说明|显示|阶段|状态|第[一二三四五六七八九十百零〇0-9]+卦)/;
    const UNSTATED_FACT_TERMS = [
        '拉人', '找人', '招人', '组队', '团队', '合伙', '合伙人', '合作方',
        '投资', '融资', '投流', '广告', '涨粉', '粉丝', '客户', '甲方',
        '对象', '前任', '伴侣', '领导', '同事',
    ];

    function sanitizeAnalyticsPayload(payload = {}) {
        const safePayload = {};
        Object.entries(payload).slice(0, 18).forEach(([key, value]) => {
            if (!/^[a-zA-Z0-9_]+$/.test(key)) return;
            const normalizedKey = key.toLowerCase();
            if (SAFE_ANALYTICS_KEYS.has(key) || SAFE_ANALYTICS_KEYS.has(normalizedKey)) {
                if (typeof value === 'string') {
                    safePayload[key] = value.slice(0, 80);
                    return;
                }
                if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
                    safePayload[key] = value;
                    return;
                }
            }
            if (BLOCKED_ANALYTICS_KEYS.has(normalizedKey)
                || normalizedKey.includes('question')
                || normalizedKey.includes('content')
                || normalizedKey.includes('token')
                || normalizedKey.includes('secret')
                || normalizedKey.includes('password')) return;
            if (typeof value === 'string') {
                safePayload[key] = value.slice(0, 80);
                return;
            }
            if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
                safePayload[key] = value;
            }
        });
        return safePayload;
    }

    function analyzeQuestionDraft(text) {
        const normalized = String(text || '').trim();
        const hasShortIntent = SHORT_INTENT_PATTERN.test(normalized);
        const hasEvent = normalized.length >= 12 || (normalized.length >= 4 && hasShortIntent);
        const hasWorry = /(担心|害怕|怕|焦虑|纠结|放不下|犹豫|后悔|更累|卡住|卡在)/.test(normalized);
        const hasDirection = /(要不要|该不该|会不会|能不能|适不适合|怎么办|怎么做|怎么样|往哪边|继续|放弃|主动|等待|推进|先稳)/.test(normalized);
        const maybeMultiple = /(还有|另外|同时|顺便|以及|和.*一起|，.*，.*，)/.test(normalized) && normalized.length > 42;
        return { hasEvent, hasShortIntent, hasWorry, hasDirection, maybeMultiple };
    }

    function compactText(text, maxLength = 56) {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        if (normalized.length <= maxLength) return normalized;
        return `${normalized.slice(0, maxLength - 1)}…`;
    }

    function stripChangedTitleFromQuestion(text) {
        return String(text || '')
            .replace(/^关于刚才这件事[:：]\s*/, '')
            .replace(/[，,]\s*变卦是「[^」]+」/g, '')
            .replace(/变卦是「[^」]+」[。.]?/g, '')
            .replace(/[。.]?(这个变化对我意味着什么|我现在该顺着这个变化继续推进，还是先别动|接下来我最该注意什么)[？?]?$/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function extractConflictTag(question) {
        const normalized = stripChangedTitleFromQuestion(question);
        if (!normalized) return '眼前的选择';
        const directPatterns = [
            /(要不要[^，。！？!?；;\n]{1,12})/,
            /(该不该[^，。！？!?；;\n]{1,12})/,
            /(会不会[^，。！？!?；;\n]{1,12})/,
            /(能不能[^，。！？!?；;\n]{1,12})/,
            /(适不适合[^，。！？!?；;\n]{1,12})/,
        ];
        for (const pattern of directPatterns) {
            const match = normalized.match(pattern);
            if (match) return compactText(match[1], 18);
        }
        const versusPatterns = [
            ['接', '不接'], ['等', '不等'], ['去', '不去'], ['留', '不留'],
            ['主动', '等待'], ['继续', '放下'], ['推进', '先稳'], ['辞职', '留下'], ['复合', '放下'],
        ];
        for (const [left, right] of versusPatterns) {
            if (normalized.includes(left) && normalized.includes(right)) return `${left}还是${right}`;
        }
        if (/(工作|上班|离职|辞职|offer|跳槽|面试|项目|视频|账号|流量)/.test(normalized)) return '工作里的选择';
        if (/(感情|对象|他|她|分手|复合|表白|关系|主动|联系|暧昧)/.test(normalized)) return '关系里的拉扯';
        if (/(合作|钱|投资|报价|续约|合伙|买|卖)/.test(normalized)) return '合作里的取舍';
        return '眼前的选择';
    }

    function pickContextualFallback(fallbacks, seed = '') {
        if (!fallbacks.length) return '先别急着定，这件事还要再看清一点。';
        const normalized = String(seed || '');
        const score = Array.from(normalized).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return fallbacks[score % fallbacks.length];
    }

    function addsUnstatedConcreteFact(text, questionText = '') {
        const candidate = String(text || '');
        const source = String(questionText || '');
        return UNSTATED_FACT_TERMS.some(term => candidate.includes(term) && !source.includes(term));
    }

    function isUsableJudgmentCandidate(text, questionText = '') {
        const candidate = String(text || '').trim();
        if (!candidate) return false;
        if (candidate.length < 6) return false;
        if (candidate.length > 52) return false;
        if (/[：:]\s*$/.test(candidate)) return false;
        if (/[，、（(]\s*$/.test(candidate)) return false;
        if (WEAK_JUDGMENT_PATTERN.test(candidate)) return false;
        if (addsUnstatedConcreteFact(candidate, questionText)) return false;
        if (/(你现在卡在哪里|这件事的势头|你最该注意|现在可以先怎样看|你可以怎么做|给你一句话)/.test(candidate)) {
            return false;
        }
        return true;
    }

    function getContextualFallbackJudgment(question) {
        const normalized = String(question || '');
        if (/(工作|上班|离职|辞职|offer|跳槽|面试|领导|同事|招聘|项目|视频|账号|流量|爆)/.test(normalized)) {
            return pickContextualFallback([
                '先别急着接招，先看清边界。',
                '这不是能力不够，是节奏还没对齐。',
                '先稳住自己的位置，再决定要不要往前。',
            ], normalized);
        }
        if (/(感情|对象|他|她|分手|复合|表白|关系|主动|联系|暧昧|伴侣|朋友)/.test(normalized)) {
            return pickContextualFallback([
                '别急着证明关系，先看清回应。',
                '先把自己放稳，再看对方有没有接住你。',
                '关系不是靠用力撑住的，先看它有没有回应。',
            ], normalized);
        }
        if (/(合作|钱|投资|报价|续约|合伙|买|卖|合同)/.test(normalized)) {
            return pickContextualFallback([
                '先把条件说清，再决定要不要往前。',
                '这件事可以谈，但边界要先落下来。',
                '别先替对方让步，先把自己的底线说清。',
            ], normalized);
        }
        if (/(要不要|该不该|选|接不接|去不去|买不买|卖不卖|留不留)/.test(normalized)) {
            return pickContextualFallback([
                '现在不是没答案，是选项还没摆清。',
                '先别急着选，先看哪条路更消耗你。',
                '答案还没落地，先把代价看明白。',
            ], normalized);
        }
        return pickContextualFallback([
            '先别急着定，这件事还要再看清一点。',
            '你不用马上有答案，先把局面看清。',
            '先稳住心，再看下一步该往哪走。',
        ], normalized);
    }

    return {
        BLOCKED_ANALYTICS_KEYS,
        SAFE_ANALYTICS_KEYS,
        SHORT_INTENT_PATTERN,
        WEAK_JUDGMENT_PATTERN,
        UNSTATED_FACT_TERMS,
        sanitizeAnalyticsPayload,
        analyzeQuestionDraft,
        compactText,
        stripChangedTitleFromQuestion,
        extractConflictTag,
        pickContextualFallback,
        addsUnstatedConcreteFact,
        isUsableJudgmentCandidate,
        getContextualFallbackJudgment,
    };
}));
