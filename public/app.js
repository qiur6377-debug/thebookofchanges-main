document.addEventListener('DOMContentLoaded', () => {
    // 元素引用
    const container = document.querySelector('.container');
    const homeSection = document.getElementById('home-section');
    const questionSection = document.getElementById('question-section');
    const animationSection = document.getElementById('animation-section');
    const resultSection = document.getElementById('result-section');
    const yarrowSection = document.getElementById('yarrow-section');
    const baziSection = document.getElementById('bazi-section');
    const shengxiaoSection = document.getElementById('shengxiao-section');
    const luohouSection = document.getElementById('luohou-section');
    
    const zhouyiEntryBtn = document.getElementById('zhouyi-entry-btn');
    const baziEntryBtn = document.getElementById('bazi-entry-btn');
    const shengxiaoEntryBtn = document.getElementById('shengxiao-entry-btn');
    const luohouEntryBtn = document.getElementById('luohou-entry-btn');
    const zhouyiBackBtn = document.getElementById('zhouyi-back-btn');
    const questionInput = document.getElementById('question');
    const divineBtn = document.getElementById('divine-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const hexTitle = document.getElementById('hexagram-title');
    const hexLinesContainer = document.getElementById('hexagram-lines');
    const hexDesc = document.getElementById('hexagram-desc');
    
    // 新增引用
    const interpretBtn = document.getElementById('interpret-btn');
    const interpWrapper = document.getElementById('interpretation-wrapper');
    const interpContent = document.getElementById('interpretation-content');
    const interpContentModern = document.getElementById('interpretation-content-modern');
    const changingWarning = document.getElementById('changing-warning');
    const changedHexagram = document.getElementById('changed-hexagram');
    const changedHexTitle = document.getElementById('changed-hexagram-title');
    const changedHexLines = document.getElementById('changed-hexagram-lines');

    // 存储当前问题的状态，用于第二次发请求
    let currentHexagramNumber = null;
    let currentQuestion = '';
    let currentChangingPositions = [];
    let currentChangedHexagramNumber = null;

    // 视图切换辅助函数
    function showSection(section) {
        container.classList.toggle('wide-layout', section === luohouSection);
        homeSection.classList.remove('active');
        homeSection.classList.add('hidden');
        questionSection.classList.remove('active');
        questionSection.classList.add('hidden');
        animationSection.classList.remove('active');
        animationSection.classList.add('hidden');
        resultSection.classList.remove('active');
        resultSection.classList.add('hidden');
        yarrowSection.classList.remove('active');
        yarrowSection.classList.add('hidden');
        baziSection.classList.remove('active');
        baziSection.classList.add('hidden');
        shengxiaoSection.classList.remove('active');
        shengxiaoSection.classList.add('hidden');
        luohouSection.classList.remove('active');
        luohouSection.classList.add('hidden');

        // 延迟添加 active 触发动画
        setTimeout(() => {
            section.classList.remove('hidden');
            // 确保在下一帧添加 active，避免 CSS 动画问题
            requestAnimationFrame(() => {
                section.classList.add('active');
            });
        }, 10);
    }

    // 绘制爻线（0为阴，1为阳），动爻位置高亮
    function renderLines(yaoArray, changingPositions) {
        hexLinesContainer.innerHTML = '';
        const changingSet = new Set(changingPositions || []);
        yaoArray.forEach((yao, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'yao-line-wrapper';
            
            const line = document.createElement('div');
            line.className = yao === 1 ? 'yao-line yao-yang' : 'yao-line yao-yin';
            // 动爻高亮
            if (changingSet.has(i)) {
                line.classList.add('yao-changing');
            }
            wrapper.appendChild(line);
            
            hexLinesContainer.appendChild(wrapper);
        });
    }

    // 绘制之卦爻线（缩小版）
    function renderChangedLines(yaoArray) {
        changedHexLines.innerHTML = '';
        yaoArray.forEach(yao => {
            const wrapper = document.createElement('div');
            wrapper.className = 'yao-line-wrapper';
            const line = document.createElement('div');
            line.className = yao === 1 ? 'yao-line yao-yang' : 'yao-line yao-yin';
            wrapper.appendChild(line);
            changedHexLines.appendChild(wrapper);
        });
    }

    // 处理起卦请求
    async function startDivination() {
        const question = questionInput.value.trim();
        if (!question) {
            alert('请先输入您想要占卜的具体事情');
            questionInput.focus();
            return;
        }

        // 切换到动画视图
        showSection(animationSection);
        divineBtn.disabled = true;

        // 模拟占卜过程（让用户感受仪式感，延迟2秒）
        setTimeout(async () => {
            try {
                // 发送 API 请求，建立起卦连接
                const response = await fetch('/api/divine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || '请求失败');
                }

                // 读取卦象数据
                const data = await response.json();
                
                // 已经切换到结果页
                showSection(resultSection);
                
                // 将数据存入全局
                currentQuestion = question;
                currentHexagramNumber = data.hexagramNumber;
                currentChangingPositions = data.changingPositions || [];
                currentChangedHexagramNumber = data.changedHexagramNumber;
                
                // 渲染基础信息
                hexTitle.textContent = data.title;
                renderLines(data.yaoLines, data.changingPositions);
                hexDesc.innerHTML = '';
                
                // 渲染动爻警告
                const yaoNames = ['初', '二', '三', '四', '五', '上'];
                if (data.changingPositions && data.changingPositions.length > 0) {
                    const posNames = data.changingPositions.map(i => yaoNames[i] + '爻').join('、');
                    changingWarning.innerHTML = `⚠️ 此卦${posNames}动，说明此事尚有变数，当前状态可能转变`;
                    changingWarning.style.display = 'block';
                } else {
                    changingWarning.style.display = 'none';
                }
                
                // 渲染之卦
                if (data.changedTitle && data.changedYaoLines) {
                    changedHexTitle.textContent = data.changedTitle;
                    renderChangedLines(data.changedYaoLines);
                    changedHexagram.style.display = 'block';
                } else {
                    changedHexagram.style.display = 'none';
                }
                
                // 此时还未解卦，显示解卦按钮，隐藏解析内容
                interpretBtn.style.display = 'block';
                interpWrapper.style.display = 'none';

            } catch (error) {
                console.error('Fetch 错误:', error);
                alert('服务异常，请稍后再试。' + error.message);
                showSection(questionSection);
                divineBtn.disabled = false;
            }
        }, 3000); // 铜钱动画等演3秒钟
    }

    // 监听：解卦按钮
    async function startInterpretation() {
        // 隐藏自身，显示外壳
        interpretBtn.style.display = 'none';
        interpWrapper.style.display = 'block';
        
        // 清理旧的文本，只留 cursor
        interpContent.innerHTML = '<span class="cursor" id="typer-cursor"></span>';
        if (interpContentModern) {
            interpContentModern.innerHTML = '<span class="cursor hidden" id="typer-cursor-modern"></span>';
        }
                
        let currentText = '';
        let isModern = false;

        try {
            // 发送解卦请求
            const response = await fetch('/api/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion,
                    hexagramNumber: currentHexagramNumber,
                    changingPositions: currentChangingPositions,
                    changedHexagramNumber: currentChangedHexagramNumber
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '解卦失败');
            }

            // 读取流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                    
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // 保留未完整的行

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;
                        
                    const dataStr = trimmed.slice(6);
                    if (dataStr === '[DONE]') continue;

                    try {
                        const data = JSON.parse(dataStr);
                            
                        if (data.type === 'content') {
                            currentText += data.text;
                            
                            // 容错正则：匹配 [大白话] 或 ===大白话=== 及其各种变体
                            const splitRegex = /\s*(?:={2,}\s*大白话\s*={2,}|\[大白话\])\s*/;
                            if (!isModern && splitRegex.test(currentText)) {
                                isModern = true;
                                const parts = currentText.split(splitRegex);
                                // 锁定古文部分并隐藏光标
                                if (parts[0]) {
                                    interpContent.innerHTML = parts[0].trim().replace(/\n/g, '<br>');
                                }
                                const cursor1 = document.getElementById('typer-cursor');
                                if(cursor1) cursor1.classList.add('hidden');
                                    
                                // 显示白话部分光标
                                const cursor2 = document.getElementById('typer-cursor-modern');
                                if(cursor2) cursor2.classList.remove('hidden');
                                    
                                currentText = (parts[1] || '').trim();
                            }

                            if (!isModern) {
                                interpContent.innerHTML = currentText.replace(/\n/g, '<br>') + '<span class="cursor" id="typer-cursor"></span>';
                                interpContent.scrollTop = interpContent.scrollHeight;
                            } else {
                                interpContentModern.innerHTML = currentText.replace(/\n/g, '<br>') + '<span class="cursor" id="typer-cursor-modern"></span>';
                                interpContentModern.scrollTop = interpContentModern.scrollHeight;
                            }
                        }
                        // 处理服务端抛出的错误指令
                        else if (data.type === 'error') {
                            alert('解卦出错：' + data.message);
                            return;
                        }
                    } catch (e) {
                        console.error('JSON解析错误', e, dataStr);
                    }
                }
            }

            // 结束后移除闪烁光标
            const cursor = document.getElementById('typer-cursor');
            if(cursor) cursor.classList.add('hidden');
            const cursorMod = document.getElementById('typer-cursor-modern');
            if(cursorMod) cursorMod.classList.add('hidden');

        } catch (error) {
            console.error('Fetch 错误:', error);
            alert('服务异常，请稍后再试。' + error.message);
            interpretBtn.style.display = 'block'; // 让用户可以重试
            interpWrapper.style.display = 'none';
        }
    }

    // 绑定事件
    zhouyiEntryBtn.addEventListener('click', () => showSection(questionSection));
    divineBtn.addEventListener('click', startDivination);
    interpretBtn.addEventListener('click', startInterpretation);
    zhouyiBackBtn.addEventListener('click', () => showSection(homeSection));
    
    resetBtn.addEventListener('click', () => {
        questionInput.value = '';
        showSection(questionSection);
        divineBtn.disabled = false;
    });

    // ============ 八字排盘 ============
    const baziBackBtn = document.getElementById('bazi-back-btn');
    const baziSubmitBtn = document.getElementById('bazi-submit-btn');
    const baziCalendar = document.getElementById('bazi-calendar');
    const baziGender = document.getElementById('bazi-gender');
    const baziYear = document.getElementById('bazi-year');
    const baziMonth = document.getElementById('bazi-month');
    const baziDay = document.getElementById('bazi-day');
    const baziHour = document.getElementById('bazi-hour');
    const baziLeapMonth = document.getElementById('bazi-leap-month');
    const baziResultWrapper = document.getElementById('bazi-result-wrapper');
    const baziResultTitle = document.getElementById('bazi-result-title');
    const baziResult = document.getElementById('bazi-result');
    const baziInterpretBtn = document.getElementById('bazi-interpret-btn');
    const baziInterpretWrapper = document.getElementById('bazi-interpret-wrapper');
    const baziInterpretContent = document.getElementById('bazi-interpret-content');
    const reverseYearPillar = document.getElementById('reverse-year-pillar');
    const reverseMonthPillar = document.getElementById('reverse-month-pillar');
    const reverseDayPillar = document.getElementById('reverse-day-pillar');
    const reverseHourPillar = document.getElementById('reverse-hour-pillar');
    const reverseStartYear = document.getElementById('reverse-start-year');
    const reverseEndYear = document.getElementById('reverse-end-year');
    const baziReverseSubmitBtn = document.getElementById('bazi-reverse-submit-btn');
    let currentBaziOutput = '';

    function updateLeapMonthState() {
        const isLunar = baziCalendar.value === 'lunar';
        baziLeapMonth.disabled = !isLunar;
        if (!isLunar) baziLeapMonth.checked = false;
    }

    function readBaziPayload() {
        return {
            calendar: baziCalendar.value,
            gender: baziGender.value,
            year: baziYear.value,
            month: baziMonth.value,
            day: baziDay.value,
            hour: baziHour.value,
            leapMonth: baziLeapMonth.checked
        };
    }

    async function startBaziReading() {
        const payload = readBaziPayload();
        if (!payload.year || !payload.month || !payload.day || payload.hour === '') {
            alert('请把出生年月日时填写完整');
            return;
        }

        const originalText = baziSubmitBtn.textContent;
        baziSubmitBtn.disabled = true;
        baziSubmitBtn.textContent = '排盘中...';
        baziResultWrapper.style.display = 'block';
        baziResultTitle.textContent = '排盘结果';
        baziResult.textContent = '正在推演四柱，请稍候...';
        baziInterpretBtn.style.display = 'none';
        baziInterpretWrapper.style.display = 'none';
        baziInterpretContent.innerHTML = '<span class="cursor" id="bazi-typer-cursor"></span>';
        currentBaziOutput = '';

        try {
            const response = await fetch('/api/bazi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '八字排盘失败');
            }

            currentBaziOutput = data.output || '';
            baziResult.textContent = currentBaziOutput || '排盘完成，但脚本没有返回内容';
            baziInterpretBtn.style.display = currentBaziOutput ? 'block' : 'none';
        } catch (error) {
            baziResult.textContent = error.message;
        } finally {
            baziSubmitBtn.disabled = false;
            baziSubmitBtn.textContent = originalText;
        }
    }

    function readBaziReversePayload() {
        return {
            yearPillar: reverseYearPillar.value,
            monthPillar: reverseMonthPillar.value,
            dayPillar: reverseDayPillar.value,
            hourPillar: reverseHourPillar.value,
            startYear: reverseStartYear.value,
            endYear: reverseEndYear.value
        };
    }

    async function startBaziReverseReading() {
        const payload = readBaziReversePayload();
        if (!payload.yearPillar || !payload.monthPillar || !payload.dayPillar || !payload.hourPillar) {
            alert('请把年柱、月柱、日柱、时柱填写完整');
            return;
        }

        const originalText = baziReverseSubmitBtn.textContent;
        baziReverseSubmitBtn.disabled = true;
        baziReverseSubmitBtn.textContent = '反推中...';
        baziResultWrapper.style.display = 'block';
        baziResultTitle.textContent = '反推结果';
        baziResult.textContent = '正在反推可能出生时间，请稍候...';
        baziInterpretBtn.style.display = 'none';
        baziInterpretWrapper.style.display = 'none';
        baziInterpretContent.innerHTML = '<span class="cursor" id="bazi-typer-cursor"></span>';
        currentBaziOutput = '';

        try {
            const response = await fetch('/api/bazi/reverse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '四柱反推失败');
            }

            baziResult.textContent = data.output || '反推完成，但脚本没有返回内容';
        } catch (error) {
            baziResult.textContent = error.message;
        } finally {
            baziReverseSubmitBtn.disabled = false;
            baziReverseSubmitBtn.textContent = originalText;
        }
    }

    async function startBaziInterpretation() {
        if (!currentBaziOutput) {
            alert('请先完成八字排盘');
            return;
        }

        baziInterpretBtn.disabled = true;
        baziInterpretBtn.textContent = '解读中...';
        baziInterpretWrapper.style.display = 'block';
        baziInterpretContent.innerHTML = '<span class="cursor" id="bazi-typer-cursor"></span>';

        let currentText = '';

        function renderBaziInterpretation(text, withCursor) {
            const formalStart = text.search(/整体印象[：:]/);
            const visibleText = formalStart > 0 ? text.slice(formalStart) : text;
            const cursor = withCursor ? '<span class="cursor" id="bazi-typer-cursor"></span>' : '';
            baziInterpretContent.innerHTML = visibleText.replace(/\n/g, '<br>') + cursor;
            baziInterpretContent.scrollTop = baziInterpretContent.scrollHeight;
        }

        try {
            const response = await fetch('/api/bazi/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baziOutput: currentBaziOutput })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '八字解读失败');
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
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    const dataStr = trimmed.slice(6);
                    if (dataStr === '[DONE]') continue;

                    let data;
                    try {
                        data = JSON.parse(dataStr);
                    } catch (error) {
                        console.error('八字解读 JSON 解析错误', error, dataStr);
                        continue;
                    }

                    if (data.type === 'content') {
                        currentText += data.text;
                        renderBaziInterpretation(currentText, true);
                    } else if (data.type === 'error') {
                        throw new Error(data.message);
                    }
                }
            }

            renderBaziInterpretation(currentText, false);
            const cursor = document.getElementById('bazi-typer-cursor');
            if (cursor) cursor.classList.add('hidden');
        } catch (error) {
            baziInterpretContent.textContent = error.message || '八字解读失败，请稍后再试';
        } finally {
            baziInterpretBtn.disabled = false;
            baziInterpretBtn.textContent = '重新生成大白话解读';
        }
    }

    baziEntryBtn.addEventListener('click', () => {
        updateLeapMonthState();
        showSection(baziSection);
    });
    baziBackBtn.addEventListener('click', () => showSection(homeSection));
    baziSubmitBtn.addEventListener('click', startBaziReading);
    baziReverseSubmitBtn.addEventListener('click', startBaziReverseReading);
    baziInterpretBtn.addEventListener('click', startBaziInterpretation);
    baziCalendar.addEventListener('change', updateLeapMonthState);

    // ============ 生肖合婚 ============
    const shengxiaoSelect = document.getElementById('shengxiao-select');
    const shengxiaoSubmitBtn = document.getElementById('shengxiao-submit-btn');
    const shengxiaoBackBtn = document.getElementById('shengxiao-back-btn');
    const shengxiaoResultWrapper = document.getElementById('shengxiao-result-wrapper');
    const shengxiaoResult = document.getElementById('shengxiao-result');

    async function startShengxiaoReading() {
        const originalText = shengxiaoSubmitBtn.textContent;
        shengxiaoSubmitBtn.disabled = true;
        shengxiaoSubmitBtn.textContent = '查询中...';
        shengxiaoResultWrapper.style.display = 'block';
        shengxiaoResult.textContent = '正在查合冲刑害关系...';

        try {
            const response = await fetch('/api/shengxiao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shengxiao: shengxiaoSelect.value })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '生肖合婚查询失败');
            }

            shengxiaoResult.textContent = data.output || '查询完成，但脚本没有返回内容';
        } catch (error) {
            shengxiaoResult.textContent = error.message;
        } finally {
            shengxiaoSubmitBtn.disabled = false;
            shengxiaoSubmitBtn.textContent = originalText;
        }
    }

    shengxiaoEntryBtn.addEventListener('click', () => showSection(shengxiaoSection));
    shengxiaoBackBtn.addEventListener('click', () => showSection(homeSection));
    shengxiaoSubmitBtn.addEventListener('click', startShengxiaoReading);

    // ============ 罗喉择日 ============
    const luohouDate = document.getElementById('luohou-date');
    const luohouDays = document.getElementById('luohou-days');
    const luohouSubmitBtn = document.getElementById('luohou-submit-btn');
    const luohouBackBtn = document.getElementById('luohou-back-btn');
    const luohouResultWrapper = document.getElementById('luohou-result-wrapper');
    const luohouResult = document.getElementById('luohou-result');
    const luohouInterpretBtn = document.getElementById('luohou-interpret-btn');
    const luohouInterpretWrapper = document.getElementById('luohou-interpret-wrapper');
    const luohouInterpretContent = document.getElementById('luohou-interpret-content');
    let currentLuohouOutput = '';

    function formatLocalDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function ensureLuohouDefaults() {
        if (!luohouDate.value) {
            luohouDate.value = formatLocalDate(new Date());
        }
        if (!luohouDays.value) {
            luohouDays.value = '15';
        }
    }

    async function startLuohouReading() {
        ensureLuohouDefaults();
        const originalText = luohouSubmitBtn.textContent;
        luohouSubmitBtn.disabled = true;
        luohouSubmitBtn.textContent = '查询中...';
        luohouResultWrapper.style.display = 'block';
        luohouResult.textContent = '正在查罗喉日时与择日辅助...';
        luohouInterpretBtn.style.display = 'none';
        luohouInterpretWrapper.style.display = 'none';
        luohouInterpretContent.innerHTML = '<span class="cursor" id="luohou-typer-cursor"></span>';
        currentLuohouOutput = '';

        try {
            const response = await fetch('/api/luohou', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: luohouDate.value,
                    days: luohouDays.value
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '罗喉择日查询失败');
            }

            currentLuohouOutput = data.output || '';
            luohouResult.textContent = currentLuohouOutput || '查询完成，但脚本没有返回内容';
            luohouInterpretBtn.style.display = currentLuohouOutput ? 'block' : 'none';
        } catch (error) {
            luohouResult.textContent = error.message;
        } finally {
            luohouSubmitBtn.disabled = false;
            luohouSubmitBtn.textContent = originalText;
        }
    }

    async function startLuohouInterpretation() {
        if (!currentLuohouOutput) {
            alert('请先完成罗喉择日');
            return;
        }

        luohouInterpretBtn.disabled = true;
        luohouInterpretBtn.textContent = '解读中...';
        luohouInterpretWrapper.style.display = 'block';
        luohouInterpretContent.innerHTML = '<span class="cursor" id="luohou-typer-cursor"></span>';

        let currentText = '';

        function renderLuohouInterpretation(text, withCursor) {
            const cursor = withCursor ? '<span class="cursor" id="luohou-typer-cursor"></span>' : '';
            luohouInterpretContent.innerHTML = text.replace(/\n/g, '<br>') + cursor;
            luohouInterpretContent.scrollTop = luohouInterpretContent.scrollHeight;
        }

        try {
            const response = await fetch('/api/luohou/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ luohouOutput: currentLuohouOutput })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '罗喉择日解读失败');
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
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    const dataStr = trimmed.slice(6);
                    if (dataStr === '[DONE]') continue;

                    let data;
                    try {
                        data = JSON.parse(dataStr);
                    } catch (error) {
                        console.error('罗喉解读 JSON 解析错误', error, dataStr);
                        continue;
                    }

                    if (data.type === 'content') {
                        currentText += data.text;
                        renderLuohouInterpretation(currentText, true);
                    } else if (data.type === 'error') {
                        throw new Error(data.message);
                    }
                }
            }

            renderLuohouInterpretation(currentText, false);
            const cursor = document.getElementById('luohou-typer-cursor');
            if (cursor) cursor.classList.add('hidden');
        } catch (error) {
            luohouInterpretContent.textContent = error.message || '罗喉择日解读失败，请稍后再试';
        } finally {
            luohouInterpretBtn.disabled = false;
            luohouInterpretBtn.textContent = '重新生成大白话解读';
        }
    }

    luohouEntryBtn.addEventListener('click', () => {
        ensureLuohouDefaults();
        showSection(luohouSection);
    });
    luohouBackBtn.addEventListener('click', () => showSection(homeSection));
    luohouSubmitBtn.addEventListener('click', startLuohouReading);
    luohouInterpretBtn.addEventListener('click', startLuohouInterpretation);

    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            startDivination();
        }
    });

    // ============ 蓍草模式 ============
    const yarrowBtn = document.getElementById('yarrow-btn');
    const purifyBtn = document.getElementById('purify-btn');
    const purifyProgress = document.getElementById('purify-progress');
    const yarrowPurify = document.getElementById('yarrow-purify');
    const yarrowPlay = document.getElementById('yarrow-play');
    const yarrowCanvas = document.getElementById('yarrow-canvas');
    const yarrowNarration = document.getElementById('yarrow-narration');
    const changeProgressEl = document.getElementById('change-progress');
    const yaoDots = document.querySelectorAll('#yao-progress-dots .yao-dot');
    const yaoResultsList = document.getElementById('yao-results-list');
    const yarrowNextBtn = document.getElementById('yarrow-next-btn');
    const yarrowSkipBtn = document.getElementById('yarrow-skip-btn');

    let yarrowStateMachine = null;
    let stalksCanvas = null;

    // 入口按钮
    yarrowBtn.addEventListener('click', () => {
        const question = questionInput.value.trim();
        if (!question) {
            alert('请先输入您想要占卜的具体事情');
            questionInput.focus();
            return;
        }
        currentQuestion = question;
        showSection(yarrowSection);

        // 重置净手界面
        yarrowPurify.style.display = 'block';
        yarrowPlay.style.display = 'none';
        yaoResultsList.innerHTML = '';
        yarrowNextBtn.style.display = 'none';
        yarrowSkipBtn.style.display = 'block';
        yaoDots.forEach(dot => {
            dot.classList.remove('active', 'done', 'changing');
        });
    });

    // 净手静心
    if (purifyBtn && purifyProgress && window.YarrowModule) {
        const purifyStep = new window.YarrowModule.PurifyStep(purifyBtn, purifyProgress, () => {
            // 净手完成，切换到推演界面
            setTimeout(() => {
                yarrowPurify.style.display = 'none';
                yarrowPlay.style.display = 'block';
                initYarrowMode();
            }, 500);
        });

        // 重置时也要 reset purifyStep
        resetBtn.addEventListener('click', () => purifyStep.reset());

        // 净手阶段点亮步骤 0
        const purifyObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.style.display !== 'none') {
                    const guideSteps = document.querySelectorAll('.guide-step');
                    guideSteps.forEach(el => el.classList.remove('active-step'));
                    const activeStepEl = document.getElementById('guide-step-0');
                    if (activeStepEl) activeStepEl.classList.add('active-step');
                }
            });
        });
        purifyObserver.observe(yarrowPurify, { attributes: true, attributeFilter: ['style'] });
    }

    function initYarrowMode() {
        // 初始化 Canvas
        stalksCanvas = new window.YarrowModule.StalksCanvas(yarrowCanvas);

        // 初始化状态机
        yarrowStateMachine = new window.YarrowModule.YarrowStateMachine(stalksCanvas, {
            onNarration: (text) => {
                yarrowNarration.textContent = text;
            },
            onProgress: (yaoIdx, changeIdx, step) => {
                // 更新爻圆点
                yaoDots.forEach((dot, i) => {
                    if (i < yaoIdx) dot.classList.add('done');
                    else if (i === yaoIdx) { dot.classList.add('active'); dot.classList.remove('done'); }
                    else { dot.classList.remove('active', 'done'); }
                });
                // 更新变进度
                const yaoNames = ['初', '二', '三', '四', '五', '上'];
                if (changeIdx >= 0) {
                    changeProgressEl.textContent = `${yaoNames[yaoIdx]}爻 · 第${changeIdx + 1}变 · ${step}`;
                } else {
                    changeProgressEl.textContent = `${yaoNames[yaoIdx]}爻 · ${step}`;
                }

                // 更新左侧面侧边栏高亮步骤
                const guideSteps = document.querySelectorAll('.guide-step');
                guideSteps.forEach(el => el.classList.remove('active-step'));
                
                // 将名称映射到对应的步骤 ID
                let activeStepIndex = -1;
                if (step === '准备中') activeStepIndex = 1; // 准备中 => 取蓍
                else if (step.includes('分二')) activeStepIndex = 2;
                else if (step.includes('挂一')) activeStepIndex = 3;
                else if (step.includes('揲四')) activeStepIndex = 4;
                else if (step.includes('归奇')) activeStepIndex = 5;

                if (activeStepIndex >= 0) {
                    const activeStepEl = document.getElementById(`guide-step-${activeStepIndex}`);
                    if (activeStepEl) activeStepEl.classList.add('active-step');
                }
            },
            onYaoResult: (yaoIdx, text, isChanging) => {
                // 显示该爻结果
                const bar = document.createElement('div');
                bar.className = 'yao-result-bar' + (isChanging ? ' changing-bar' : '');
                bar.textContent = text;
                yaoResultsList.appendChild(bar);

                // 更新圆点状态
                const dot = yaoDots[yaoIdx];
                dot.classList.remove('active');
                dot.classList.add(isChanging ? 'changing' : 'done');

                // 如果还有下一爻，显示按钮让用户触发
                if (yaoIdx < 5) {
                    yarrowNextBtn.style.display = 'block';
                    yarrowNextBtn.textContent = '继续下一爻';
                }
            },
            onComplete: async (yaoValues, yaoLines) => {
                yarrowSkipBtn.style.display = 'none';
                yarrowNextBtn.style.display = 'block';
                yarrowNextBtn.textContent = '查看卦象';
                changeProgressEl.textContent = '六爻推演完毕！';
                yarrowNarration.textContent = '卦成。天机已现，请查看卦象。';

                // 点击查看卦象
                yarrowNextBtn.onclick = async () => {
                    yarrowNextBtn.style.display = 'none';
                    try {
                        // 将 yaoValues 发送给后端查表
                        const response = await fetch('/api/divine', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ question: currentQuestion, yaoValues })
                        });
                        if (!response.ok) throw new Error('起卦失败');
                        const data = await response.json();

                        // 切换到结果页
                        showSection(resultSection);
                        currentHexagramNumber = data.hexagramNumber;
                        currentChangingPositions = data.changingPositions || [];
                        currentChangedHexagramNumber = data.changedHexagramNumber;

                        hexTitle.textContent = data.title;
                        renderLines(data.yaoLines, data.changingPositions);
                        hexDesc.innerHTML = '';

                        // 动爻警告
                        const yaoNamesList = ['初', '二', '三', '四', '五', '上'];
                        if (data.changingPositions && data.changingPositions.length > 0) {
                            const posNames = data.changingPositions.map(i => yaoNamesList[i] + '爻').join('、');
                            changingWarning.innerHTML = `⚠️ 此卦${posNames}动，说明此事尚有变数，当前状态可能转变`;
                            changingWarning.style.display = 'block';
                        } else {
                            changingWarning.style.display = 'none';
                        }

                        // 之卦
                        if (data.changedTitle && data.changedYaoLines) {
                            changedHexTitle.textContent = data.changedTitle;
                            renderChangedLines(data.changedYaoLines);
                            changedHexagram.style.display = 'block';
                        } else {
                            changedHexagram.style.display = 'none';
                        }

                        interpretBtn.style.display = 'block';
                        interpWrapper.style.display = 'none';
                    } catch (error) {
                        alert('查表失败：' + error.message);
                    }
                };
            },
        });

        // 自动开始第一爻
        yarrowStateMachine.startYao();
    }

    // 继续下一爻按钮
    yarrowNextBtn.addEventListener('click', () => {
        if (!yarrowStateMachine || yarrowStateMachine.currentYao >= 6) return;
        yarrowNextBtn.style.display = 'none';
        yarrowSkipBtn.style.display = 'block';
        yarrowStateMachine.startYao();
    });

    // 跳过动画按钮
    yarrowSkipBtn.addEventListener('click', () => {
        if (!yarrowStateMachine) return;
        yarrowSkipBtn.style.display = 'none';
        yarrowNextBtn.style.display = 'none';
        yarrowStateMachine.skipCurrentYao();
    });

    // ============ 分享截图逻辑 ============
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            if (typeof window.html2canvas === 'undefined') {
                alert('截图插件尚未加载完成，请稍后再试。');
                return;
            }
            
            const originalText = shareBtn.textContent;
            shareBtn.textContent = '生成中...';
            shareBtn.disabled = true;

            const targetEl = document.getElementById('result-section');
            const actionsEl = document.getElementById('result-actions');
            
            // 截图前加上专用样式，确保黑底白字或特定的背景，防止透明
            targetEl.classList.add('share-mode');
            // 隐藏操作按钮
            actionsEl.classList.add('share-hide');

            try {
                const canvas = await window.html2canvas(targetEl, {
                    scale: window.devicePixelRatio || 2, // 确保清晰度
                    backgroundColor: '#1E1E1E', // 配合深色模式背景
                    useCORS: true, 
                });

                // 恢复原状
                targetEl.classList.remove('share-mode');
                actionsEl.classList.remove('share-hide');
                shareBtn.textContent = originalText;
                shareBtn.disabled = false;

                // 生成图片数据
                const imgData = canvas.toDataURL('image/png');
                
                // 触发下载
                const link = document.createElement('a');
                link.download = `周易算卦_${Date.now()}.png`;
                link.href = imgData;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (err) {
                console.error('截图失败', err);
                alert('截图生成失败，请稍后重试。');
                targetEl.classList.remove('share-mode');
                actionsEl.classList.remove('share-hide');
                shareBtn.textContent = originalText;
                shareBtn.disabled = false;
            }
        });
    }
});
