document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const enterBtn = document.getElementById('modern-enter-btn');
    const composerSection = document.getElementById('modern-composer-section');
    const questionInput = document.getElementById('modern-question');
    const submitBtn = document.getElementById('modern-submit');
    const resetBtn = document.getElementById('modern-reset');
    const rephraseBtn = document.getElementById('modern-rephrase');
    const shareBtn = document.getElementById('modern-share');
    const messageEl = document.getElementById('modern-message');
    const resultShell = document.getElementById('modern-result-shell');
    const statusPill = document.getElementById('modern-status-pill');
    const questionEcho = document.getElementById('modern-question-echo');
    const judgmentCard = document.querySelector('.modern-judgment-card');
    const judgmentContent = document.getElementById('modern-judgment-content');
    const judgmentSupport = document.getElementById('modern-judgment-support');
    const judgmentProgress = document.getElementById('modern-judgment-progress');
    const judgmentSteps = document.querySelectorAll('.modern-judgment-step');
    const hexagramTitle = document.getElementById('modern-hexagram-title');
    const hexagramLines = document.getElementById('modern-hexagram-lines');
    const changingWarning = document.getElementById('modern-changing-warning');
    const changedShell = document.getElementById('modern-changed-shell');
    const changedSummary = document.getElementById('modern-changed-summary');
    const changedSummaryTitle = changedSummary.querySelector('.modern-changed-summary-title');
    const changedSummaryHint = changedSummary.querySelector('.modern-changed-summary-hint');
    const changedTitle = document.getElementById('modern-changed-title');
    const changedLines = document.getElementById('modern-changed-lines');
    const changedFollowupCopy = document.getElementById('modern-changed-followup-copy');
    const changedFollowupButtons = document.querySelectorAll('.modern-changed-followup-btn');
    const currentExplanation = document.getElementById('modern-current-explanation');
    const changingExplanation = document.getElementById('modern-changing-explanation');
    const futureExplanation = document.getElementById('modern-future-explanation');
    const emotionContent = document.getElementById('modern-interpretation-emotion');
    const mainContent = document.getElementById('modern-interpretation-main');
    const shareCard = document.getElementById('modern-share-card');
    const shareContext = document.getElementById('modern-share-context');
    const shareJudgment = document.getElementById('modern-share-judgment');
    const shareQuote = document.getElementById('modern-share-quote');
    const promptChips = document.querySelectorAll('.modern-chip');
    const questionGuide = document.getElementById('modern-question-guide');
    const questionCoach = document.getElementById('modern-question-coach');
    const questionCoachStatus = document.getElementById('modern-question-coach-status');
    const questionCoachHeardEvent = document.getElementById('modern-coach-heard-event');
    const questionCoachHeardWorry = document.getElementById('modern-coach-heard-worry');
    const questionCoachHeardDirection = document.getElementById('modern-coach-heard-direction');
    const questionCoachSuggested = document.getElementById('modern-coach-suggested-question');
    const questionCoachPills = document.querySelectorAll('.modern-coach-pill');
    const questionHelper = document.getElementById('modern-question-helper');
    const helperTemplates = document.querySelectorAll('.modern-helper-template');
    const followupButtons = document.querySelectorAll('.modern-followup-btn');
    const followupComposer = document.getElementById('modern-followup-composer');
    const followupQuestion = document.getElementById('modern-followup-question');
    const followupConfirm = document.getElementById('modern-followup-confirm');
    const followupCancel = document.getElementById('modern-followup-cancel');
    const authModal = document.getElementById('modern-auth-modal');
    const authCloseButtons = document.querySelectorAll('[data-auth-close]');
    const wechatLoginBtn = document.getElementById('modern-wechat-login');
    const phoneInput = document.getElementById('modern-phone-input');
    const sendCodeBtn = document.getElementById('modern-send-code');
    const codeInput = document.getElementById('modern-code-input');
    const verifyCodeBtn = document.getElementById('modern-verify-code');
    const authMessage = document.getElementById('modern-auth-message');
    const recentQuestions = document.getElementById('modern-recent-questions');
    const recentEmpty = document.getElementById('modern-recent-empty');
    const recentList = document.getElementById('modern-recent-list');
    const recentClearBtn = document.getElementById('modern-recent-clear');
    const RECENT_QUESTION_KEY = 'xinan_recent_questions';
    const RECENT_QUESTION_LIMIT = 3;
    const GUEST_ID_KEY = 'xinan_guest_id';
    const GUEST_QUESTION_USED_KEY = 'xinan_guest_question_used';
    const AUTH_GATE_ENABLED = false;
    const BLOCKED_ANALYTICS_KEYS = new Set(['question', 'content', 'text', 'message', 'email', 'phone', 'name', 'token', 'key', 'password', 'secret']);
    const SHORT_INTENT_PATTERN = /(辞职|离职|跳槽|分手|复合|表白|联系|合作|接offer|offer|转行|搬家|创业|发视频|投稿|报价|续约|面试|接不接|去不去|买不买|卖不卖|要不要)/;
    const WEAK_JUDGMENT_PATTERN = /(这一卦|本卦|变卦|之卦|卦象|动爻|爻|说明|显示|阶段|状态|第[一二三四五六七八九十百零〇0-9]+卦)/;

    const state = {
        question: '',
        hexagramNumber: null,
        changingPositions: [],
        changedHexagramNumber: null,
        yaoDescriptions: [],
        questionSource: 'manual',
        hasTrackedQuestionStart: false,
        hasTrackedDraftStart: false,
        isSubmitting: false,
        activeRequestId: null,
        activeController: null,
        interpretationComplete: false,
        auth: {
            user: null,
            guestQuestionUsed: false,
        },
        pendingFollowup: null,
    };
    let pendingAuthAction = null;

    function getAnalyticsSessionId() {
        const key = 'xinan_analytics_session_id';
        try {
            const existing = window.localStorage.getItem(key);
            if (existing) return existing;
            const next = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            window.localStorage.setItem(key, next);
            return next;
        } catch (error) {
            return 'session-unavailable';
        }
    }

    function sanitizeAnalyticsPayload(payload = {}) {
        const safePayload = {};
        Object.entries(payload).slice(0, 18).forEach(([key, value]) => {
            if (!/^[a-zA-Z0-9_]+$/.test(key)) return;
            const normalizedKey = key.toLowerCase();
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

    function trackEvent(eventName, payload = {}) {
        if (!eventName) return;
        const eventBody = JSON.stringify({
            event: eventName,
            payload: sanitizeAnalyticsPayload(payload),
            sessionId: getAnalyticsSessionId(),
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
            viewportWidth: window.innerWidth,
        });

        try {
            if (navigator.sendBeacon) {
                const blob = new Blob([eventBody], { type: 'application/json' });
                navigator.sendBeacon('/api/track', blob);
                return;
            }

            fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: eventBody,
                keepalive: true,
            }).catch(() => {});
        } catch (error) {
            // 埋点失败不能打断用户问卦。
        }
    }

    function getGuestId() {
        try {
            const existing = window.localStorage.getItem(GUEST_ID_KEY);
            if (existing) return existing;
            const next = window.crypto?.randomUUID
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
            window.localStorage.setItem(GUEST_ID_KEY, next);
            return next;
        } catch (error) {
            return getAnalyticsSessionId();
        }
    }

    function getGuestQuestionUsed() {
        if (state.auth.user) return false;
        if (state.auth.guestQuestionUsed) return true;
        try {
            return window.localStorage.getItem(GUEST_QUESTION_USED_KEY) === 'true';
        } catch (error) {
            return false;
        }
    }

    function markGuestQuestionUsed() {
        if (state.auth.user) return;
        state.auth.guestQuestionUsed = true;
        try {
            window.localStorage.setItem(GUEST_QUESTION_USED_KEY, 'true');
        } catch (error) {
            // 本地存储失败不影响后端登录门槛。
        }
    }

    async function loadAuthState() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'X-Guest-Id': getGuestId() },
            });
            if (!response.ok) return;
            const data = await response.json();
            state.auth.user = data.user || null;
            state.auth.guestQuestionUsed = Boolean(data.guest?.questionUsed);
            if (state.auth.guestQuestionUsed) {
                try {
                    window.localStorage.setItem(GUEST_QUESTION_USED_KEY, 'true');
                } catch (error) {}
            }
        } catch (error) {
            // 登录态读取失败时，让后端在提交时兜底判断。
        }
    }

    function setAuthMessage(message = '', stateName = 'info') {
        if (!authMessage) return;
        authMessage.textContent = message;
        authMessage.dataset.state = stateName;
    }

    function showAuthModal(nextAction = null) {
        pendingAuthAction = typeof nextAction === 'function' ? nextAction : null;
        if (!authModal) return;
        authModal.hidden = false;
        setAuthMessage('登录后就可以继续追问刚才这件事。');
        trackEvent('auth_modal_show', {
            guestQuestionUsed: getGuestQuestionUsed(),
        });
        window.setTimeout(() => {
            phoneInput?.focus();
        }, 80);
    }

    function hideAuthModal() {
        if (authModal) authModal.hidden = true;
        setAuthMessage('');
    }

    function completeAuth(user) {
        state.auth.user = user || { nickname: '已登录用户' };
        state.auth.guestQuestionUsed = false;
        try {
            window.localStorage.removeItem(GUEST_QUESTION_USED_KEY);
        } catch (error) {}
        hideAuthModal();
        trackEvent('auth_success');
        const action = pendingAuthAction;
        pendingAuthAction = null;
        if (action) window.setTimeout(action, 80);
    }

    function requireLoginForContinuation(nextAction) {
        if (!AUTH_GATE_ENABLED) return true;
        if (state.auth.user || !getGuestQuestionUsed()) return true;
        showAuthModal(nextAction);
        return false;
    }

    async function requestPhoneCode() {
        const phone = phoneInput?.value.trim() || '';
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            setAuthMessage('先填一个正确的手机号。', 'error');
            return;
        }
        sendCodeBtn.disabled = true;
        const originalText = sendCodeBtn.textContent;
        sendCodeBtn.textContent = '发送中...';
        try {
            const response = await fetch('/api/auth/phone/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Guest-Id': getGuestId() },
                body: JSON.stringify({ phone }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '验证码发送失败');
            setAuthMessage(data.message || '验证码已发送，请注意查收。');
            if (data.devCode && codeInput) codeInput.value = data.devCode;
            codeInput?.focus();
            trackEvent('auth_phone_code_sent');
        } catch (error) {
            setAuthMessage(error.message || '验证码发送失败，请稍后再试。', 'error');
            trackEvent('auth_phone_code_error', { errorCode: error?.name || 'unknown_error' });
        } finally {
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = originalText;
        }
    }

    async function verifyPhoneCode() {
        const phone = phoneInput?.value.trim() || '';
        const code = codeInput?.value.trim() || '';
        if (!/^1[3-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(code)) {
            setAuthMessage('手机号或验证码格式不对。', 'error');
            return;
        }
        verifyCodeBtn.disabled = true;
        const originalText = verifyCodeBtn.textContent;
        verifyCodeBtn.textContent = '登录中...';
        try {
            const response = await fetch('/api/auth/phone/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Guest-Id': getGuestId() },
                body: JSON.stringify({ phone, code }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '登录失败');
            completeAuth(data.user);
        } catch (error) {
            setAuthMessage(error.message || '登录失败，请稍后再试。', 'error');
            trackEvent('auth_phone_verify_error', { errorCode: error?.name || 'unknown_error' });
        } finally {
            verifyCodeBtn.disabled = false;
            verifyCodeBtn.textContent = originalText;
        }
    }

    async function startWechatLogin() {
        trackEvent('auth_wechat_click');
        setAuthMessage('正在准备微信登录...');
        try {
            const response = await fetch('/api/auth/wechat/start?mode=json', {
                headers: { Accept: 'application/json', 'X-Guest-Id': getGuestId() },
            });
            const data = await response.json();
            if (!response.ok || !data.url) throw new Error(data.error || '微信登录暂时不可用');
            window.location.href = data.url;
        } catch (error) {
            setAuthMessage(error.message || '微信登录暂时不可用，请先用手机号登录。', 'error');
            trackEvent('auth_wechat_error', { errorCode: error?.name || 'unknown_error' });
        }
    }

    function setMessage(message = '') {
        messageEl.textContent = message;
    }

    /* 维度十：状态胶囊切换动画 — 淡出旧文字、淡入新文字 */
    function setStatus(text) {
        if (statusPill.textContent === text) return;
        statusPill.classList.add('is-transitioning');
        setTimeout(() => {
            statusPill.textContent = text;
            statusPill.classList.remove('is-transitioning');
        }, 300);
    }

    function setSubmitState(text, disabled, options = {}) {
        submitBtn.textContent = text;
        submitBtn.disabled = disabled;
        const isLoading = Boolean(options.loading || (disabled && /^正在/.test(text)));
        submitBtn.classList.toggle('is-loading', isLoading);
        if (isLoading) {
            submitBtn.dataset.loadingLabel = text;
        } else {
            delete submitBtn.dataset.loadingLabel;
        }
    }

    function setResultActionsEnabled(enabled) {
        [shareBtn, rephraseBtn, resetBtn].forEach((button) => {
            if (button) button.disabled = !enabled;
        });
    }

    function createRequestId() {
        return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
    }

    function isActiveRequest(requestId) {
        return state.activeRequestId === requestId;
    }

    function abortActiveRequest() {
        if (state.activeController) {
            state.activeController.abort();
        }
        state.activeController = null;
        state.activeRequestId = null;
        state.isSubmitting = false;
    }

    let judgmentFinished = false;
    let judgmentTimer = null;
    const JUDGMENT_STEP_ORDER = ['cast', 'translate', 'settle'];

    function setJudgmentProgressState(activeStep = 'cast') {
        const activeIndex = Math.max(0, JUDGMENT_STEP_ORDER.indexOf(activeStep));
        judgmentSteps.forEach((step) => {
            const stepName = step.dataset.judgmentStep;
            const stepIndex = Math.max(0, JUDGMENT_STEP_ORDER.indexOf(stepName));
            step.classList.toggle('is-done', stepIndex < activeIndex);
            step.classList.toggle('is-active', stepIndex === activeIndex);
        });
    }

    function showJudgmentProgress(step = 'cast', text = '') {
        if (judgmentTimer) clearInterval(judgmentTimer);
        judgmentTimer = null;
        judgmentFinished = false;
        currentJudgmentTarget = '';
        judgmentCard?.classList.add('is-resolving');
        judgmentCard?.classList.remove('is-resolved');
        if (judgmentProgress) judgmentProgress.hidden = false;
        setJudgmentProgressState(step);
        judgmentContent.classList.add('is-pending');
        judgmentContent.textContent = text || '正在看清这件事的形、势和变化点。';
        if (judgmentSupport) {
            judgmentSupport.hidden = true;
            judgmentSupport.textContent = '';
        }
    }

    function showFinalJudgment(text = '', supportText = '', options = {}) {
        if (judgmentFinished && options.source !== 'force') return;

        const cleanText = (text || '').replace(/\[[^\]]+\]/g, '').trim();
        if (!cleanText) return;

        // 如果目标文字没有变化，并且非强制刷新，则不要打断正在进行的打字动画或已完成的状态
        if (cleanText === currentJudgmentTarget && options.source !== 'force') {
            return;
        }

        currentJudgmentTarget = cleanText;

        if (judgmentTimer) {
            clearInterval(judgmentTimer);
            judgmentTimer = null;
        }

        judgmentCard?.classList.remove('is-resolving');
        judgmentCard?.classList.add('is-resolved');
        if (judgmentProgress) judgmentProgress.hidden = true;
        judgmentContent.classList.remove('is-pending');
        judgmentContent.textContent = '';
        judgmentFinished = false;

        const cleanSupport = (supportText || '').replace(/\[[^\]]+\]/g, '').trim();
        if (judgmentSupport) {
            judgmentSupport.hidden = true;
            judgmentSupport.textContent = '';
            judgmentSupport.style.opacity = '';
            judgmentSupport.style.transition = '';
        }

        let currentIdx = 0;
        judgmentTimer = setInterval(() => {
            if (currentIdx >= cleanText.length) {
                clearInterval(judgmentTimer);
                judgmentTimer = null;
                judgmentFinished = true;
                if (judgmentSupport && cleanSupport) {
                    judgmentSupport.textContent = cleanSupport;
                    judgmentSupport.hidden = false;
                    judgmentSupport.style.opacity = '0';
                    judgmentSupport.style.transition = 'opacity 1s ease';
                    requestAnimationFrame(() => {
                        judgmentSupport.style.opacity = '1';
                    });
                }
                return;
            }
            judgmentContent.textContent += cleanText[currentIdx];
            currentIdx++;
        }, 50);
    }

    function setJudgmentLoadingState(isPending, text = '', supportText = '', options = {}) {
        if (isPending) {
            showJudgmentProgress(options.step || 'cast', text);
            return;
        }
        showFinalJudgment(text, supportText, options);
    }

    function updateQuestionGuide() {
        if (!questionGuide) return;
        const text = questionInput.value.trim();
        const analysis = analyzeQuestionDraft(text);
        const shouldShowCoach = text.length > 0 && (text.length >= 8 || analysis.hasEvent || analysis.hasDirection);
        questionGuide.hidden = text.length === 0;
        if (questionCoach) {
            questionCoach.hidden = !shouldShowCoach;
        }

        if (!text) {
            questionGuide.textContent = '先写这件事本身，再补一句你最担心什么，会更容易解。';
            updateQuestionCoach();
            return;
        }

        if (!analysis.hasEvent) {
            questionGuide.textContent = '可以再写具体一点：这件事是什么、你现在最怕什么。';
            updateQuestionCoach();
            return;
        }

        if (!/(要不要|该不该|会不会|能不能|适不适合|怎么办|怎么做|往哪边|继续|放弃|主动|等待)/.test(text)) {
            questionGuide.textContent = '再补一句你最想知道的方向，比如要不要、该不该、会不会。';
            updateQuestionCoach();
            return;
        }

        if (!/(担心|害怕|怕|纠结|卡|放不下|犹豫|焦虑|更累|后悔)/.test(text)) {
            questionGuide.textContent = '已经能问了。愿意的话，再加一句你最担心什么，会更贴近你。';
            updateQuestionCoach();
            return;
        }

        questionGuide.textContent = '这样问就可以了：具体、只问一件事，也说出了你在意的点。';
        updateQuestionCoach();
    }

    function analyzeQuestionDraft(text) {
        const normalized = String(text || '').trim();
        const hasShortIntent = SHORT_INTENT_PATTERN.test(normalized);
        const hasEvent = normalized.length >= 12 || (normalized.length >= 4 && hasShortIntent);
        const hasWorry = /(担心|害怕|怕|焦虑|纠结|放不下|犹豫|后悔|更累|卡住|卡在)/.test(normalized);
        const hasDirection = /(要不要|该不该|会不会|能不能|适不适合|怎么办|怎么做|往哪边|继续|放弃|主动|等待|推进|先稳)/.test(normalized);
        const maybeMultiple = /(还有|另外|同时|顺便|以及|和.*一起|，.*，.*，)/.test(normalized) && normalized.length > 42;
        return { hasEvent, hasShortIntent, hasWorry, hasDirection, maybeMultiple };
    }

    function stripTrailingPunctuation(text) {
        return String(text || '').trim().replace(/[。！？!?；;，,\s]+$/g, '');
    }

    function normalizeCoachDraft(text) {
        return stripTrailingPunctuation(text)
            .replace(/^关于(?:刚才)?这件事[：:]\s*/u, '')
            .replace(/^我(?:现在)?(?:想问|问的是)[：:]\s*/u, '')
            .replace(/^这件事是[：:]\s*/u, '')
            .trim();
    }

    function extractCoachIssue(text) {
        const normalized = normalizeCoachDraft(text);
        if (!normalized) return '';
        const issue = normalized
            .replace(/[，,。；;]?(?:我)?(?:现在|到底|最近)?(?:应该|该|要不要|该不该|会不会|能不能|适不适合|怎么办|怎么做|往哪边|继续|放弃|主动|等待|推进|先稳)[^。！？!?；;\n]{0,42}$/u, '')
            .replace(/[，,。；;]?(?:我)?(?:最)?(?:想知道|想问|担心|害怕|怕|纠结)[^。！？!?；;\n]{0,42}$/u, '')
            .trim();
        return compactText(issue.length >= 6 ? issue : normalized, 36);
    }

    function inferCoachWorry(text, issue) {
        const normalized = normalizeCoachDraft(text);
        const worryMatch = normalized.match(/(?:担心|害怕|怕|焦虑|纠结|放不下|犹豫|后悔|更累|卡住|卡在)[^。！？!?；;\n]{0,34}/u);
        if (worryMatch) {
            return stripTrailingPunctuation(worryMatch[0].replace(/^(担心|害怕|怕|焦虑|纠结)/u, '')).trim() || '继续下去会更乱';
        }
        if (/(工作|上班|招聘|项目|系统|产品|视频|账号|流量|爆|领导|同事|offer|离职)/u.test(normalized)) {
            return '继续投入也看不见方向';
        }
        if (/(联系|复合|暧昧|感情|关系|对象|他|她|朋友|伴侣)/u.test(normalized)) {
            return '主动了会失衡，不主动又会错过';
        }
        if (/(钱|买|卖|投资|合作|合伙)/u.test(normalized)) {
            return '判断错了会有损失';
        }
        return issue ? '这件事越想越不踏实' : '心里还有一层没说清';
    }

    function buildCoachQuestion(text, mode = 'balanced') {
        const cleanText = normalizeCoachDraft(text);
        if (!cleanText) return '';
        const issue = extractCoachIssue(cleanText);
        const worry = inferCoachWorry(cleanText, issue);
        const topic = issue || cleanText;

        if (mode === 'rewrite') {
            return `关于${topic}，我现在真正卡住的点是什么，接下来该先推进还是先调整？`;
        }

        if (mode === 'specific') {
            return `关于${topic}，我担心${worry}。我现在最该先看清哪一步，才不会越想越乱？`;
        }

        if (mode === 'useSuggestion') {
            return `关于${topic}，我最需要先看清什么，才能决定下一步怎么做？`;
        }

        return `关于${topic}，我现在适合继续推进，还是先稳一下？`;
    }

    function summarizeCoachEvent(text, analysis) {
        if (!text) return '还没写下具体事情';
        return analysis.hasEvent
            ? compactText(stripTrailingPunctuation(text), 42)
            : '现在更像一句心情，还可以补清楚是哪件事';
    }

    function summarizeCoachWorry(text, analysis) {
        if (!text || !analysis.hasWorry) return '还可以补一句你最担心什么';
        const worryMatch = text.match(/(?:担心|害怕|怕|焦虑|纠结|放不下|犹豫|后悔|更累|卡住|卡在)[^。！？!?；;\n]{0,28}/);
        return worryMatch ? compactText(worryMatch[0], 34) : '你已经把担心说出来了';
    }

    function summarizeCoachDirection(text, analysis) {
        if (!text) return '要不要、该不该、会不会、往哪边走';
        if (!analysis.hasDirection) return '还可以补一句你想知道要不要、该不该或会不会什么';
        const directionMatch = text.match(/(?:要不要|该不该|会不会|能不能|适不适合|怎么办|怎么做|往哪边|继续|放弃|主动|等待|推进|先稳)[^。！？!?；;\n]{0,30}/);
        return directionMatch ? compactText(directionMatch[0], 36) : '你已经说出想知道的方向了';
    }

    function updateQuestionCoach() {
        if (!questionCoach || !questionCoachStatus) return;
        const text = questionInput.value.trim();
        const analysis = analyzeQuestionDraft(text);
        const suggestedQuestion = buildCoachQuestion(text, 'useSuggestion');

        if (questionCoachHeardEvent) questionCoachHeardEvent.textContent = summarizeCoachEvent(text, analysis);
        if (questionCoachHeardWorry) questionCoachHeardWorry.textContent = summarizeCoachWorry(text, analysis);
        if (questionCoachHeardDirection) questionCoachHeardDirection.textContent = summarizeCoachDirection(text, analysis);
        if (questionCoachSuggested) {
            questionCoachSuggested.textContent = suggestedQuestion || '等你写下第一句，我会帮你收成一个更好问的问题。';
        }

        if (!text) {
            questionCoachStatus.textContent = '先把事情写出来，我会帮你整理成一句更适合问的话。';
        } else if (!analysis.hasEvent) {
            questionCoachStatus.textContent = '现在还像一句心情，可以先补清楚：到底是哪件事让你卡住。';
        } else if (!analysis.hasWorry) {
            questionCoachStatus.textContent = '我大概听懂这件事了。若再补一句担心，解读会更贴近你。';
        } else if (!analysis.hasDirection) {
            questionCoachStatus.textContent = '已经说到心里那层了，再补一句你最想知道的方向就可以问。';
        } else if (analysis.maybeMultiple) {
            questionCoachStatus.textContent = '信息很完整了，我建议先收成一件最卡的事来问，结果会更清楚。';
        } else {
            questionCoachStatus.textContent = '这个问题已经能问了。你也可以直接用下面这句，更像一次清楚的问卦。';
        }

        questionCoachPills.forEach((button) => {
            const field = button.dataset.coachField;
            button.disabled = field === 'useSuggestion' && !suggestedQuestion;
            button.hidden = false;
        });
    }

    function moveCaretToPromptBlank(promptText) {
        const markerIndex = questionInput.value.lastIndexOf(promptText);
        if (markerIndex === -1) {
            questionInput.setSelectionRange(questionInput.value.length, questionInput.value.length);
            return;
        }
        const caretIndex = markerIndex + promptText.length;
        questionInput.setSelectionRange(caretIndex, caretIndex);
    }

    function markQuestionDraftStarted(source = 'manual') {
        if (state.hasTrackedDraftStart) return;
        state.hasTrackedDraftStart = true;
        state.hasTrackedQuestionStart = true;
        trackEvent('question_draft_started', { draftSource: source });
        trackEvent('question_input_start', { draftSource: source });
    }

    function applyCoachPrompt(field) {
        const text = questionInput.value.trim();
        const additions = {
            rewrite: buildCoachQuestion(text, 'rewrite') || '我现在真正卡住的点是什么，接下来该先推进还是先调整？',
            specific: buildCoachQuestion(text, 'specific') || '这件事是：。我最担心的是：。我想知道接下来该不该继续推进？',
            useSuggestion: buildCoachQuestion(text, 'useSuggestion') || questionCoachSuggested?.textContent || buildCoachQuestion(text, 'balanced'),
        };
        const addition = additions[field] || additions.rewrite;
        const nextValue = ['rewrite', 'specific', 'useSuggestion'].includes(field)
            ? addition
            : (text ? `${text}\n${addition}` : addition);
        questionInput.value = nextValue;
        state.questionSource = 'coach';
        markQuestionDraftStarted('coach');
        updateQuestionGuide();
        questionInput.focus();
        if (nextValue.includes('：。')) {
            moveCaretToPromptBlank('：');
        } else {
            questionInput.setSelectionRange(questionInput.value.length, questionInput.value.length);
        }
        trackEvent('question_coach_click', {
            field,
            questionLength: questionInput.value.trim().length,
        });
    }

    function revealComposer() {
        if (!composerSection.hidden) {
            questionInput.focus();
            return;
        }

        body.classList.add('entered');
        composerSection.hidden = false;
        requestAnimationFrame(() => {
            composerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.setTimeout(() => {
                questionInput.focus();
            }, 360);
        });
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderInlineMarkdown(text) {
        return escapeHtml(text)
            .replace(/\*\*([^*\n][^*]*?)\*\*/g, '<strong>$1</strong>')
            .replace(/(本卦|动爻|之卦)/g, '<span class="zhouyi-term">$1</span>');
    }

    function shouldStickStreamingContent(target) {
        if (!target) return false;
        const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        return distanceFromBottom <= 80;
    }

    function renderStreamingText(target, text, cursorId) {
        if (!target) return;
        const keepViewportPinned = shouldStickStreamingContent(target);
        const html = renderInlineMarkdown(text).replace(/\n/g, '<br>');
        target.innerHTML = `${html}<span class="cursor cursor-blink" id="${cursorId}"></span>`;
        if (keepViewportPinned) {
            target.scrollTop = target.scrollHeight;
        }
    }

    function renderStaticText(target, text) {
        if (!target) return;
        target.innerHTML = renderInlineMarkdown(text).replace(/\n/g, '<br>');
    }

    function readRecentQuestions() {
        try {
            const parsed = JSON.parse(window.localStorage.getItem(RECENT_QUESTION_KEY) || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter(item => item && typeof item.question === 'string')
                .slice(0, RECENT_QUESTION_LIMIT);
        } catch (error) {
            return [];
        }
    }

    function writeRecentQuestions(items) {
        try {
            window.localStorage.setItem(RECENT_QUESTION_KEY, JSON.stringify(items.slice(0, RECENT_QUESTION_LIMIT)));
            return true;
        } catch (error) {
            return false;
        }
    }

    function formatRecentTime(isoTime) {
        const date = new Date(isoTime);
        if (Number.isNaN(date.getTime())) return '刚才';
        const diffMs = Date.now() - date.getTime();
        const minuteMs = 60 * 1000;
        const hourMs = 60 * minuteMs;
        const dayMs = 24 * hourMs;
        if (diffMs < minuteMs) return '刚才';
        if (diffMs < hourMs) return `${Math.floor(diffMs / minuteMs)} 分钟前`;
        if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)} 小时前`;
        return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    }

    function renderRecentQuestions() {
        if (!recentQuestions || !recentList || !recentEmpty) return;
        const items = readRecentQuestions();
        recentList.innerHTML = '';
        recentQuestions.hidden = items.length === 0;
        recentEmpty.hidden = items.length > 0;
        if (recentClearBtn) recentClearBtn.hidden = items.length === 0;

        items.forEach((item, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'modern-recent-item';
            button.dataset.recentIndex = String(index);
            button.dataset.question = item.question;

            const question = document.createElement('span');
            question.className = 'modern-recent-question';
            question.textContent = compactText(item.question, 42);

            const meta = document.createElement('span');
            meta.className = 'modern-recent-meta';
            const changingCopy = item.hasChanging ? '有变化点' : '暂时无动爻';
            meta.textContent = `${formatRecentTime(item.createdAt)} · ${item.landing || '刚才这一卦'} · ${changingCopy}`;

            button.append(question, meta);
            recentList.appendChild(button);
        });
    }

    function clearRecentQuestions() {
        try {
            window.localStorage.removeItem(RECENT_QUESTION_KEY);
        } catch (error) {
            // 清空失败不影响主流程。
        }
        renderRecentQuestions();
        trackEvent('recent_questions_clear');
    }

    function saveRecentQuestion() {
        const cleanQuestion = String(state.question || '').trim();
        if (!cleanQuestion) return;

        const entry = {
            question: compactText(cleanQuestion, 90),
            landing: compactText(String(judgmentContent.textContent || hexagramTitle.textContent || '').trim(), 28),
            createdAt: new Date().toISOString(),
            hasChanging: state.changingPositions.length > 0,
        };
        const existing = readRecentQuestions()
            .filter(item => String(item.question || '').trim() !== cleanQuestion);
        const saved = writeRecentQuestions([entry, ...existing]);
        if (!saved) return;

        renderRecentQuestions();
        trackEvent('recent_question_saved', {
            questionLength: cleanQuestion.length,
            hasChanging: entry.hasChanging,
            recentCount: Math.min(existing.length + 1, RECENT_QUESTION_LIMIT),
        });
    }

    function useRecentQuestion(item, index) {
        if (!item?.question) return;
        revealComposer();
        questionInput.value = item.question;
        state.questionSource = 'recent';
        markQuestionDraftStarted('recent');
        updateQuestionGuide();
        setMessage('已经把这件事放回来了，你可以照原样问，也可以改成今晚更贴近的说法。');
        resultShell.hidden = true;
        changedShell.hidden = true;
        changedShell.open = false;
        changingWarning.hidden = true;
        shareCard.setAttribute('aria-hidden', 'true');
        setResultActionsEnabled(false);
        trackEvent('recent_question_click', {
            recentIndex: index,
            hasChanging: Boolean(item.hasChanging),
        });
        window.setTimeout(() => {
            questionInput.focus();
            questionInput.setSelectionRange(questionInput.value.length, questionInput.value.length);
        }, 280);
    }

    function createLine(isYang, isChanging) {
        const slot = document.createElement('div');
        slot.className = 'modern-line-slot';

        const line = document.createElement('div');
        line.className = `modern-line ${isYang ? 'modern-line-yang' : 'modern-line-yin'}`;
        if (isChanging) line.classList.add('modern-line-changing');
        slot.appendChild(line);
        return slot;
    }

    function renderHexagram(container, yaoLines, changingPositions = []) {
        container.innerHTML = '';
        const changingSet = new Set(changingPositions);
        yaoLines.forEach((yao, index) => {
            container.appendChild(createLine(yao === 1, changingSet.has(index)));
        });
        /* 维度七：先让浏览器渲染 opacity:0 的初始帧，再添加 is-visible 触发过渡动画 */
        requestAnimationFrame(() => {
            container.querySelectorAll('.modern-line-slot').forEach(slot => {
                slot.classList.add('is-visible');
            });
        });
    }

    function scrollToResult() {
        requestAnimationFrame(() => {
            resultShell.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function formatChangingPositions(positions = []) {
        const yaoNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
        return positions.map(index => yaoNames[index]).join('、');
    }

    function updateChangedStory(data = {}) {
        const currentTitle = String(hexagramTitle.textContent || '').trim();
        const futureTitle = String(data.changedTitle !== undefined ? data.changedTitle : changedTitle.textContent || '').trim();
        const positionNames = formatChangingPositions(state.changingPositions);
        currentExplanation.textContent = currentTitle && currentTitle !== '正在为你起卦...'
            ? `${currentTitle}是你现在面对这件事的样子，先看清局面，再决定怎么动。`
            : '本卦会显示这件事眼下的局面。';

        changingExplanation.textContent = positionNames
            ? `${positionNames}在动，说明最不稳定、最容易改向的地方在这里，这也是你最该留神的变化点。`
            : '动爻会告诉你，这件事最不稳定、最容易改向的地方在哪。';

        futureExplanation.textContent = futureTitle
            ? `如果这些变化继续发展，这件事更可能会走向 ${futureTitle} 这条路。`
            : '之卦会显示，如果这些变化继续发展，事情更可能会走成什么样。';

        changedFollowupCopy.textContent = futureTitle
            ? `不用自己查原文。动爻是这件事最容易变化的地方，之卦是在提醒你：如果继续发展，可能会走向「${futureTitle}」这条路。你可以直接追问这一层。`
            : '不用自己查原文。这里的动爻就是这件事最容易变化的地方，你可以直接顺着它继续问。';
    }

    function setChangedSummary(copy, hint) {
        if (changedSummaryTitle) changedSummaryTitle.textContent = copy;
        if (changedSummaryHint) changedSummaryHint.textContent = hint;
    }

    function buildChangedFollowupQuestion(kind) {
        const futureTitle = String(changedTitle.textContent || '').trim();
        const baseQuestion = compactText(state.question || questionInput.value.trim() || '刚才这件事', 46);
        const titlePart = futureTitle ? `，变卦是「${futureTitle}」` : '';
        const templates = {
            meaning: `关于刚才这件事：${baseQuestion}${titlePart}。动爻这个变化点在提醒我看什么？`,
            move: `关于刚才这件事：${baseQuestion}${titlePart}。面对动爻显示的变化点，我现在该顺着变，还是先稳住？`,
            attention: `关于刚才这件事：${baseQuestion}${titlePart}。动爻这个位置最需要我注意什么？`,
        };
        return templates[kind] || templates.meaning;
    }

    function hideFollowupComposer() {
        if (!followupComposer) return;
        followupComposer.hidden = true;
        if (followupQuestion) followupQuestion.value = '';
        state.pendingFollowup = null;
    }

    function showFollowupComposer(question, meta = {}) {
        if (!followupComposer || !followupQuestion) return false;
        state.pendingFollowup = {
            source: meta.source || 'followup',
            kind: meta.kind || 'notice',
        };
        followupQuestion.value = question;
        followupComposer.hidden = false;
        setMessage('我先把这一层整理成一句追问，你可以改一下再继续。');
        followupComposer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
            followupQuestion.focus();
            followupQuestion.setSelectionRange(followupQuestion.value.length, followupQuestion.value.length);
        }, 260);
        trackEvent('followup_composer_show', {
            source: state.pendingFollowup.source,
            kind: state.pendingFollowup.kind,
        });
        return true;
    }

    function confirmFollowupQuestion() {
        if (!followupQuestion) return;
        const nextQuestion = followupQuestion.value.trim();
        if (!nextQuestion) {
            setMessage('这一层想继续看的问题还没写出来。');
            followupQuestion.focus();
            return;
        }
        if (!requireLoginForContinuation(confirmFollowupQuestion)) {
            trackEvent('auth_required', { trigger: 'followup_confirm' });
            return;
        }
        const pending = state.pendingFollowup || { source: 'followup', kind: 'notice' };
        questionInput.value = nextQuestion;
        state.questionSource = pending.source;
        markQuestionDraftStarted(pending.source);
        updateQuestionGuide();
        hideFollowupComposer();
        setMessage('继续沿着这一层看。');
        trackEvent('followup_confirm', {
            source: pending.source,
            kind: pending.kind,
            questionLength: nextQuestion.length,
        });
        startDivination();
    }

    function changedFollowupFlow(kind) {
        if (!requireLoginForContinuation(() => changedFollowupFlow(kind))) {
            trackEvent('auth_required', { trigger: 'changed_followup' });
            return;
        }
        const nextQuestion = buildChangedFollowupQuestion(kind);
        trackEvent('changed_followup_click', {
            kind,
            previousQuestionLength: String(state.question || '').length,
            hexagramNumber: state.hexagramNumber,
            changedHexagramNumber: state.changedHexagramNumber,
            changingCount: state.changingPositions.length,
        });
        showFollowupComposer(nextQuestion, { source: 'changed_followup', kind });
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
            ['接', '不接'],
            ['等', '不等'],
            ['去', '不去'],
            ['留', '不留'],
            ['主动', '等待'],
            ['继续', '放下'],
            ['推进', '先稳'],
            ['辞职', '留下'],
            ['复合', '放下'],
        ];
        for (const [left, right] of versusPatterns) {
            if (normalized.includes(left) && normalized.includes(right)) {
                return `${left}还是${right}`;
            }
        }

        if (/(工作|上班|离职|辞职|offer|跳槽|面试|项目|视频|账号|流量)/.test(normalized)) return '工作里的选择';
        if (/(感情|对象|他|她|分手|复合|表白|关系|主动|联系|暧昧)/.test(normalized)) return '关系里的拉扯';
        if (/(合作|钱|投资|报价|续约|合伙|买|卖)/.test(normalized)) return '合作里的取舍';
        return '眼前的选择';
    }

    function completeShareContext(text, maxLength = 42) {
        const normalized = stripChangedTitleFromQuestion(text);
        if (!normalized) return '关于你现在最放不下的这件事';
        if (normalized.length <= maxLength) return `关于：${normalized}`;

        const sentenceMatch = normalized.match(/^(.{6,42}?[。！？!?])/);
        if (sentenceMatch) return `关于：${sentenceMatch[1].trim()}`;

        const clauseMatch = normalized.match(/^(.{8,34}?[，,；;、])/);
        if (clauseMatch) return `关于：${clauseMatch[1].replace(/[，,；;、]\s*$/, '').trim()}`;

        return '关于：刚才这件让你放不下的事';
    }

    function finishShareQuote(text) {
        const normalized = String(text || '').trim().replace(/[，,；;、]\s*$/g, '');
        if (!normalized) return '';
        return /[。！？!?]$/.test(normalized) ? normalized : `${normalized}。`;
    }

    function isWarmShareQuoteCandidate(text) {
        const candidate = String(text || '').trim();
        if (!candidate) return false;
        if (candidate.length < 16 || candidate.length > 72) return false;
        if (/(第[一二三四五六七八九十百零〇0-9]+卦|本卦|变卦|之卦|动爻|爻|卦象|卦)/.test(candidate)) return false;
        return true;
    }

    function completeShareQuote(text, fallback = '慢一点没关系，先把自己放稳，答案会慢慢清楚。') {
        const normalized = String(text || '')
            .replace(/\[[^\]]+\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (!normalized) return fallback;

        const sentences = normalized.match(/[^。！？!?；;]+[。！？!?；;]?/g) || [];
        const warmSentence = sentences
            .map(sentence => finishShareQuote(sentence))
            .find(sentence => isWarmShareQuoteCandidate(sentence));
        if (warmSentence) return warmSentence;

        const rawClauses = normalized
            .split(/[。！？!?；;，,、]/)
            .map(clause => clause.trim())
            .filter(Boolean);

        const clauses = [];
        for (let index = 0; index < rawClauses.length; index += 1) {
            let clause = rawClauses[index];
            while (clause.length < 24 && rawClauses[index + 1]) {
                index += 1;
                clause = `${clause}，${rawClauses[index]}`;
            }
            if (clause.length >= 16 && clause.length <= 68) {
                clauses.push(clause);
            }
        }

        const gentleClause = clauses.find(clause => !/(第[一二三四五六七八九十百零〇0-9]+卦|本卦|变卦|之卦|动爻|爻|卦象|卦)/.test(clause));
        if (gentleClause) return finishShareQuote(gentleClause);

        const sentenceMatch = normalized.match(/^(.{16,72}?[。！？!?])/);
        if (sentenceMatch) return sentenceMatch[1].trim();

        return fallback;
    }

    function resetInterpretationBlocks(options = {}) {
        const { preserveJudgment = false } = options;
        if (!preserveJudgment) {
            setJudgmentLoadingState(true, '正在看清这件事现在的局面。', '', { step: 'cast' });
        }
        emotionContent.innerHTML = '<span class="cursor cursor-blink" id="modern-cursor-emotion"></span>';
        mainContent.innerHTML = '<span class="cursor cursor-blink" id="modern-cursor-main"></span>';
        shareCard.setAttribute('aria-hidden', 'true');
    }

    function updateShareCard() {
        const mainText = String(mainContent.textContent || '').trim();
        const emotionText = String(emotionContent.textContent || '').trim();
        const judgmentText = String(judgmentContent.textContent || '').trim();
        const takeawayMatch = mainText.match(/给你一句话[:：]\s*([^\n]+)/);
        const emotionLine = extractHealingLine(emotionText);
        const takeawayLine = extractHealingLine(takeawayMatch?.[1]?.trim() || '');

        shareContext.textContent = state.question
            ? `关于：${extractConflictTag(state.question)}`
            : '关于你现在最放不下的这件事';

        // 分享卡判断句优先选取落点卡的大标题
        shareJudgment.textContent = compactText(judgmentText || '先把心放稳一点。', 52);

        // 签语部分优先提取落点句
        const quoteCandidates = [takeawayLine, emotionLine, emotionText].filter(Boolean);
        const quoteSource = quoteCandidates.find(candidate => String(candidate).trim().length >= 18)
            || quoteCandidates[0]
            || '慢一点没关系，先把自己放稳，答案会慢慢清楚。';
        shareQuote.textContent = completeShareQuote(quoteSource);
        shareCard.setAttribute('aria-hidden', 'false');
    }

    function buildFollowupQuestion(kind) {
        const baseQuestion = compactText(state.question || questionInput.value.trim() || '刚才这件事', 46);
        const templates = {
            advance: `关于刚才这件事：${baseQuestion}。如果我继续推进，接下来最该注意什么？`,
            wait: `关于刚才这件事：${baseQuestion}。如果我先等等，会不会更稳一点？`,
            notice: `关于刚才这件事：${baseQuestion}。它现在最关键的变化点在哪里，我应该先看什么？`,
        };
        return templates[kind] || templates.notice;
    }

    function followupFlow(kind) {
        if (!requireLoginForContinuation(() => followupFlow(kind))) {
            trackEvent('auth_required', { trigger: 'followup' });
            return;
        }
        const nextQuestion = buildFollowupQuestion(kind);
        trackEvent('followup_question_click', {
            kind,
            previousQuestionLength: String(state.question || '').length,
            hadChanging: state.changingPositions.length > 0,
        });
        showFollowupComposer(nextQuestion, { source: 'followup', kind });
    }

    function extractSection(text, startMarker, endMarkers = []) {
        const startIndex = text.indexOf(startMarker);
        if (startIndex === -1) return '';
        const contentStart = startIndex + startMarker.length;
        let endIndex = text.length;
        for (const marker of endMarkers) {
            const candidate = text.indexOf(marker, contentStart);
            if (candidate !== -1 && candidate < endIndex) {
                endIndex = candidate;
            }
        }
        return text.slice(contentStart, endIndex).trim();
    }

    function trimToFirstSentence(text) {
        const normalized = String(text || '')
            .replace(/\r/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .join(' ')
            .trim();
        if (!normalized) return '';

        const match = normalized.match(/^(.{0,40}?[。！？!?]|.{0,24})/);
        return (match ? match[1] : normalized).trim();
    }

    function firstCompleteSentence(text, maxLength = 72) {
        const normalized = String(text || '')
            .replace(/\r/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .join(' ')
            .trim();
        if (!normalized) return '';
        const match = normalized.match(/^(.{6,90}?[。！？!?])/);
        if (!match) return '';
        return compactText(match[1].trim(), maxLength);
    }

    function extractHealingLine(text) {
        const bannedPattern = /(第[一二三四五六七八九十百零〇0-9]+卦|本卦|变卦|之卦|动爻|爻|卦象|卦|震|乾|坤|坎|离|艮|兑|巽)/;
        const lines = String(text || '')
            .replace(/\r/g, '')
            .split(/[。！？!?；;\n]/)
            .map(line => line.replace(/^[\s\-*•]+/, '').trim())
            .filter(Boolean);

        const candidate = lines.find(line => !bannedPattern.test(line) && line.length >= 8)
            || lines.find(line => line.length >= 8)
            || '';
        return candidate.replace(/[：:]\s*$/, '').trim();
    }

    function cleanJudgmentCandidate(text, options = {}) {
        const { requireComplete = false } = options;
        const raw = String(text || '')
            .replace(/\r/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .join(' ')
            .trim();
        const completeSentence = firstCompleteSentence(raw, 52);
        if (completeSentence) {
            return completeSentence
                .replace(/^[\d一二三四五六七八九十]+[\.、)\s]+/, '')
                .replace(/^[-*•]\s+/, '')
                .trim();
        }
        if (requireComplete) return '';

        const normalized = trimToFirstSentence(raw)
            .replace(/^[\d一二三四五六七八九十]+[\.、)\s]+/, '')
            .replace(/^[-*•]\s+/, '')
            .trim();

        if (!normalized) return '';

        const shortMatch = normalized.match(/^(.{10,46}?[。！？!?]|.{14,46})/);
        return (shortMatch ? shortMatch[1] : normalized).trim();
    }

    function isUsableJudgmentCandidate(text) {
        const candidate = String(text || '').trim();
        if (!candidate) return false;
        if (candidate.length < 6) return false;
        if (candidate.length > 52) return false;
        if (/[：:]\s*$/.test(candidate)) return false;
        if (/[，、（(]\s*$/.test(candidate)) return false;
        if (WEAK_JUDGMENT_PATTERN.test(candidate)) return false;
        if (/(你现在卡在哪里|这件事的势头|你最该注意|你可以怎么做|给你一句话)/.test(candidate)) {
            return false;
        }
        return true;
    }

    function pickContextualFallback(fallbacks, seed = '') {
        if (!fallbacks.length) return '先别急着定，这件事还要再看清一点。';
        const normalized = String(seed || '');
        const score = Array.from(normalized).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return fallbacks[score % fallbacks.length];
    }

    function getContextualFallbackJudgment(question) {
        const normalized = String(question || '');
        const workFallbacks = [
            '先别急着接招，先看清边界。',
            '这不是能力不够，是节奏还没对齐。',
            '先稳住自己的位置，再决定要不要往前。',
        ];
        const loveFallbacks = [
            '别急着证明关系，先看清回应。',
            '先把自己放稳，再看对方有没有接住你。',
            '关系不是靠用力撑住的，先看它有没有回应。',
        ];
        const choiceFallbacks = [
            '现在不是没答案，是选项还没摆清。',
            '先别急着选，先看哪条路更消耗你。',
            '答案还没落地，先把代价看明白。',
        ];
        const dealFallbacks = [
            '先把条件说清，再决定要不要往前。',
            '这件事可以谈，但边界要先落下来。',
            '别先替对方让步，先把自己的底线说清。',
        ];

        if (/(工作|上班|离职|辞职|offer|跳槽|面试|领导|同事|招聘|项目|视频|账号|流量|爆)/.test(normalized)) {
            return pickContextualFallback(workFallbacks, normalized);
        }
        if (/(感情|对象|他|她|分手|复合|表白|关系|主动|联系|暧昧|伴侣|朋友)/.test(normalized)) {
            return pickContextualFallback(loveFallbacks, normalized);
        }
        if (/(合作|钱|投资|报价|续约|合伙|买|卖|合同)/.test(normalized)) {
            return pickContextualFallback(dealFallbacks, normalized);
        }
        if (/(要不要|该不该|选|接不接|去不去|买不买|卖不卖|留不留)/.test(normalized)) {
            return pickContextualFallback(choiceFallbacks, normalized);
        }

        return pickContextualFallback([
            '先别急着定，这件事还要再看清一点。',
            '你不用马上有答案，先把局面看清。',
            '先稳住心，再看下一步该往哪走。',
        ], normalized);
    }

    function deriveFallbackJudgment(mainText, emotionText, questionText = '') {
        const normalizedMain = String(mainText || '').replace(/\r/g, '');
        const directSections = [
            extractSection(normalizedMain, '给你一句话：'),
            extractSection(normalizedMain, '你可以怎么做：', ['给你一句话：']),
        ];

        for (const section of directSections) {
            if (/^[\d一二三四五六七八九十]+[\.、)]/.test(String(section || '').trim())) {
                continue;
            }
            const candidate = cleanJudgmentCandidate(section);
            if (isUsableJudgmentCandidate(candidate)) return candidate;
        }

        const emotionCandidate = cleanJudgmentCandidate(emotionText);
        if (isUsableJudgmentCandidate(emotionCandidate)) return emotionCandidate;

        const firstLineCandidate = cleanJudgmentCandidate(normalizedMain);
        if (isUsableJudgmentCandidate(firstLineCandidate)) return firstLineCandidate;

        return getContextualFallbackJudgment(questionText);
    }

    function renderInterpretationSections(rawText, options = {}) {
        const { allowFallback = false } = options;
        const normalized = rawText.replace(/\r/g, '');
        const judgmentText = extractSection(normalized, '[一句判断]', ['[定心话]', '[大白话]']);
        const emotionText = extractSection(normalized, '[定心话]', ['[大白话]']);
        const mainText = extractSection(normalized, '[大白话]');

        // 核心：仅当落点部分已经结束（看到下一个标签）或者是最后一次调用时，才渲染落点卡
        // 这样可以避免随着 AI 吐字导致的频繁打字机重置
        const isJudgmentStable = normalized.includes('[定心话]') || normalized.includes('[大白话]') || allowFallback;

        if (judgmentText && isJudgmentStable) {
            const cleanedJudgment = cleanJudgmentCandidate(judgmentText, { requireComplete: !allowFallback });
            if (isUsableJudgmentCandidate(cleanedJudgment)) {
                const supportLine = firstCompleteSentence(emotionText, 72);
                setJudgmentLoadingState(false, cleanedJudgment, supportLine);
            } else if (allowFallback) {
                setJudgmentLoadingState(
                    false,
                    deriveFallbackJudgment(mainText, emotionText, state.question),
                    firstCompleteSentence(emotionText, 72) || '先把局面看明白，再决定继续推进、暂停观察，还是换个方式处理。'
                );
            }
        } else if (allowFallback && (emotionText || mainText)) {
            setJudgmentLoadingState(
                false,
                deriveFallbackJudgment(mainText, emotionText, state.question),
                firstCompleteSentence(emotionText, 72) || '先把局面看明白，再决定继续推进、暂停观察，还是换个方式处理。'
            );
        }

        if (emotionText) {
            renderStreamingText(emotionContent, emotionText, 'modern-cursor-emotion');
        } else if (normalized.includes('[大白话]')) {
            const fallbackEmotion = normalized
                .split('[大白话]')[0]
                .replace('[一句判断]', '')
                .replace('[定心话]', '')
                .trim();
            renderStreamingText(emotionContent, fallbackEmotion, 'modern-cursor-emotion');
        }

        if (mainText) {
            renderStreamingText(mainContent, mainText, 'modern-cursor-main');
        }
    }

    function renderInterpretationFailure() {
        if (judgmentContent.classList.contains('is-pending') || !judgmentContent.textContent.trim()) {
            setJudgmentLoadingState(false, '这次没有顺利展开，先别急。', '卦已经起好，只是大白话暂时没连上。你可以稍后再试，或换个更具体的问法。', { source: 'force' });
        }
        renderStaticText(emotionContent, '卦已经起好，只是大白话解读暂时没连上。先别慌，这不是你的问题。');
        renderStaticText(mainContent, '你可以稍后再试一次，或者换个更具体的问法重新问。刚才的卦象已经保留下来，可以先看本卦、动爻和之卦的提示。');
        state.interpretationComplete = false;
        if (shareBtn) shareBtn.disabled = true;
        if (rephraseBtn) rephraseBtn.disabled = false;
        if (resetBtn) resetBtn.disabled = false;
        setStatus('卦已起好');
        setSubmitState('立即算一算', false);
    }

    async function startInterpretation(requestId, controller) {
        if (!isActiveRequest(requestId)) return;
        setStatus('正在解读');
        setSubmitState('正在陪你把这件事看清一点...', true, { loading: true });
        showJudgmentProgress('settle', '正在把本卦、动爻和你的问题收成一句提醒。');
        resetInterpretationBlocks({ preserveJudgment: true });
        trackEvent('interpret_start', {
            hexagramNumber: state.hexagramNumber,
            changingCount: state.changingPositions.length,
            hasChanging: state.changingPositions.length > 0,
        });

        let currentText = '';

        const response = await fetch('/api/interpret', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', 'X-Guest-Id': getGuestId() },
            body: JSON.stringify({
                question: state.question,
                hexagramNumber: state.hexagramNumber,
                changingPositions: state.changingPositions,
                changedHexagramNumber: state.changedHexagramNumber,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '解读暂时不可用');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!isActiveRequest(requestId)) return;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') continue;

                let data;
                try {
                    data = JSON.parse(dataStr);
                } catch (error) {
                    continue;
                }
                if (data.type === 'error') {
                    throw new Error(data.message || '解读失败');
                }
                if (data.type !== 'content') continue;

                if (!isActiveRequest(requestId)) return;
                currentText += data.text;
                renderInterpretationSections(currentText, { allowFallback: false });
            }
        }

        if (!isActiveRequest(requestId)) return;
        renderInterpretationSections(currentText, { allowFallback: true });

        const emotionCursor = document.getElementById('modern-cursor-emotion');
        const mainCursor = document.getElementById('modern-cursor-main');
        // 柔和淡出光标，而不是突然消失
        if (emotionCursor) {
            emotionCursor.classList.remove('cursor-blink');
            emotionCursor.classList.add('is-fading');
            window.setTimeout(() => emotionCursor.classList.add('hidden'), 800);
        }
        if (mainCursor) {
            mainCursor.classList.remove('cursor-blink');
            mainCursor.classList.add('is-fading');
            window.setTimeout(() => mainCursor.classList.add('hidden'), 800);
        }
        updateShareCard();
        state.interpretationComplete = true;
        setResultActionsEnabled(true);
        setStatus('已解读');
        setSubmitState('立即算一算', false);
        trackEvent('interpret_complete', {
            hexagramNumber: state.hexagramNumber,
            changingCount: state.changingPositions.length,
            hasChanging: state.changingPositions.length > 0,
            emotionLength: String(emotionContent.textContent || '').trim().length,
            mainLength: String(mainContent.textContent || '').trim().length,
        });
        saveRecentQuestion();
    }

    async function startDivination() {
        if (window.location.protocol === 'file:') {
            setMessage('现在是直接打开文件，无法连接后端。请访问 http://localhost:3000/ 再起卦。');
            setStatus('请用本地服务访问');
            trackEvent('submit_blocked_file_protocol');
            return;
        }

        if (state.isSubmitting) {
            setMessage('这一卦还在展开，先等它说完。');
            trackEvent('submit_ignored_inflight');
            return;
        }

        const question = questionInput.value.trim();
        if (!question) {
            setMessage('先把你现在最想问的那件事写下来，我们再开始。');
            questionInput.focus();
            trackEvent('submit_empty');
            return;
        }

        const requestId = createRequestId();
        const controller = new AbortController();
        state.isSubmitting = true;
        state.activeRequestId = requestId;
        state.activeController = controller;
        state.interpretationComplete = false;
        setResultActionsEnabled(false);
        hideFollowupComposer();

        trackEvent('submit_click', {
            questionSource: state.questionSource,
            helperOpen: Boolean(questionHelper?.open),
        });

        setSubmitState('正在起卦...', true, { loading: true });
        setMessage('');
        setStatus('正在起卦');
        resultShell.hidden = false;
        scrollToResult();
        questionEcho.textContent = question;
        hexagramTitle.textContent = '正在为你起卦...';
        hexagramLines.innerHTML = '';
        changingWarning.hidden = true;
        changingWarning.textContent = '';
        changedShell.hidden = true;
        changedShell.open = false;
        changedTitle.textContent = '';
        changedLines.innerHTML = '';
        resetInterpretationBlocks();
        currentExplanation.textContent = '本卦会显示这件事眼下的局面。';
        changingExplanation.textContent = '动爻会告诉你，这件事最不稳定、最容易改向的地方在哪。';
        futureExplanation.textContent = '之卦会显示，如果这些变化继续发展，事情更可能会走成什么样。';
        setJudgmentLoadingState(true, '正在看清这件事现在的局面。', '', { step: 'cast' });
        renderStaticText(emotionContent, '先等一会儿，这一卦正在慢慢显出来。');
        renderStaticText(mainContent, '我们会先给你一个轮廓，再陪你把这件事慢慢讲清楚。');

        try {
            const response = await fetch('/api/divine', {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json', 'X-Guest-Id': getGuestId() },
                body: JSON.stringify({ question }),
            });
            if (!isActiveRequest(requestId)) return;

            if (!response.ok) {
                const error = await response.json();
                const nextError = new Error(error.error || '起卦失败');
                nextError.code = error.code;
                throw nextError;
            }

            const data = await response.json();
            if (!isActiveRequest(requestId)) return;
            state.question = question;
            state.hexagramNumber = data.hexagramNumber;
            state.changingPositions = data.changingPositions || [];
            state.changedHexagramNumber = data.changedHexagramNumber || null;
            state.yaoDescriptions = data.yaoDescriptions || [];
            markGuestQuestionUsed();
            trackEvent('divine_success', {
                questionSource: state.questionSource,
                hexagramNumber: state.hexagramNumber,
                changedHexagramNumber: state.changedHexagramNumber,
                changingCount: state.changingPositions.length,
                hasChanging: state.changingPositions.length > 0,
            });

            hexagramTitle.textContent = data.title;
            renderHexagram(hexagramLines, data.yaoLines || [], state.changingPositions);

            if (state.changingPositions.length > 0) {
                const yaoNames = ['初', '二', '三', '四', '五', '上'];
                const positionNames = state.changingPositions.map(index => `${yaoNames[index]}爻`).join('、');
                changingWarning.textContent = `这一卦里 ${positionNames} 在动，说明事情还在变化里。现在看到的是轮廓，还不是最后定局。`;
                changingWarning.hidden = false;
                setChangedSummary('这卦有变化点，可以继续问这一层', '本卦看现在，动爻看变化点，之卦看接下来可能的走势');
            }

            if (data.changedTitle && Array.isArray(data.changedYaoLines)) {
                changedTitle.textContent = data.changedTitle;
                renderHexagram(changedLines, data.changedYaoLines || []);
                changedShell.hidden = false;
                changedShell.open = false;
                updateChangedStory(data);
            } else {
                setChangedSummary('这卦有变化点，可以继续问这一层', '本卦看现在，动爻看变化点，之卦看接下来可能的走势');
                changedFollowupCopy.textContent = '不用自己查原文。这里的动爻就是这件事最容易变化的地方，你可以直接顺着它继续问。';
            }

            showJudgmentProgress('translate', '卦象已成，正在把它翻译成你能听懂的话。');
            await startInterpretation(requestId, controller);
        } catch (error) {
            if (error?.name === 'AbortError' || !isActiveRequest(requestId)) {
                return;
            }
            if (error?.code === 'LOGIN_REQUIRED') {
                setMessage('免费体验已经用过了。登录后可以继续问、追问或换个问法。');
                setStatus('需要登录');
                setSubmitState('立即算一算', false);
                showAuthModal(() => startDivination());
                trackEvent('auth_required', { trigger: 'submit' });
                return;
            }
            const failedDuringInterpretation = statusPill.textContent === '正在解读';
            if (failedDuringInterpretation) {
                setMessage('卦已经起好，但大白话解读暂时没连上。可以稍后再试，或换个问法重新问。');
                renderInterpretationFailure();
            } else {
                setMessage(`这次没能顺利起卦：${error.message}`);
                setStatus('暂时失败');
                setJudgmentLoadingState(false, '这次没有顺利展开，先别急。', '网络偶尔会卡住，不代表这件事没有答案。你可以稍后再试一次。', { source: 'force' });
                renderStaticText(emotionContent, '这次没有顺利跑出来，不是你的问题。');
                renderStaticText(mainContent, '你可以稍后再试，或者换个问法，让这件事更具体一点。');
            }
            trackEvent('divine_error', {
                stage: failedDuringInterpretation ? 'interpret' : 'divine',
                errorCode: error?.name || 'unknown_error',
            });
        } finally {
            if (isActiveRequest(requestId)) {
                state.isSubmitting = false;
                state.activeController = null;
                state.activeRequestId = null;
            }
            if (statusPill.textContent !== '已解读') {
                setSubmitState('立即算一算', false);
            }
        }
    }

    async function saveShareImage() {
        if (!state.interpretationComplete) {
            setMessage('等这一卦解完，再保存心安卡片会更完整。');
            return;
        }

        trackEvent('share_click', {
            hexagramNumber: state.hexagramNumber,
            changingCount: state.changingPositions.length,
            hasChanging: state.changingPositions.length > 0,
        });
        if (typeof window.html2canvas === 'undefined') {
            shareBtn.textContent = '截图插件未就绪';
            window.setTimeout(() => {
                shareBtn.textContent = '保存心安卡片';
            }, 1600);
            return;
        }

        shareBtn.disabled = true;
        const originalText = shareBtn.textContent;
        shareBtn.textContent = '生成中...';
        let didSave = false;
        trackEvent('share_generate_start');

        try {
            updateShareCard();
            body.classList.add('share-mode');
            const canvas = await window.html2canvas(shareCard, {
                scale: window.devicePixelRatio || 2,
                backgroundColor: '#f3ece2',
                useCORS: true,
            });

            body.classList.remove('share-mode');
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `心安卡片_${Date.now()}.png`;
            link.click();
            didSave = true;
            trackEvent('share_generate_success', {
                hexagramNumber: state.hexagramNumber,
                hasChanging: state.changingPositions.length > 0,
            });
        } catch (error) {
            setMessage(`生成分享图失败：${error.message}`);
            trackEvent('share_generate_error', { errorCode: error?.name || 'unknown_error' });
            body.classList.remove('share-mode');
        } finally {
            shareBtn.disabled = false;
            shareBtn.textContent = originalText;
        }

        if (didSave) {
            shareBtn.classList.add('is-success');
            shareBtn.textContent = '已保存 ✓';
            window.setTimeout(() => {
                shareBtn.classList.remove('is-success');
                shareBtn.textContent = originalText;
            }, 1800);
        }
    }

    function resetFlow() {
        if (!requireLoginForContinuation(resetFlow)) {
            trackEvent('auth_required', { trigger: 'new_question' });
            return;
        }
        abortActiveRequest();
        trackEvent('new_question_click', {
            hadResult: Boolean(state.hexagramNumber),
        });
        setMessage('');
        setStatus('等你开口');
        setSubmitState('立即算一算', false);
        questionInput.value = '';
        state.question = '';
        state.hexagramNumber = null;
        state.changingPositions = [];
        state.changedHexagramNumber = null;
        state.questionSource = 'manual';
        state.hasTrackedQuestionStart = false;
        state.hasTrackedDraftStart = false;
        state.interpretationComplete = false;
        hideFollowupComposer();
        resultShell.hidden = true;
        changedShell.hidden = true;
        changedShell.open = false;
        changingWarning.hidden = true;
        shareCard.setAttribute('aria-hidden', 'true');
        setResultActionsEnabled(false);
        composerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
            questionInput.focus();
        }, 280);
    }

    function rephraseFlow() {
        if (!requireLoginForContinuation(rephraseFlow)) {
            trackEvent('auth_required', { trigger: 'rephrase' });
            return;
        }
        abortActiveRequest();
        trackEvent('rephrase_click', {
            hadResult: Boolean(state.hexagramNumber),
        });
        setMessage('');
        hideFollowupComposer();
        resultShell.hidden = true;
        changedShell.hidden = true;
        changedShell.open = false;
        changingWarning.hidden = true;
        shareCard.setAttribute('aria-hidden', 'true');
        setResultActionsEnabled(false);
        composerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
            questionInput.focus();
            questionInput.setSelectionRange(questionInput.value.length, questionInput.value.length);
        }, 280);
    }

    enterBtn.addEventListener('click', () => {
        trackEvent('enter_click');
        revealComposer();
    });
    promptChips.forEach(button => {
        button.addEventListener('click', (event) => {
            revealComposer();
            state.questionSource = 'chip';
            questionInput.value = button.dataset.question || '';
            markQuestionDraftStarted('chip');
            updateQuestionGuide();
            questionInput.focus();
            questionInput.setSelectionRange(questionInput.value.length, questionInput.value.length);
            trackEvent('chip_click', {
                chipIndex: Array.from(promptChips).indexOf(event.currentTarget),
            });
        });
    });
    helperTemplates.forEach(button => {
        button.addEventListener('click', (event) => {
            const template = button.dataset.template || '';
            if (!template) return;
            revealComposer();
            state.questionSource = 'helper_template';
            questionInput.value = template;
            markQuestionDraftStarted('helper_template');
            updateQuestionGuide();
            questionInput.focus();
            const caretIndex = questionInput.value.indexOf('：') + 1 || questionInput.value.length;
            questionInput.setSelectionRange(caretIndex, caretIndex);
            trackEvent('assistant_template_click', {
                templateIndex: Array.from(helperTemplates).indexOf(event.currentTarget),
            });
        });
    });
    questionCoachPills.forEach(button => {
        button.addEventListener('click', () => {
            applyCoachPrompt(button.dataset.coachField || 'direction');
        });
    });
    followupButtons.forEach(button => {
        button.addEventListener('click', () => {
            followupFlow(button.dataset.followup || 'notice');
        });
    });
    submitBtn.addEventListener('click', startDivination);
    followupConfirm?.addEventListener('click', confirmFollowupQuestion);
    followupCancel?.addEventListener('click', () => {
        hideFollowupComposer();
        setMessage('');
        trackEvent('followup_composer_cancel');
    });
    resetBtn.addEventListener('click', resetFlow);
    rephraseBtn.addEventListener('click', rephraseFlow);
    shareBtn.addEventListener('click', saveShareImage);
    authCloseButtons.forEach((button) => {
        button.addEventListener('click', () => {
            pendingAuthAction = null;
            hideAuthModal();
            trackEvent('auth_modal_close');
        });
    });
    sendCodeBtn?.addEventListener('click', requestPhoneCode);
    verifyCodeBtn?.addEventListener('click', verifyPhoneCode);
    wechatLoginBtn?.addEventListener('click', startWechatLogin);
    codeInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            verifyPhoneCode();
        }
    });
    recentClearBtn?.addEventListener('click', clearRecentQuestions);
    questionHelper?.addEventListener('toggle', () => {
        if (questionHelper.open) {
            trackEvent('question_helper_open');
        }
    });
    changedShell?.addEventListener('toggle', () => {
        if (changedShell.open) {
            trackEvent('changed_shell_open', {
                hexagramNumber: state.hexagramNumber,
                changedHexagramNumber: state.changedHexagramNumber,
                changingCount: state.changingPositions.length,
            });
        }
    });
    changedFollowupButtons.forEach((button) => {
        button.addEventListener('click', () => {
            changedFollowupFlow(button.dataset.changedFollowup || 'meaning');
        });
    });
    recentList?.addEventListener('click', (event) => {
        const itemButton = event.target.closest('.modern-recent-item');
        if (!itemButton) return;
        const index = Number(itemButton.dataset.recentIndex || 0);
        const item = readRecentQuestions()[index];
        useRecentQuestion(item, index);
    });
    questionInput.addEventListener('input', () => {
        if (state.questionSource !== 'manual' && !state.questionSource.endsWith('_edited')) {
            state.questionSource = `${state.questionSource}_edited`;
        }
        updateQuestionGuide();
        if (questionInput.value.trim().length > 0) {
            markQuestionDraftStarted('manual');
        }
        /* 维度十二：打字活力感 — 输入 ≥8 字时按钮发光 */
        submitBtn.classList.toggle('is-ready', questionInput.value.trim().length >= 8);
    });
    questionInput.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            startDivination();
        }
    });

    updateQuestionGuide();
    renderRecentQuestions();
    setResultActionsEnabled(false);
    setStatus('等你开口');
    setSubmitState('立即算一算', false);
    loadAuthState();
    trackEvent('page_view', {
        isReturning: readRecentQuestions().length > 0,
    });
});
