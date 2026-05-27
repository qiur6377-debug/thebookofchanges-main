document.addEventListener('DOMContentLoaded', () => {
    const ModernCore = window.XinanModernCore;
    if (!ModernCore) {
        console.error('modern-core.js 未加载，现代版核心逻辑不可用。');
        return;
    }
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
    const understandingLayer = document.getElementById('modern-understanding-layer');
    const understandingHeard = document.getElementById('modern-understanding-heard');
    const understandingStuck = document.getElementById('modern-understanding-stuck');
    const understandingCalm = document.getElementById('modern-understanding-calm');
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
    const changedDirectFollowup = document.getElementById('modern-changed-direct-followup');
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
    const intentConfirm = document.getElementById('modern-intent-confirm');
    const intentConfirmText = document.getElementById('modern-intent-confirm-text');
    const questionCoach = document.getElementById('modern-question-coach');
    const questionCoachStatus = document.getElementById('modern-question-coach-status');
    const questionCoachHeardEvent = document.getElementById('modern-coach-heard-event');
    const questionCoachHeardWorry = document.getElementById('modern-coach-heard-worry');
    const questionCoachHeardDirection = document.getElementById('modern-coach-heard-direction');
    const questionCoachSuggested = document.getElementById('modern-coach-suggested-question');
    const questionCoachPills = document.querySelectorAll('.modern-coach-pill');
    const contextPrompt = document.getElementById('modern-context-prompt');
    const contextPromptText = document.getElementById('modern-context-prompt-text');
    const contextToggle = document.getElementById('modern-context-toggle');
    const contextCard = document.getElementById('modern-context-card');
    const contextScene = document.getElementById('modern-context-scene');
    const contextCopy = document.getElementById('modern-context-copy');
    const contextOptions = document.getElementById('modern-context-options');
    const contextWorryOptions = document.getElementById('modern-context-worry-options');
    const contextFeedback = document.getElementById('modern-context-feedback');
    const contextSituationNote = document.getElementById('modern-context-situation-note');
    const contextWorryNote = document.getElementById('modern-context-worry-note');
    const contextReview = document.getElementById('modern-context-review');
    const contextReviewText = document.getElementById('modern-context-review-text');
    const contextReviewEdit = document.getElementById('modern-context-review-edit');
    const contextReviewConfirm = document.getElementById('modern-context-review-confirm');
    const contextSummary = document.getElementById('modern-context-summary');
    const contextSummaryText = document.getElementById('modern-context-summary-text');
    const questionHelper = document.getElementById('modern-question-helper');
    const helperTemplates = document.querySelectorAll('.modern-helper-template');
    const followupButtons = document.querySelectorAll('.modern-followup-btn');
    const followupComposer = document.getElementById('modern-followup-composer');
    const followupQuestion = document.getElementById('modern-followup-question');
    const followupConfirm = document.getElementById('modern-followup-confirm');
    const followupCancel = document.getElementById('modern-followup-cancel');
    const followupHistory = document.getElementById('modern-followup-history');
    const followupHistoryList = document.getElementById('modern-followup-history-list');
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
        contextSelection: '',
        contextWorry: '',
        contextPanelOpen: true,
        contextPanelDismissed: false,
        contextConfirming: false,
        contextConfirmed: false,
        contextReviewVisible: false,
        contextReviewSummary: '',
        coachOpen: false,
        backgroundContext: null,
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
        return ModernCore.sanitizeAnalyticsPayload(payload);
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
        const text = questionInput.value.trim();
        const analysis = analyzeQuestionDraft(text);
        if (questionCoach) {
            questionCoach.hidden = !state.coachOpen;
        }

        if (!text) {
            updateQuestionCoach();
            updateBackgroundContextCard();
            return;
        }

        if (!analysis.hasEvent) {
            updateQuestionCoach();
            updateBackgroundContextCard();
            return;
        }

        if (!/(要不要|该不该|会不会|能不能|适不适合|怎么办|怎么做|怎么样|往哪边|继续|放弃|主动|等待)/.test(text)) {
            updateQuestionCoach();
            updateBackgroundContextCard();
            return;
        }

        if (!/(担心|害怕|怕|纠结|卡|放不下|犹豫|焦虑|更累|后悔)/.test(text)) {
            updateQuestionCoach();
            updateBackgroundContextCard();
            return;
        }

        updateQuestionCoach();
        updateBackgroundContextCard();
    }

    function getContextNoteParts() {
        const situationNote = String(contextSituationNote?.value || '').trim();
        const worryNote = String(contextWorryNote?.value || '').trim();
        return { situationNote, worryNote };
    }

    function getContextNoteText() {
        const { situationNote, worryNote } = getContextNoteParts();
        return [
            situationNote ? `处境补充：${compactText(situationNote, 70)}` : '',
            worryNote ? `担心补充：${compactText(worryNote, 70)}` : '',
        ].filter(Boolean).join('；');
    }

    function clearContextNotes() {
        if (contextSituationNote) contextSituationNote.value = '';
        if (contextWorryNote) contextWorryNote.value = '';
    }

    function focusFirstContextNote() {
        const firstEmpty = !String(contextSituationNote?.value || '').trim()
            ? contextSituationNote
            : contextWorryNote;
        (firstEmpty || contextSituationNote || contextWorryNote)?.focus();
    }

    function analyzeQuestionDraft(text) {
        return ModernCore.analyzeQuestionDraft(text);
    }

    function inferQuestionScenario(text) {
        const normalized = String(text || '');
        const presets = [
            {
                key: 'career_crossroad',
                label: '收入去向',
                match: /(没收入|收入|赚钱|工资|创业|副业|自由职业|上班|全职|兼职|现金流|养活自己)/u,
                copy: '我听到的重点不是单纯“工作”，而是收入压力和人生方向在拉扯。先确认你更卡在哪一边。',
            },
            {
                key: 'exam_result',
                label: '结果等待',
                match: /(考试|成绩|出分|事业单位|考公|考编|上岸|录取|笔试|面试成绩|结果)/u,
                copy: '我听到你更像是在等一个结果落地。先确认你现在最怕的是结果本身，还是结果之后怎么安排。',
            },
            {
                key: 'content',
                label: '内容发布',
                match: /(小红书|视频|账号|流量|爆|涨粉|粉丝|点赞|收藏|发布|笔记|内容|作品|品牌|投流|广告)/u,
                copy: '这更像一次内容发布或账号成长的问题。补一个最在意的点，解读会更容易落到“要不要继续、怎么推进”。',
            },
            {
                key: 'work',
                label: '工作选择',
                match: /(工作|上班|离职|辞职|跳槽|offer|面试|领导|同事|项目|招聘|职场|接不接)/u,
                copy: '这更像工作和选择问题。补一个你最担心的后果，卦象会更容易对应到现实动作。',
            },
            {
                key: 'relationship',
                label: '关系拉扯',
                match: /(感情|关系|对象|他|她|联系|主动|复合|分手|暧昧|朋友|伴侣|同事|前任|喜欢)/u,
                copy: '这更像关系里的拉扯。补一个你最怕面对的点，结果会更像在讲你们之间的真实处境。',
            },
            {
                key: 'cooperation',
                label: '合作决策',
                match: /(合作|合伙|投资|钱|报价|合同|客户|甲方|乙方|续约|买|卖|商业)/u,
                copy: '这更像合作或利益判断。补一个你最在意的条件，解读会更聚焦边界和风险。',
            },
            {
                key: 'timing',
                label: '时机判断',
                match: /(什么时候|哪天|最近|时机|现在|立刻|马上|等|等等|推进|先稳|会不会)/u,
                copy: '这更像时机问题。补一个你想确认的节奏，卦象会更容易说明“现在动还是再看”。',
            },
        ];
        return presets.find(item => item.match.test(normalized)) || {
            key: 'general',
            label: '眼前这件事',
            copy: '我大概知道你在问一件卡住的事。补一个最在意的点，结果会更贴近你现在的处境。',
        };
    }

    function dedupeOptions(options, limit = 4) {
        const seen = new Set();
        return options
            .map(option => String(option || '').trim())
            .filter(Boolean)
            .filter((option) => {
                if (seen.has(option)) return false;
                seen.add(option);
                return true;
            })
            .slice(0, limit);
    }

    function extractQuestionSubject(question, scenario = {}) {
        const normalized = String(question || '')
            .replace(/\s+/g, '')
            .replace(/[。！？!?；;，,、]/g, ' ')
            .trim();
        if (/(上班|工作).{0,10}创业|创业.{0,10}(上班|工作)/.test(normalized)) return '上班还是创业';
        if (/(事业单位考试|考公|考编).{0,8}(成绩|出分|结果)|(?:成绩|出分|结果).{0,8}(事业单位考试|考公|考编)/.test(normalized)) return '事业单位考试成绩';
        if (/(没收入|没有收入|收入不稳|现金流).{0,12}(怎么办|焦虑|上班|创业)|(?:上班|创业).{0,12}(没收入|没有收入|收入不稳|现金流)/.test(normalized)) return '收入和去向';
        const candidates = [
            /(上班.*创业|创业.*上班)/,
            /(事业单位考试(?:的)?成绩|事业单位考试|考试成绩|面试成绩)/,
            /(小红书(?:笔记|视频|账号)?投流)/,
            /((?:小红书|视频|笔记|账号|内容|作品|项目|工作|关系|合作|报价|合同|offer|收入|创业|上班|考试|成绩)[^\s]{0,4})/,
            /(投流|发布|涨粉|流量|报价|合作|离职|跳槽|复合|表白|联系|推进|停滞|接不接|要不要|出分|上岸)/,
        ];
        for (const pattern of candidates) {
            const match = normalized.match(pattern);
            if (match && match[1]) return compactText(match[1], 12);
        }
        if (scenario.key === 'content') return '这次发布';
        if (scenario.key === 'career_crossroad') return '收入和去向';
        if (scenario.key === 'exam_result') return '考试结果';
        if (scenario.key === 'work') return '这份工作';
        if (scenario.key === 'relationship') return '这段关系';
        if (scenario.key === 'cooperation') return '这次合作';
        return '这件事';
    }

    function buildScenarioContext(question, scenario) {
        const normalized = String(question || '');
        const subject = extractQuestionSubject(question, scenario);
        if (scenario.key === 'career_crossroad') {
            return {
                situationOptions: ['没收入，想先稳住现金流', '想上班，但又放不下创业', '不知道该先稳还是先闯'],
                worryOptions: ['上班后没精力创业', '继续创业又没有收入', '选错方向会更焦虑', '现实压力撑不住'],
            };
        }
        if (scenario.key === 'exam_result') {
            return {
                situationOptions: ['正在等成绩或结果', '结果快出了，心里没底', '想知道这次有没有机会'],
                worryOptions: ['成绩不理想会受打击', '努力没有回报', '接下来不知道怎么安排', '太在意结果睡不踏实'],
            };
        }
        if (scenario.key === 'content') {
            return {
                situationOptions: /(投流|广告|预算)/.test(normalized)
                    ? ['刚开始投流，还看不到反馈', '已经花了一点钱，但心里没底', '数据变了，但不知道算不算有效']
                    : ['内容刚发布，还在等反馈', '最近流量明显变差', '想判断还要不要继续发'],
                worryOptions: /(投流|广告|预算)/.test(normalized)
                    ? ['钱花了却没结果', '再投下去会更亏', '太早停掉会错过机会', '想知道要不要加码']
                    : ['没人看见这件作品', '影响涨粉或变现', '继续做也没有反馈', '太早放弃会错过后劲'],
            };
        }
        if (scenario.key === 'work') {
            if (/(停滞|卡住|推进不动|没进展)/.test(normalized)) {
                return {
                    situationOptions: ['项目推进停住了', '方向知道但动不起来', '资源或节奏没有接上'],
                    worryOptions: ['继续硬推会更乱', '停下来会前功尽弃', '不知道真正卡点在哪', '拖久了更难收拾'],
                };
            }
            return {
                situationOptions: ['卡在推进节奏', '卡在资源或配合', '卡在方向不确定'],
                worryOptions: ['继续做会白费力气', '换方向又怕前功尽弃', '不知道问题到底出在哪', '拖久了会越来越难收拾'],
            };
        }
        if (scenario.key === 'relationship') {
            return {
                situationOptions: ['对方回应不明朗', '自己想主动但怕打扰', '关系卡在不上不下'],
                worryOptions: ['主动了反而更被动', '继续等会消耗自己', '对方其实没有同样在意', '错过一个还能靠近的机会'],
            };
        }
        if (scenario.key === 'cooperation') {
            return {
                situationOptions: ['条件还没谈清', '机会看起来不错但不踏实', '要投入资源才有结果'],
                worryOptions: ['答应后被动承担太多', '拒绝会错过机会', '对方条件不够清楚', '投入和回报不成正比'],
            };
        }
        if (scenario.key === 'timing') {
            return {
                situationOptions: ['现在想动但还没把握', '事情已经拖了一阵子', '需要判断该冲还是该等'],
                worryOptions: ['现在动会太急', '再等会错过窗口', '看不清接下来会怎么变', '自己只是被情绪推着走'],
            };
        }
        return {
            situationOptions: [`「${subject}」这件事还没看清`, '眼前有选择但不好判断', '想知道下一步怎么动'],
            worryOptions: ['判断错了会后悔', '继续下去会更消耗', '停下来又怕错过', '不知道真正卡点在哪里'],
        };
    }

    function summarizeOriginalQuestion(question) {
        const text = String(question || '').trim().replace(/\s+/g, ' ');
        if (text.length < 6) return '';
        const parts = text
            .split(/(?<=[。！？!?；;])|\n+/u)
            .map(item => item.trim().replace(/[。！？!?；;]+$/g, ''))
            .filter(Boolean);
        const ranked = parts.length ? parts : [text];
        const best = ranked
            .slice()
            .sort((a, b) => {
                const score = value => (/(焦虑|担心|害怕|怕|纠结|迷茫|卡|烦|没底|要不要|该不该|会不会|怎么办)/.test(value) ? 20 : 0)
                    + Math.min(value.length, 46);
                return score(b) - score(a);
            })[0];
        return compactText(best, 46);
    }

    function buildContextReviewSummary(question) {
        const text = String(question || '').trim();
        const scenario = inferQuestionScenario(text);
        const subject = extractQuestionSubject(text, scenario);
        const selection = String(state.contextSelection || '').trim();
        const worry = String(state.contextWorry || '').trim();
        const { situationNote, worryNote } = getContextNoteParts();
        const quote = summarizeOriginalQuestion(text);
        const openingByScenario = {
            content: `我现在问的是「${subject}」这件事。`,
            career_crossroad: '我现在卡在收入压力和去向选择之间。',
            exam_result: `我现在最牵挂的是「${subject}」这个结果。`,
            relationship: `我现在放不下的是「${subject}」里的回应和距离。`,
            work: `我现在卡在「${subject}」这件工作选择里。`,
            cooperation: `我现在拿不准「${subject}」这件合作或利益判断。`,
            timing: `我现在想判断「${subject}」到底该动还是该等。`,
            general: `我现在想看清「${subject}」这件事。`,
        };
        const lines = [openingByScenario[scenario.key] || openingByScenario.general];
        if (quote && quote !== subject) {
            lines.push(`我原本写下的是：“${quote}”。`);
        }
        if (selection) {
            lines.push(`眼前更像是：${selection}。`);
        }
        if (worry) {
            lines.push(`我最担心的是：${worry}。`);
        }
        if (situationNote) {
            lines.push(`我补充的处境是：${compactText(situationNote, 70)}。`);
        }
        if (worryNote) {
            lines.push(`我补充的担心是：${compactText(worryNote, 70)}。`);
        }
        if (!selection && !worry && !situationNote && !worryNote) {
            lines.push('我还没有补充更多背景，所以先按这句原问题来起卦。');
        }
        lines.push('接下来这卦会重点看：现在卡在哪里、变化会从哪里来、下一步更适合怎么动。');
        return compactText(lines.join(''), 220);
    }

    function refreshContextReviewText() {
        if (!state.contextReviewVisible || !contextReviewText) return;
        const summary = buildContextReviewSummary(questionInput.value.trim());
        state.contextReviewSummary = summary;
        contextReviewText.textContent = summary;
    }

    function updateContextSelectionFeedback(scenario) {
        if (!contextFeedback) return;
        const selection = String(state.contextSelection || '').trim();
        const worry = String(state.contextWorry || '').trim();
        if (!selection && !worry) {
            contextFeedback.hidden = true;
            contextFeedback.textContent = '';
            return;
        }

        const subject = extractQuestionSubject(questionInput.value.trim(), scenario);
        const parts = [];
        if (selection) parts.push(`处境：${selection}`);
        if (worry) parts.push(`担心：${worry}`);
        contextFeedback.textContent = `我听到「${subject}」的重点是：${parts.join('；')}。这一卦会把这层处境一起看。`;
        contextFeedback.hidden = false;
    }

    function updateContextOptionButtons(scenario) {
        if (!contextOptions) return;
        const context = buildScenarioContext(questionInput.value.trim(), scenario);
        const options = dedupeOptions(context.situationOptions, 3);
        contextOptions.innerHTML = '';
        options.forEach((option) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'modern-context-option';
            button.textContent = option;
            button.dataset.contextValue = option;
            button.classList.toggle('is-selected', state.contextSelection === option);
            button.addEventListener('click', () => {
                state.contextSelection = state.contextSelection === option ? '' : option;
                updateContextOptionButtons(scenario);
                refreshContextReviewText();
                trackEvent('context_option_click', {
                    scenario: scenario.key,
                    step: 'situation',
                    hasSelection: Boolean(state.contextSelection),
                });
            });
            contextOptions.appendChild(button);
        });
        if (contextWorryOptions) {
            const worryOptions = dedupeOptions(context.worryOptions, 4);
            contextWorryOptions.innerHTML = '';
            worryOptions.forEach((option) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'modern-context-option';
                button.textContent = option;
                button.dataset.contextWorry = option;
                button.classList.toggle('is-selected', state.contextWorry === option);
                button.addEventListener('click', () => {
                    state.contextWorry = state.contextWorry === option ? '' : option;
                    updateContextOptionButtons(scenario);
                    refreshContextReviewText();
                    trackEvent('context_option_click', {
                        scenario: scenario.key,
                        step: 'worry',
                        hasSelection: Boolean(state.contextWorry),
                    });
                });
                contextWorryOptions.appendChild(button);
            });
        }
        updateContextSelectionFeedback(scenario);
    }

    function renderContextPrompt(scenario, analysis, text) {
        if (!contextPrompt || !contextPromptText) return;
        const shouldShowContext = text.length >= 8 && (analysis.hasEvent || analysis.hasDirection || state.contextConfirming || state.contextReviewVisible);
        contextPrompt.hidden = state.contextConfirming || !shouldShowContext;
        if (!shouldShowContext) {
            if (contextToggle) contextToggle.setAttribute('aria-expanded', 'false');
            return;
        }

        const subject = extractQuestionSubject(text, scenario);
        contextPromptText.textContent = `我先听到：${subject}。点两下确认处境和担心，解读会更贴近你。`;
        if (contextToggle) {
            contextToggle.textContent = state.contextPanelOpen ? '收起' : '补两步';
            contextToggle.setAttribute('aria-expanded', String(state.contextPanelOpen));
        }
    }

    function updateBackgroundContextCard() {
        if (!contextCard) return;
        const text = questionInput.value.trim();
        const analysis = analyzeQuestionDraft(text);
        const shouldShowContext = text.length >= 8 && (analysis.hasEvent || analysis.hasDirection || state.contextConfirming || state.contextReviewVisible);
        const scenario = inferQuestionScenario(text);
        renderContextPrompt(scenario, analysis, text);
        if (!shouldShowContext) {
            contextCard.hidden = true;
            state.contextSelection = '';
            state.contextWorry = '';
            state.contextPanelOpen = false;
            state.contextPanelDismissed = false;
            state.contextConfirming = false;
            state.contextReviewVisible = false;
            state.contextReviewSummary = '';
            if (contextReview) contextReview.hidden = true;
            updateContextSelectionFeedback(scenario);
            return;
        }
        if (!state.contextPanelDismissed) {
            state.contextPanelOpen = true;
        }
        contextCard.hidden = !state.contextPanelOpen && !state.contextConfirming;
        const context = buildScenarioContext(text, scenario);
        const situationOptions = dedupeOptions(context.situationOptions, 3);
        const worryOptions = dedupeOptions(context.worryOptions, 4);
        if (state.contextSelection && !situationOptions.includes(state.contextSelection)) {
            state.contextSelection = '';
        }
        if (state.contextWorry && !worryOptions.includes(state.contextWorry)) {
            state.contextWorry = '';
        }
        const subject = extractQuestionSubject(text, scenario);
        contextCard.dataset.scenario = scenario.key;
        if (contextScene) contextScene.textContent = `${scenario.label} · ${subject}`;
        if (contextCopy) {
            contextCopy.textContent = `${scenario.copy} 不想补也可以直接问。`;
        }
        if (contextSituationNote) {
            contextSituationNote.placeholder = `也可以自己补一句处境，比如：关于「${subject}」，现在卡在……`;
        }
        if (contextWorryNote) {
            contextWorryNote.placeholder = `也可以自己补一句担心，比如：关于「${subject}」，我最怕的是……`;
        }
        updateContextOptionButtons(scenario);
    }

    function showPreSubmitContextStep(question) {
        const text = String(question || '').trim();
        if (!text) return false;
        const summary = buildContextReviewSummary(text);
        state.contextReviewSummary = summary;
        state.contextReviewVisible = true;
        updateBackgroundContextCard();
        if (contextReview && contextReviewText) {
            contextReviewText.textContent = summary;
            contextReview.hidden = false;
        }
        setMessage('我先确认自己有没有听懂你。没问题后，再开始起卦。');
        trackEvent('context_review_show', {
            questionLength: text.length,
            hasSelection: Boolean(state.contextSelection),
            hasWorry: Boolean(state.contextWorry),
            hasNote: Boolean(getContextNoteText()),
        });
        window.setTimeout(() => {
            contextReview?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 60);
        return true;
    }

    function buildBackgroundContextPayload(question) {
        const text = String(question || '').trim();
        if (!text) return null;
        const scenario = inferQuestionScenario(text);
        const selection = String(state.contextSelection || '').trim();
        const worry = String(state.contextWorry || '').trim();
        const note = getContextNoteText();
        if (!selection && !worry && !note) return null;
        const subject = extractQuestionSubject(text, scenario);
        const focus = [selection ? `处境：${selection}` : '', worry ? `担心：${worry}` : ''].filter(Boolean).join('；');
        return {
            scenario: `${scenario.label}：${subject}`,
            focus,
            note: note ? compactText(note, 120) : '',
            summary: state.contextReviewSummary ? compactText(state.contextReviewSummary, 240) : '',
        };
    }

    function renderContextSummary(payload) {
        if (!contextSummary || !contextSummaryText) return;
        if (!payload || (!payload.focus && !payload.note)) {
            contextSummary.hidden = true;
            contextSummaryText.textContent = '';
            return;
        }
        const parts = [`这件事更像「${payload.scenario || '眼前这件事'}」`];
        if (payload.focus) parts.push(`你最在意的是「${payload.focus}」`);
        if (payload.note) parts.push(`你补充说：${payload.note}`);
        if (payload.summary) parts.push(`我确认到的是：${payload.summary}`);
        contextSummaryText.textContent = `${parts.join('，')}。我会把这层背景放进卦象里一起看。`;
        contextSummary.hidden = false;
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

    function buildQuestionUnderstanding(question) {
        const text = String(question || '').trim();
        const analysis = analyzeQuestionDraft(text);
        const eventText = analysis.hasEvent
            ? summarizeCoachEvent(text, analysis)
            : compactText(text || '这件事', 30);
        const worryText = analysis.hasWorry
            ? summarizeCoachWorry(text, analysis)
            : '你已经把方向说清楚了，可以直接问';
        const directionText = analysis.hasDirection
            ? summarizeCoachDirection(text, analysis)
            : '下一步到底怎么做';
        const issue = eventText || compactText(text, 30) || '这件事';
        return {
            heard: analysis.hasEvent
                ? `你写到的是「${eventText}」。`
                : `我先听到「${compactText(text, 30) || '这件事'}」，还可以再补一点具体发生了什么。`,
            stuck: `你真正卡住的是「${directionText}」，${worryText}。`,
            calm: (!analysis.hasDirection || analysis.maybeMultiple)
                ? '先不用急着做决定，我们先把真正要问的方向收清楚。'
                : '你已经写出想看的方向了，我们先把担心拆小一点。',
            issue,
            worry: worryText,
        };
    }

    function renderProblemUnderstanding(question) {
        if (!understandingLayer) return;
        const understanding = buildQuestionUnderstanding(question);
        if (understandingHeard) understandingHeard.textContent = understanding.heard;
        if (understandingStuck) understandingStuck.textContent = understanding.stuck;
        if (understandingCalm) understandingCalm.textContent = understanding.calm;
        understandingLayer.hidden = false;
    }

    function renderIntentConfirm(force = false) {
        if (!intentConfirm || !intentConfirmText) return;
        const text = questionInput.value.trim();
        if (!text || !force) {
            intentConfirm.hidden = true;
            return;
        }
        const quote = summarizeOriginalQuestion(text);
        intentConfirmText.textContent = quote
            ? `“${quote}”`
            : '我会先记住你写下的这一句。';
        intentConfirm.hidden = false;
    }

    function openQuestionCoach() {
        state.coachOpen = true;
        updateQuestionCoach();
        renderIntentConfirm(true);
        if (questionCoach) questionCoach.hidden = false;
        trackEvent('question_coach_open_manual', {
            questionLength: questionInput.value.trim().length,
        });
    }

    function summarizeCoachEvent(text, analysis) {
        if (!text) return '还没写下具体事情';
        return analysis.hasEvent
            ? compactText(stripTrailingPunctuation(text), 42)
            : '现在更像一句心情，还可以补清楚是哪件事';
    }

    function summarizeCoachWorry(text, analysis) {
        if (!text || !analysis.hasWorry) return '你已经把方向说清楚了，可以直接问';
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
        state.contextSelection = '';
        state.contextWorry = '';
        state.contextPanelOpen = true;
        state.contextPanelDismissed = false;
        state.contextConfirming = false;
        state.contextConfirmed = false;
        state.contextReviewVisible = false;
        state.contextReviewSummary = '';
        state.coachOpen = false;
        clearContextNotes();
        if (contextReview) contextReview.hidden = true;
        markQuestionDraftStarted('recent');
        updateQuestionGuide();
        renderIntentConfirm(false);
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

    function renderHexagramTitle(title) {
        hexagramTitle.dataset.rawTitle = title;
        hexagramTitle.innerHTML = '';
        const parts = String(title || '').trim().split(/\s+/).filter(Boolean);
        if (parts.length < 4 || !/^第.+卦$/.test(parts[0])) {
            hexagramTitle.textContent = title || '卦象会出现在这里';
            return;
        }

        const index = document.createElement('span');
        index.className = 'modern-hexagram-title-index';
        index.textContent = parts[0];

        const name = document.createElement('span');
        name.className = 'modern-hexagram-title-name';
        name.textContent = `${parts[1]} · ${parts[2]}`;

        const meta = document.createElement('span');
        meta.className = 'modern-hexagram-title-meta';
        meta.textContent = parts.slice(3).join(' ');

        hexagramTitle.append(index, name, meta);
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
        const currentTitle = String(hexagramTitle.dataset.rawTitle || hexagramTitle.textContent || '').trim();
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

    function clearFollowupHistory() {
        if (followupHistoryList) {
            followupHistoryList.innerHTML = '';
        }
        if (followupHistory) {
            followupHistory.hidden = true;
        }
    }

    function addFollowupHistoryCard(nextQuestion) {
        if (!followupHistory || !followupHistoryList) return;
        const previousQuestion = compactText(state.question || questionEcho?.textContent || questionInput.value.trim() || '刚才这件事', 72);
        const previousJudgment = compactText(judgmentContent?.textContent || '上一卦已经给过一个落点。', 86);
        const next = compactText(nextQuestion || '继续看这一层', 82);

        const card = document.createElement('article');
        card.className = 'modern-followup-history-card';

        const label = document.createElement('span');
        label.className = 'modern-followup-history-label';
        label.textContent = '上一卦留下的线索';

        const summary = document.createElement('p');
        summary.className = 'modern-followup-history-summary';
        summary.textContent = previousJudgment;

        const meta = document.createElement('small');
        meta.className = 'modern-followup-history-meta';
        meta.textContent = `从「${previousQuestion}」继续问：${next}`;

        card.append(label, summary, meta);
        followupHistoryList.appendChild(card);
        while (followupHistoryList.children.length > 3) {
            followupHistoryList.firstElementChild?.remove();
        }
        followupHistory.hidden = false;
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
        addFollowupHistoryCard(nextQuestion);
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
        if (pending.source === 'changed_followup') {
            startChangedFollowupInterpretation(nextQuestion, pending);
            return;
        }
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
        return ModernCore.compactText(text, maxLength);
    }

    function stripChangedTitleFromQuestion(text) {
        return ModernCore.stripChangedTitleFromQuestion(text);
    }

    function extractConflictTag(question) {
        return ModernCore.extractConflictTag(question);
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

    async function startChangedFollowupInterpretation(nextQuestion, pending = {}) {
        if (state.isSubmitting) {
            setMessage('这一层还在展开，先等它说完。');
            trackEvent('changed_followup_ignored_inflight');
            return;
        }
        if (!state.hexagramNumber) {
            setMessage('上一卦的信息不完整了，我会重新起一卦来看。');
            startDivination();
            return;
        }

        const requestId = createRequestId();
        const controller = new AbortController();
        state.isSubmitting = true;
        state.activeRequestId = requestId;
        state.activeController = controller;
        state.interpretationComplete = false;
        state.question = nextQuestion;
        state.backgroundContext = null;
        if (questionEcho) questionEcho.textContent = nextQuestion;
        renderContextSummary(null);
        setResultActionsEnabled(false);
        setJudgmentLoadingState(true, '正在顺着动爻继续看这一层。', '', { step: 'translate' });
        resetInterpretationBlocks({ preserveJudgment: true });
        renderStaticText(emotionContent, '刚才那一卦还在，这次只顺着动爻和之卦继续解释。');
        renderStaticText(mainContent, '不用重新起卦，我会沿用本卦、动爻和之卦，回答你刚才追问的这一层。');
        setMessage('继续沿着刚才的动爻和之卦看，不重新起卦。');
        trackEvent('changed_followup_interpret_same_hexagram', {
            kind: pending.kind || 'notice',
            hexagramNumber: state.hexagramNumber,
            changedHexagramNumber: state.changedHexagramNumber,
            changingCount: state.changingPositions.length,
        });

        try {
            await startInterpretation(requestId, controller);
        } catch (error) {
            if (error?.name === 'AbortError' || !isActiveRequest(requestId)) {
                return;
            }
            setMessage('卦已经起好，但这一层大白话暂时没连上。可以稍后再试，或换个追问。');
            renderInterpretationFailure();
            trackEvent('divine_error', {
                stage: 'changed_followup_interpret',
                errorCode: error?.name || 'unknown_error',
            });
        } finally {
            if (isActiveRequest(requestId)) {
                state.isSubmitting = false;
                state.activeController = null;
                state.activeRequestId = null;
            }
            if (statusPill.textContent !== '已解读') {
                setSubmitState('帮我看清这件事', false);
            }
        }
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

    function addsUnstatedConcreteFact(text, questionText = '') {
        return ModernCore.addsUnstatedConcreteFact(text, questionText);
    }

    function isUsableJudgmentCandidate(text, questionText = '') {
        return ModernCore.isUsableJudgmentCandidate(text, questionText);
    }

    function pickContextualFallback(fallbacks, seed = '') {
        return ModernCore.pickContextualFallback(fallbacks, seed);
    }

    function getContextualFallbackJudgment(question) {
        return ModernCore.getContextualFallbackJudgment(question);
    }

    function deriveFallbackJudgment(mainText, emotionText, questionText = '') {
        const normalizedMain = String(mainText || '').replace(/\r/g, '');
        const directSections = [
            extractSection(normalizedMain, '给你一句话：'),
            extractSection(normalizedMain, '现在可以先怎样看：', ['给你一句话：']),
            extractSection(normalizedMain, '你可以怎么做：', ['给你一句话：']),
        ];

        for (const section of directSections) {
            if (/^[\d一二三四五六七八九十]+[\.、)]/.test(String(section || '').trim())) {
                continue;
            }
            const candidate = cleanJudgmentCandidate(section);
            if (isUsableJudgmentCandidate(candidate, questionText)) return candidate;
        }

        const emotionCandidate = cleanJudgmentCandidate(emotionText);
        if (isUsableJudgmentCandidate(emotionCandidate, questionText)) return emotionCandidate;

        const firstLineCandidate = cleanJudgmentCandidate(normalizedMain);
        if (isUsableJudgmentCandidate(firstLineCandidate, questionText)) return firstLineCandidate;

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
            if (isUsableJudgmentCandidate(cleanedJudgment, state.question)) {
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
        setStatus('已经有一个方向');
        setSubmitState('帮我看清这件事', false);
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
                backgroundContext: state.backgroundContext,
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
        setSubmitState('帮我看清这件事', false);
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

        if (!state.contextConfirmed && showPreSubmitContextStep(question)) {
            return;
        }
        state.contextReviewVisible = false;
        if (contextReview) contextReview.hidden = true;

        const requestId = createRequestId();
        const controller = new AbortController();
        state.isSubmitting = true;
        state.activeRequestId = requestId;
        state.activeController = controller;
        state.interpretationComplete = false;
        setResultActionsEnabled(false);
        hideFollowupComposer();
        state.backgroundContext = buildBackgroundContextPayload(question);

        trackEvent('submit_click', {
            questionSource: state.questionSource,
            helperOpen: Boolean(questionHelper?.open),
            hasBackgroundContext: Boolean(state.backgroundContext),
        });

        setSubmitState('正在整理你的问题...', true, { loading: true });
        setMessage('');
        setStatus('正在整理你的问题');
        resultShell.hidden = false;
        scrollToResult();
        questionEcho.textContent = question;
        renderProblemUnderstanding(question);
        renderContextSummary(state.backgroundContext);
        renderHexagramTitle('如果你想看卦理依据');
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

            renderHexagramTitle(data.title);
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

            showJudgmentProgress('translate', '已经有一个方向，正在把它翻译成你能听懂的话。');
            await startInterpretation(requestId, controller);
        } catch (error) {
            if (error?.name === 'AbortError' || !isActiveRequest(requestId)) {
                return;
            }
            if (error?.code === 'LOGIN_REQUIRED') {
                setMessage('免费体验已经用过了。登录后可以继续问、追问或换个问法。');
                setStatus('需要登录');
                setSubmitState('帮我看清这件事', false);
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
                setSubmitState('帮我看清这件事', false);
            }
        }
    }

    async function saveShareImage() {
        if (!state.interpretationComplete) {
            setMessage('等这一卦解完，再保存心安屿卡片会更完整。');
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
                shareBtn.textContent = '保存心安屿卡片';
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
            link.download = `心安屿卡片_${Date.now()}.png`;
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
        setSubmitState('帮我看清这件事', false);
        questionInput.value = '';
        state.question = '';
        state.hexagramNumber = null;
        state.changingPositions = [];
        state.changedHexagramNumber = null;
        state.questionSource = 'manual';
        state.hasTrackedQuestionStart = false;
        state.hasTrackedDraftStart = false;
        state.interpretationComplete = false;
        state.contextSelection = '';
        state.contextWorry = '';
        state.contextPanelOpen = false;
        state.contextPanelDismissed = false;
        state.contextConfirming = false;
        state.contextConfirmed = false;
        state.contextReviewVisible = false;
        state.contextReviewSummary = '';
        state.backgroundContext = null;
        clearContextNotes();
        if (contextReview) contextReview.hidden = true;
        renderContextSummary(null);
        updateBackgroundContextCard();
        hideFollowupComposer();
        clearFollowupHistory();
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
        clearFollowupHistory();
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
            state.contextSelection = '';
            state.contextWorry = '';
            state.contextPanelOpen = true;
            state.contextPanelDismissed = false;
            state.contextConfirming = false;
            state.contextConfirmed = false;
            state.contextReviewVisible = false;
            state.contextReviewSummary = '';
            state.coachOpen = false;
            clearContextNotes();
            if (contextReview) contextReview.hidden = true;
            markQuestionDraftStarted('chip');
            updateQuestionGuide();
            renderIntentConfirm(false);
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
            state.contextSelection = '';
            state.contextWorry = '';
            state.contextPanelOpen = true;
            state.contextPanelDismissed = false;
            state.contextConfirming = false;
            state.contextConfirmed = false;
            state.contextReviewVisible = false;
            state.contextReviewSummary = '';
            state.coachOpen = false;
            clearContextNotes();
            if (contextReview) contextReview.hidden = true;
            markQuestionDraftStarted('helper_template');
            updateQuestionGuide();
            renderIntentConfirm(false);
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
    contextToggle?.addEventListener('click', () => {
        state.contextPanelOpen = !state.contextPanelOpen;
        state.contextPanelDismissed = !state.contextPanelOpen;
        updateBackgroundContextCard();
        trackEvent(state.contextPanelOpen ? 'context_prompt_open' : 'context_prompt_close', {
            questionLength: questionInput.value.trim().length,
        });
        if (state.contextPanelOpen) {
            window.setTimeout(() => {
                contextCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 60);
        }
    });
    contextReviewEdit?.addEventListener('click', () => {
        state.contextConfirmed = false;
        state.contextReviewVisible = false;
        if (contextReview) contextReview.hidden = true;
        state.contextPanelOpen = true;
        state.contextPanelDismissed = false;
        updateBackgroundContextCard();
        setMessage('可以再补一句，或者点一下最像你处境的选项。');
        trackEvent('context_review_edit');
        window.setTimeout(() => {
            contextCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            focusFirstContextNote();
        }, 80);
    });
    contextReviewConfirm?.addEventListener('click', () => {
        state.contextConfirmed = true;
        state.contextReviewVisible = false;
        if (contextReview) contextReview.hidden = true;
        trackEvent('context_review_confirm', {
            hasSelection: Boolean(state.contextSelection),
            hasWorry: Boolean(state.contextWorry),
            hasNote: Boolean(getContextNoteText()),
        });
        startDivination();
    });
    [contextSituationNote, contextWorryNote].forEach((noteInput) => noteInput?.addEventListener('input', () => {
        state.contextConfirmed = false;
        refreshContextReviewText();
    }));
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
    changedDirectFollowup?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        changedFollowupFlow(changedDirectFollowup.dataset.changedFollowup || 'meaning');
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
        state.contextSelection = '';
        state.contextWorry = '';
        state.contextPanelDismissed = false;
        state.contextConfirmed = false;
        state.contextConfirming = false;
        state.contextReviewVisible = false;
        state.contextReviewSummary = '';
        if (contextReview) contextReview.hidden = true;
        state.coachOpen = false;
        updateQuestionGuide();
        renderIntentConfirm(false);
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
    setSubmitState('帮我看清这件事', false);
    loadAuthState();
    trackEvent('page_view', {
        isReturning: readRecentQuestions().length > 0,
    });
});
