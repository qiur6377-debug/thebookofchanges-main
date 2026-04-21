/**
 * yarrow.js — 蓍草占卜高级模式
 * 功能：Canvas 草棍动画引擎 + 六爻推演状态机 + 净手静心交互
 * 依赖：无外部依赖，纯原生 Canvas 2D API
 */

(function () {
  'use strict';

  function vibrateFeedback(pattern) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // ============ 草棍对象 ============
  class Stalk {
    constructor(x, y, angle) {
      this.x = x;
      this.y = y;
      this.angle = angle;
      this.targetX = x;
      this.targetY = y;
      this.targetAngle = angle;
      this.color = '#B8A07A';
      this.width = 2;
      this.height = 44;
      this.opacity = 1;
    }

    moveTo(x, y, angle) {
      this.targetX = x;
      this.targetY = y;
      if (angle !== undefined) this.targetAngle = angle;
    }

    setColor(c) { this.color = c; }

    update(speed) {
      const s = speed || 0.08;
      this.x += (this.targetX - this.x) * s;
      this.y += (this.targetY - this.y) * s;
      this.angle += (this.targetAngle - this.angle) * s;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 1);
      ctx.fill();
      ctx.restore();
    }
  }

  // ============ Canvas 渲染引擎 ============
  class StalksCanvas {
    constructor(canvasEl) {
      this.canvas = canvasEl;
      this.ctx = canvasEl.getContext('2d');
      this.stalks = [];
      this.animating = false;
      this.resize();

      // 响应窗口大小变化
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const container = this.canvas.parentElement;
      const w = container.clientWidth;
      const h = Math.min(300, window.innerHeight * 0.4);
      this.canvas.width = w * (window.devicePixelRatio || 1);
      this.canvas.height = h * (window.devicePixelRatio || 1);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      this.W = w;
      this.H = h;
    }

    // 初始化 N 根草棍，散落在画布中央
    initStalks(count) {
      this.stalks = [];
      const cx = this.W / 2;
      const cy = this.H / 2;
      for (let i = 0; i < count; i++) {
        const x = cx + (Math.random() - 0.5) * (this.W * 0.6);
        const y = cy + (Math.random() - 0.5) * 80;
        const angle = (Math.random() - 0.5) * 0.6;
        this.stalks.push(new Stalk(x, y, angle));
      }
    }

    // 将草棍分成左右两堆
    splitIntoTwo(leftCount) {
      const gap = 60;
      const leftCx = this.W / 4;
      const rightCx = this.W * 3 / 4;
      const cy = this.H / 2;

      // 左堆
      for (let i = 0; i < leftCount; i++) {
        const stalk = this.stalks[i];
        const col = i % 8;
        const row = Math.floor(i / 8);
        stalk.moveTo(leftCx - 30 + col * 8, cy - 30 + row * 10, (Math.random() - 0.5) * 0.3);
        stalk.setColor('#B8A07A');
      }
      // 右堆
      for (let i = leftCount; i < this.stalks.length; i++) {
        const stalk = this.stalks[i];
        const j = i - leftCount;
        const col = j % 8;
        const row = Math.floor(j / 8);
        stalk.moveTo(rightCx - 30 + col * 8, cy - 30 + row * 10, (Math.random() - 0.5) * 0.3);
        stalk.setColor('#B8A07A');
      }
    }

    // 挂一：将指定草棍移到画布顶部
    hangOne(index) {
      const stalk = this.stalks[index];
      stalk.moveTo(this.W / 2, 30, 0);
      stalk.setColor('#E8A63A');
    }

    // 高亮余数草棍
    highlightRemainders(indices, color) {
      indices.forEach(idx => {
        if (this.stalks[idx]) {
          this.stalks[idx].setColor(color || '#E8553A');
        }
      });
    }

    // 将指定草棍移到顶部归拢区
    collectToTop(indices) {
      indices.forEach((idx, i) => {
        if (this.stalks[idx]) {
          this.stalks[idx].moveTo(this.W / 2 - 40 + i * 6, 30 + i * 2, 0);
          this.stalks[idx].setColor('#8B8371');
          this.stalks[idx].opacity = 0.5;
        }
      });
    }

    // 重新排列剩余草棍到中央
    regatherRemaining(indices) {
      const cx = this.W / 2;
      const cy = this.H / 2;
      indices.forEach((idx, i) => {
        if (this.stalks[idx]) {
          const col = i % 10;
          const row = Math.floor(i / 10);
          this.stalks[idx].moveTo(cx - 45 + col * 9, cy - 20 + row * 10, (Math.random() - 0.5) * 0.4);
          this.stalks[idx].setColor('#B8A07A');
          this.stalks[idx].opacity = 1;
        }
      });
    }

    // 动画循环
    startAnimation() {
      if (this.animating) return;
      this.animating = true;
      const loop = () => {
        if (!this.animating) return;
        this.ctx.clearRect(0, 0, this.W, this.H);
        for (const stalk of this.stalks) {
          stalk.update(0.06);
          stalk.draw(this.ctx);
        }
        requestAnimationFrame(loop);
      };
      loop();
    }

    stopAnimation() {
      this.animating = false;
    }
  }

  // ============ 蓍草占卜状态机 ============
  class YarrowStateMachine {
    constructor(canvas, uiCallbacks) {
      this.canvas = canvas;
      this.ui = uiCallbacks; // { onNarration, onYaoResult, onProgress, onComplete }
      this.yaoValues = [];     // 最终6个爻值
      this.yaoLines = [];      // 0/1
      this.currentYao = 0;     // 当前第几爻 (0-5)
      this.currentChange = 0;  // 当前第几变 (0-2)
      this.total = 49;         // 当前剩余蓍草总数
      this.removedIndices = []; // 已归拢的草棍索引
      this.changeRemainders = []; // 三变的余数记录
      
      this.skipMode = false;
      this.currentTimer = null;
      this.currentCallback = null;
      this.isRunning = false;
    }

    _wait(ms, cb) {
      if (!this.isRunning) return;
      this.currentCallback = cb;
      if (this.skipMode) {
        this.currentTimer = setTimeout(() => {
          this.currentTimer = null;
          this.currentCallback = null;
          cb();
        }, 0);
      } else {
        this.currentTimer = setTimeout(() => {
          this.currentTimer = null;
          this.currentCallback = null;
          cb();
        }, ms);
      }
    }

    skipCurrentYao() {
      if (this.skipMode) return;
      this.skipMode = true;
      this.canvas.stopAnimation();
      if (this.currentTimer !== null) {
        clearTimeout(this.currentTimer);
        this.currentTimer = null;
        if (this.currentCallback) {
          const cb = this.currentCallback;
          this.currentCallback = null;
          cb();
        }
      }
    }

    // 开始第 N 爻
    startYao() {
      this.isRunning = true;
      this.currentChange = 0;
      this.total = 49;
      this.removedIndices = [];
      this.changeRemainders = [];

      if (!this.skipMode) {
        this.canvas.initStalks(49);
        this.canvas.startAnimation();
      }
      this.ui.onProgress(this.currentYao, -1, '准备中');
      if (!this.skipMode) this.ui.onNarration(`【第${this.currentYao + 1}爻】大衍之数五十，其用四十有九`);

      // 延迟后自动开始第一变
      this._wait(1500, () => this.runChange());
    }

    // 执行一变
    runChange() {
      const activeIndices = [];
      for (let i = 0; i < 49; i++) {
        if (!this.removedIndices.includes(i)) activeIndices.push(i);
      }
      const total = activeIndices.length;

      this.ui.onProgress(this.currentYao, this.currentChange, '分二');
      vibrateFeedback(50);
      if (!this.skipMode) this.ui.onNarration('分而为二以象两仪...');

      const leftCount = Math.floor(Math.random() * (total - 2)) + 1;
      const leftIndices = activeIndices.slice(0, leftCount);
      const rightIndices = activeIndices.slice(leftCount);

      if (!this.skipMode) this._animateSplit(activeIndices, leftCount);

      this._wait(1000, () => {
        this.ui.onProgress(this.currentYao, this.currentChange, '挂一');
        vibrateFeedback(50);
        if (!this.skipMode) this.ui.onNarration('挂一以象三才...');
        const hungIdx = rightIndices[0];
        if (!this.skipMode) this.canvas.hangOne(hungIdx);
        const rightAfterHang = rightIndices.slice(1);

        this._wait(800, () => {
          this.ui.onProgress(this.currentYao, this.currentChange, '揲四');
          if (!this.skipMode) this.ui.onNarration('揲之以四以象四时...');

          const leftRem = leftCount % 4 === 0 ? 4 : leftCount % 4;
          const rightCount = rightAfterHang.length;
          const rightRem = rightCount % 4 === 0 ? 4 : rightCount % 4;

          const leftRemIndices = leftIndices.slice(leftIndices.length - leftRem);
          if (!this.skipMode) this.canvas.highlightRemainders(leftRemIndices, '#E8553A');

          this._wait(600, () => {
            const rightRemIndices = rightAfterHang.slice(rightAfterHang.length - rightRem);
            if (!this.skipMode) this.canvas.highlightRemainders(rightRemIndices, '#E8553A');

            this._wait(800, () => {
              this.ui.onProgress(this.currentYao, this.currentChange, '归奇');
              if (!this.skipMode) this.ui.onNarration('归奇于扐以象闰...');

              const removed = 1 + leftRem + rightRem;
              this.changeRemainders.push(removed);

              const collectIndices = [hungIdx, ...leftRemIndices, ...rightRemIndices];
              if (!this.skipMode) this.canvas.collectToTop(collectIndices);
              collectIndices.forEach(idx => this.removedIndices.push(idx));

              const remainingActive = [];
              for (let i = 0; i < 49; i++) {
                if (!this.removedIndices.includes(i)) remainingActive.push(i);
              }

              this._wait(600, () => {
                if (!this.skipMode) this.canvas.regatherRemaining(remainingActive);
                if (!this.skipMode) this.ui.onNarration(`第${this.currentChange + 1}变完毕，去${removed}根，余${remainingActive.length}根`);

                this.currentChange++;

                this._wait(800, () => {
                  if (this.currentChange < 3) {
                    this.runChange();
                  } else {
                    this.finishYao(remainingActive.length);
                  }
                });
              });
            });
          });
        });
      });
    }

    _animateSplit(activeIndices, leftCount) {
      const leftCx = this.canvas.W / 4;
      const rightCx = this.canvas.W * 3 / 4;
      const cy = this.canvas.H / 2;

      activeIndices.forEach((idx, i) => {
        const stalk = this.canvas.stalks[idx];
        if (i < leftCount) {
          const col = i % 8;
          const row = Math.floor(i / 8);
          stalk.moveTo(leftCx - 28 + col * 8, cy - 25 + row * 10, (Math.random() - 0.5) * 0.3);
        } else {
          const j = i - leftCount;
          const col = j % 8;
          const row = Math.floor(j / 8);
          stalk.moveTo(rightCx - 28 + col * 8, cy - 25 + row * 10, (Math.random() - 0.5) * 0.3);
        }
        stalk.setColor('#B8A07A');
      });
    }

    // 三变完毕后计算爻值
    finishYao(remaining) {
      const yaoValue = remaining / 4;
      const yaoMap = { 24: 6, 28: 7, 32: 8, 36: 9 };
      let finalValue = yaoMap[remaining];

      // 安全兜底
      if (!finalValue) {
        const rand = Math.random();
        if (rand < 1 / 16) finalValue = 9;
        else if (rand < 2 / 16) finalValue = 6;
        else if (rand < 7 / 16) finalValue = 7;
        else finalValue = 8;
      }

      this.yaoValues.push(finalValue);
      this.yaoLines.push(finalValue % 2 === 1 ? 1 : 0);

      const yaoNames = ['初', '二', '三', '四', '五', '上'];
      const typeNames = { 6: '老阴 ⚋（动）', 7: '少阳 ⚊', 8: '少阴 ⚋', 9: '老阳 ⚊（动）' };
      const isChanging = (finalValue === 6 || finalValue === 9);

      this.ui.onYaoResult(this.currentYao, `${yaoNames[this.currentYao]}爻：${typeNames[finalValue]}`, isChanging);
      vibrateFeedback(isChanging ? [70, 40, 70] : 50);
      if (!this.skipMode) this.ui.onNarration(`${yaoNames[this.currentYao]}爻定矣 — ${typeNames[finalValue]}`);

      this.currentYao++;

      if (this.currentYao >= 6) {
        // 全部六爻完成
        this._wait(1000, () => {
          this.canvas.stopAnimation();
          this.isRunning = false;
          this.ui.onComplete(this.yaoValues, this.yaoLines);
        });
      } else {
        if (this.skipMode) {
          this.skipMode = false;
        }
      }
    }

    // 重置状态
    reset() {
      this.isRunning = false;
      this.skipMode = false;
      if (this.currentTimer) {
        clearTimeout(this.currentTimer);
        this.currentTimer = null;
      }
      this.currentCallback = null;
      this.yaoValues = [];
      this.yaoLines = [];
      this.currentYao = 0;
      this.currentChange = 0;
      this.total = 49;
      this.removedIndices = [];
      this.changeRemainders = [];
      this.canvas.stopAnimation();
    }
  }

  // ============ 净手静心交互 ============
  class PurifyStep {
    constructor(btnEl, progressEl, onComplete) {
      this.btn = btnEl;
      this.progress = progressEl;
      this.onComplete = onComplete;
      this.holdTimer = null;
      this.holdDuration = 3000; // 3秒
      this.startTime = 0;
      this.completed = false;

      this._bindEvents();
    }

    _bindEvents() {
      const startHold = (e) => {
        e.preventDefault();
        if (this.completed) return;
        this.startTime = Date.now();
        this.btn.classList.add('holding');
        this._updateProgress();
      };

      const endHold = (e) => {
        e.preventDefault();
        if (this.completed) return;
        cancelAnimationFrame(this.holdTimer);
        this.btn.classList.remove('holding');
        this.progress.style.setProperty('--progress', '0');
      };

      // 鼠标
      this.btn.addEventListener('mousedown', startHold);
      this.btn.addEventListener('mouseup', endHold);
      this.btn.addEventListener('mouseleave', endHold);
      // 触摸
      this.btn.addEventListener('touchstart', startHold, { passive: false });
      this.btn.addEventListener('touchend', endHold);
      this.btn.addEventListener('touchcancel', endHold);
    }

    _updateProgress() {
      const elapsed = Date.now() - this.startTime;
      const ratio = Math.min(elapsed / this.holdDuration, 1);
      this.progress.style.setProperty('--progress', ratio);

      if (ratio >= 1) {
        this.completed = true;
        this.btn.classList.remove('holding');
        this.btn.classList.add('completed');
        vibrateFeedback([100, 50, 100]);
        this.onComplete();
        return;
      }

      this.holdTimer = requestAnimationFrame(() => this._updateProgress());
    }

    reset() {
      this.completed = false;
      this.btn.classList.remove('holding', 'completed');
      this.progress.style.setProperty('--progress', '0');
    }
  }

  // ============ 导出到全局 ============
  window.YarrowModule = {
    StalksCanvas,
    YarrowStateMachine,
    PurifyStep,
  };
})();
