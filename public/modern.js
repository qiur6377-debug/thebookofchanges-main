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
    const judgmentContent = document.getElementById('modern-judgment-content');
    const hexagramTitle = document.getElementById('modern-hexagram-title');
    const hexagramLines = document.getElementById('modern-hexagram-lines');
    const changingWarning = document.getElementById('modern-changing-warning');
    const changedShell = document.getElementById('modern-changed-shell');
    const changedSummary = document.getElementById('modern-changed-summary');
    const changedSummaryTitle = changedSummary.querySelector('.modern-changed-summary-title');
    const changedSummaryHint = changedSummary.querySelector('.modern-changed-summary-hint');
    const changedTitle = document.getElementById('modern-changed-title');
    const changedLines = document.getElementById('modern-changed-lines');
    const changedSearchHelp = document.getElementById('modern-changed-search-help');
    const changedSearchQuery = document.getElementById('modern-changed-search-query');
    const changedSearchCopyBtn = document.getElementById('modern-changed-search-copy');
    const changedSearchLink = document.getElementById('modern-changed-search-link');
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
    const questionCoachPills = document.querySelectorAll('.modern-coach-pill');
    const questionHelper = document.getElementById('modern-question-helper');
    const helperTemplates = document.querySelectorAll('.modern-helper-template');
    const followupButtons = document.querySelectorAll('.modern-followup-btn');
    const recentQuestions = document.getElementById('modern-recent-questions');
    const recentEmpty = document.getElementById('modern-recent-empty');
    const recentList = document.getElementById('modern-recent-list');
    const recentClearBtn = document.getElementById('modern-recent-clear');
    const RECENT_QUESTION_KEY = 'xinan_recent_questions';
    const RECENT_QUESTION_LIMIT = 3;
    const BLOCKED_ANALYTICS_KEYS = new Set(['question', 'content', 'text', 'message', 'email', 'phone', 'name', 'token', 'key', 'password', 'secret']);

    const state = {
        question: '',
        hexagramNumber: null,
        changingPositions: [],
        changedHexagramNumber: null,
        questionSource: 'manual',
        hasTrackedQuestionStart: false,
        hasTrackedDraftStart: false,
        isSubmitting: false,
        activeRequestId: null,
        activeController: null,
        interpretationComplete: false,
    };

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

    function setMessage(message = '') {
        messageEl.textContent = message;
    }

    function setStatus(text) {
        statusPill.textContent = text;
    }

    function setSubmitState(text, disabled) {
        submitBtn.textContent = text;
        submitBtn.disabled = disabled;
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

    function setJudgmentLoadingState(isPending, text = '') {
        judgmentContent.classList.toggle('is-pending', isPending);
        judgmentContent.textContent = isPending ? (text || '正在提炼这一卦的落点') : text;
    }

    function updateQuestionGuide() {
        if (!questionGuide) return;
        const text = questionInput.value.trim();
        if (!text) {
            questionGuide.textContent = '先写这件事本身，再补一句你最担心什么，会更容易解。';
            updateQuestionCoach();
            return;
        }

        if (text.length < 12) {
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
        const hasEvent = normalized.length >= 12;
        const hasWorry = /(担心|害怕|怕|焦虑|纠结|放不下|犹豫|后悔|更累|卡住|卡在)/.test(normalized);
        const hasDirection = /(要不要|该不该|会不会|能不能|适不适合|怎么办|怎么做|往哪边|继续|放弃|主动|等待|推进|先稳)/.test(normalized);
        const maybeMultiple = /(还有|另外|同时|顺便|以及|和.*一起|，.*，.*，)/.test(normalized) && normalized.length > 42;
        return { hasEvent, hasWorry, hasDirection, maybeMultiple };
    }

    function updateQuestionCoach() {
        if (!questionCoach || !questionCoachStatus) return;
        const text = questionInput.value.trim();
        const analysis = analyzeQuestionDraft(text);

        if (!text) {
            questionCoachStatus.textContent = '先把事情写出来，我会提醒你还差哪一句。';
        } else if (!analysis.hasEvent) {
            questionCoachStatus.textContent = '现在还像一句心情，可以先补清楚：到底是哪件事让你卡住。';
        } else if (!analysis.hasWorry) {
            questionCoachStatus.textContent = '这件事已经有了，再补一句你最担心什么，解读会更贴近你。';
        } else if (!analysis.hasDirection) {
            questionCoachStatus.textContent = '已经说到心里那层了，再补一句你最想知道要不要、该不该或会不会什么。';
        } else if (analysis.maybeMultiple) {
            questionCoachStatus.textContent = '信息很完整了，建议先收成一件最卡的事来问，结果会更清楚。';
        } else {
            questionCoachStatus.textContent = '这个问题已经能问了：有事情、有担心，也有你想知道的方向。';
        }

        questionCoachPills.forEach((button) => {
            const field = button.dataset.coachField;
            button.hidden = (
                (field === 'worry' && analysis.hasWorry)
                || (field === 'direction' && analysis.hasDirection)
                || (field === 'oneThing' && !analysis.maybeMultiple && text.length > 0)
            );
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
            worry: '我担心的是：。',
            direction: '我最想知道的是：。',
            oneThing: '这次我先只问这一件事：。',
        };
        const addition = additions[field] || additions.direction;
        const nextValue = text ? `${text}\n${addition}` : addition;
        questionInput.value = nextValue;
        state.questionSource = 'coach';
        markQuestionDraftStarted('coach');
        updateQuestionGuide();
        questionInput.focus();
        moveCaretToPromptBlank(addition.replace('。', ''));
        trackEvent('question_coach_click', {
            field,
            questionLength: questionInput.value.trim().length,
        });
    }

    function buildInstantJudgmentPreview() {
        const changingCount = state.changingPositions.length;
        if (changingCount >= 3) {
            return '变数不少，先稳一稳。';
        }
        if (changingCount >= 1) {
            return '别急着定，这事还在变。';
        }
        return '先看清局面，再决定要不要动。';
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

    function shouldStickStreamingContent(target) {
        if (!target) return false;
        const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        return distanceFromBottom <= 80;
    }

    function renderStreamingText(target, text, cursorId) {
        if (!target) return;
        const keepViewportPinned = shouldStickStreamingContent(target);
        const html = escapeHtml(text).replace(/\n/g, '<br>');
        target.innerHTML = `${html}<span class="cursor cursor-blink" id="${cursorId}"></span>`;
        if (keepViewportPinned) {
            target.scrollTop = target.scrollHeight;
        }
    }

    function renderStaticText(target, text) {
        if (!target) return;
        target.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
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

    function updateChangedStory() {
        const currentTitle = String(hexagramTitle.textContent || '').trim();
        const futureTitle = String(changedTitle.textContent || '').trim();
        const positionNames = formatChangingPositions(state.changingPositions);
        const searchKeyword = buildHexagramSearchKeyword(futureTitle);

        currentExplanation.textContent = currentTitle
            ? `${currentTitle}是你现在面对这件事的样子，先看清局面，再决定怎么动。`
            : '本卦会显示这件事眼下的局面。';

        changingExplanation.textContent = positionNames
            ? `${positionNames}在动，说明最不稳定、最容易改向的地方在这里，这也是你最该留神的变化点。`
            : '动爻会告诉你，这件事最不稳定、最容易改向的地方在哪。';

        futureExplanation.textContent = futureTitle
            ? `如果这些变化继续发展，这件事更可能会走向 ${futureTitle} 这条路。`
            : '之卦会显示，如果这些变化继续发展，事情更可能会走成什么样。';

        changedSearchHelp.textContent = futureTitle
            ? '想自己查的话，直接搜这组词就够了。先看卦名和原文，再对照你现在这件事去理解。'
            : '想自己查的话，这里会给你一个能直接搜索的关键词。';
        changedSearchQuery.textContent = searchKeyword;
        changedSearchCopyBtn.dataset.searchKeyword = searchKeyword;
        changedSearchLink.href = `https://www.baidu.com/s?wd=${encodeURIComponent(searchKeyword)}`;
    }

    function setChangedSummary(copy, hint) {
        if (changedSummaryTitle) changedSummaryTitle.textContent = copy;
        if (changedSummaryHint) changedSummaryHint.textContent = hint;
    }

    function buildHexagramSearchKeyword(title) {
        const normalized = String(title || '').trim();
        const match = normalized.match(/^(第[一二三四五六七八九十百零〇0-9]+卦)\s*([^\s]+)/);
        if (match) {
            return `${match[1]} ${match[2]}卦 原文`;
        }
        if (normalized) {
            return `${normalized} 原文`;
        }
        return '第五卦 需卦 原文';
    }

    function compactText(text, maxLength = 56) {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        if (normalized.length <= maxLength) return normalized;
        return `${normalized.slice(0, maxLength - 1)}…`;
    }

    function resetInterpretationBlocks(options = {}) {
        const { preserveJudgment = false } = options;
        if (!preserveJudgment) {
            setJudgmentLoadingState(true, '正在提炼这一卦的落点');
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
            ? `关于：${compactText(state.question, 46)}`
            : '关于你现在最放不下的这件事';
        shareJudgment.textContent = judgmentText || '先把心放稳一点。';
        shareQuote.textContent = compactText(
            emotionLine
            || takeawayLine
            || emotionText
            || '先把心放稳一点，答案会慢慢清楚。',
            46
        );
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
        const nextQuestion = buildFollowupQuestion(kind);
        trackEvent('followup_question_click', {
            kind,
            previousQuestionLength: String(state.question || '').length,
            hadChanging: state.changingPositions.length > 0,
        });

        questionInput.value = nextQuestion;
        state.questionSource = 'followup';
        markQuestionDraftStarted('followup');
        updateQuestionGuide();
        setMessage('已经帮你换成同一件事的追问角度，可以直接改两句再问。');
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

    function cleanJudgmentCandidate(text) {
        const normalized = trimToFirstSentence(text)
            .replace(/^[\d一二三四五六七八九十]+[\.、)\s]+/, '')
            .replace(/^[-*•]\s+/, '')
            .trim();

        if (!normalized) return '';

        const shortMatch = normalized.match(/^(.{10,34}?[。！？!?]|.{10,34})/);
        return (shortMatch ? shortMatch[1] : normalized).trim();
    }

    function isUsableJudgmentCandidate(text) {
        const candidate = String(text || '').trim();
        if (!candidate) return false;
        if (candidate.length < 6) return false;
        if (candidate.length > 36) return false;
        if (/[：:]\s*$/.test(candidate)) return false;
        if (/[，、（(]\s*$/.test(candidate)) return false;
        if (/(你现在卡在哪里|这件事的势头|你最该注意|你可以怎么做|给你一句话)/.test(candidate)) {
            return false;
        }
        return true;
    }

    function deriveFallbackJudgment(mainText, emotionText) {
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

        return '先别急着定，这件事还要再看清一点。';
    }

    function renderInterpretationSections(rawText, options = {}) {
        const { allowFallback = false } = options;
        const normalized = rawText.replace(/\r/g, '');
        const judgmentText = extractSection(normalized, '[一句判断]', ['[定心话]', '[大白话]']);
        const emotionText = extractSection(normalized, '[定心话]', ['[大白话]']);
        const mainText = extractSection(normalized, '[大白话]');

        if (judgmentText) {
            const cleanedJudgment = cleanJudgmentCandidate(judgmentText) || judgmentText.trim();
            if (isUsableJudgmentCandidate(cleanedJudgment)) {
                setJudgmentLoadingState(false, cleanedJudgment);
            }
        } else if (allowFallback && (emotionText || mainText)) {
            setJudgmentLoadingState(false, deriveFallbackJudgment(mainText, emotionText));
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
            setJudgmentLoadingState(false, buildInstantJudgmentPreview());
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
        setSubmitState('正在陪你把这件事看清一点...', true);
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
            headers: { 'Content-Type': 'application/json' },
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
        if (emotionCursor) emotionCursor.classList.add('hidden');
        if (mainCursor) mainCursor.classList.add('hidden');
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

        trackEvent('submit_click', {
            questionSource: state.questionSource,
            helperOpen: Boolean(questionHelper?.open),
        });

        setSubmitState('正在起卦...', true);
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
        resetInterpretationBlocks();
        currentExplanation.textContent = '本卦会显示这件事眼下的局面。';
        changingExplanation.textContent = '动爻会告诉你，这件事最不稳定、最容易改向的地方在哪。';
        futureExplanation.textContent = '之卦会显示，如果这些变化继续发展，事情更可能会走成什么样。';
        setJudgmentLoadingState(true, '正在提炼这一卦的落点');
        renderStaticText(emotionContent, '先等一会儿，这一卦正在慢慢显出来。');
        renderStaticText(mainContent, '我们会先给你一个轮廓，再陪你把这件事慢慢讲清楚。');

        try {
            const response = await fetch('/api/divine', {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });
            if (!isActiveRequest(requestId)) return;

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '起卦失败');
            }

            const data = await response.json();
            if (!isActiveRequest(requestId)) return;
            state.question = question;
            state.hexagramNumber = data.hexagramNumber;
            state.changingPositions = data.changingPositions || [];
            state.changedHexagramNumber = data.changedHexagramNumber || null;
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
                setChangedSummary('本卦看现在，动爻看变化点，之卦看接下来可能的走势', '点开看看这件事接下来可能怎么走');
            }

            if (data.changedTitle && Array.isArray(data.changedYaoLines)) {
                changedTitle.textContent = data.changedTitle;
                renderHexagram(changedLines, data.changedYaoLines || []);
                changedShell.hidden = false;
                changedShell.open = false;
                updateChangedStory();
            } else {
                setChangedSummary('本卦看现在，动爻看变化点，之卦看接下来可能的走势', '点开看看这件事接下来可能怎么走');
                changedSearchQuery.textContent = '第五卦 需卦 原文';
                changedSearchCopyBtn.dataset.searchKeyword = '第五卦 需卦 原文';
                changedSearchLink.href = `https://www.baidu.com/s?wd=${encodeURIComponent('第五卦 需卦 原文')}`;
            }

            setJudgmentLoadingState(false, buildInstantJudgmentPreview());
            await startInterpretation(requestId, controller);
        } catch (error) {
            if (error?.name === 'AbortError' || !isActiveRequest(requestId)) {
                return;
            }
            const failedDuringInterpretation = statusPill.textContent === '正在解读';
            if (failedDuringInterpretation) {
                setMessage('卦已经起好，但大白话解读暂时没连上。可以稍后再试，或换个问法重新问。');
                renderInterpretationFailure();
            } else {
                setMessage(`这次没能顺利起卦：${error.message}`);
                setStatus('暂时失败');
                setJudgmentLoadingState(false, '这次没有顺利展开，先别急。');
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
    }

    function resetFlow() {
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
        abortActiveRequest();
        trackEvent('rephrase_click', {
            hadResult: Boolean(state.hexagramNumber),
        });
        setMessage('');
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
    resetBtn.addEventListener('click', resetFlow);
    rephraseBtn.addEventListener('click', rephraseFlow);
    shareBtn.addEventListener('click', saveShareImage);
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
    changedSearchCopyBtn.addEventListener('click', async () => {
        const keyword = changedSearchCopyBtn.dataset.searchKeyword || changedSearchQuery.textContent.trim();
        trackEvent('copy_changed_search', {
            changedHexagramNumber: state.changedHexagramNumber,
        });
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(keyword);
                setMessage(`已帮你复制：${keyword}`);
            } else {
                setMessage(`你可以直接搜：${keyword}`);
            }
        } catch (error) {
            setMessage(`复制失败了，你可以直接搜：${keyword}`);
        }
    });
    changedSearchLink.addEventListener('click', () => {
        trackEvent('search_changed_click', {
            changedHexagramNumber: state.changedHexagramNumber,
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
    trackEvent('page_view', {
        isReturning: readRecentQuestions().length > 0,
    });
});
