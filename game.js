// =========================================================================
// CRIMSON PURSUIT — ARCADE ENGINE
// =========================================================================
  (function() {
    const BEST_KEY = 'esh_crimson_pursuit_best_v1';
    const DICT_KEY = 'english_hub_master_dict_v2';

    const THEMES = {
      "ALL": {
        skyTop: "#090408", skyBot: "#240a11", road: "rgba(20, 12, 16, 0.92)", laneLine: "rgba(212,175,55,0.45)",
        accent: "#e11d48", glow: "#d4af37", moonColor: "#b91c1c", avatar: "agent", isVehicle: false,
        bgFile: "cp-bg-all.jpg", spriteFile: "cp-char-agent.jpg"
      },
      "The Vampire Diaries": {
        skyTop: "#090204", skyBot: "#360711", road: "rgba(18, 7, 10, 0.92)", laneLine: "rgba(225,29,72,0.5)",
        accent: "#e11d48", glow: "#fb7185", moonColor: "#dc2626", avatar: "vampire", isVehicle: false,
        bgFile: "cp-bg-tvd.jpg", spriteFile: "cp-char-tvd.jpg"
      },
      "Supernatural": {
        skyTop: "#05070d", skyBot: "#1c1524", road: "rgba(17, 18, 23, 0.92)", laneLine: "rgba(245,158,11,0.65)",
        accent: "#f59e0b", glow: "#fbbf24", moonColor: "#e2e8f0", avatar: "impala", isVehicle: true,
        bgFile: "cp-bg-spn.jpg", spriteFile: "cp-char-impala.jpg"
      },
      "Desperate Housewives": {
        skyTop: "#0b0714", skyBot: "#2a1638", road: "rgba(22, 17, 28, 0.92)", laneLine: "rgba(232,193,112,0.55)",
        accent: "#c084fc", glow: "#f5d076", moonColor: "#fde68a", avatar: "car", isVehicle: true,
        bgFile: "cp-bg-dh.jpg", spriteFile: "cp-char-dh.jpg"
      },
      "The Penthouse": {
        skyTop: "#0d0905", skyBot: "#2e1f0d", road: "rgba(24, 19, 13, 0.92)", laneLine: "rgba(212,175,55,0.7)",
        accent: "#d4af37", glow: "#fde047", moonColor: "#fef08a", avatar: "car", isVehicle: true,
        bgFile: "cp-bg-ph.jpg", spriteFile: "cp-char-ph.jpg"
      },
      "Once Upon a Time": {
        skyTop: "#040d0e", skyBot: "#122b2e", road: "rgba(12, 23, 25, 0.92)", laneLine: "rgba(110,231,183,0.5)",
        accent: "#10b981", glow: "#a78bfa", moonColor: "#cbd5e1", avatar: "car", isVehicle: true,
        bgFile: "cp-bg-ouat.jpg", spriteFile: "cp-char-ouat.jpg"
      }
    };

    // --- Авто-вырезка белого фона (BFS от краёв) + авто-обрезка пустых полей 16:9 ---
    const bgCache = {};
    const spriteCache = {};

    function processSpriteCutout(img) {
      try {
        const maxDim = 512;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

        const work = document.createElement('canvas');
        work.width = w;
        work.height = h;
        const wctx = work.getContext('2d', { willReadFrequently: true });
        wctx.drawImage(img, 0, 0, w, h);

        // На протоколе file:// браузер может заблокировать getImageData (SecurityError)
        const imgData = wctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const total = w * h;
        const visited = new Uint8Array(total);
        const queue = new Int32Array(total);
        let head = 0, tail = 0;

        function isBgPixel(pIdx) {
          const i = pIdx * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const maxC = r > g ? (r > b ? r : b) : (g > b ? g : b);
          const minC = r < g ? (r < b ? r : b) : (g < b ? g : b);
          const lum = (r + g + b) / 3;
          const sat = maxC - minC;
          return (lum > 232 && sat < 38) || (r > 232 && g > 202 && b > 202 && sat < 58);
        }

        function pushSeed(x, y) {
          const p = y * w + x;
          if (!visited[p] && isBgPixel(p)) {
            visited[p] = 1;
            queue[tail++] = p;
          }
        }

        for (let x = 0; x < w; x++) { pushSeed(x, 0); pushSeed(x, h - 1); }
        for (let y = 0; y < h; y++) { pushSeed(0, y); pushSeed(w - 1, y); }

        while (head < tail) {
          const p = queue[head++];
          const x = p % w;
          const y = (p - x) / w;
          if (x > 0) { const n = p - 1; if (!visited[n] && isBgPixel(n)) { visited[n] = 1; queue[tail++] = n; } }
          if (x + 1 < w) { const n = p + 1; if (!visited[n] && isBgPixel(n)) { visited[n] = 1; queue[tail++] = n; } }
          if (y > 0) { const n = p - w; if (!visited[n] && isBgPixel(n)) { visited[n] = 1; queue[tail++] = n; } }
          if (y + 1 < h) { const n = p + w; if (!visited[n] && isBgPixel(n)) { visited[n] = 1; queue[tail++] = n; } }
        }

        // Убираем фон + мягкое сглаживание 1px-кромки без белых ореолов
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let p = 0; p < total; p++) {
          const i = p * 4;
          if (visited[p]) {
            data[i + 3] = 0;
            continue;
          }
          const x = p % w;
          const y = (p - x) / w;
          const touchesBg = (x > 0 && visited[p - 1]) || (x + 1 < w && visited[p + 1]) || (y > 0 && visited[p - w]) || (y + 1 < h && visited[p + w]);
          if (touchesBg) {
            const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (lum > 185) {
              const a = Math.max(0, Math.min(255, Math.round(255 * (242 - lum) / 68)));
              data[i + 3] = a;
              if (a < 25) continue;
            }
          }
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }

        if (maxX <= minX || maxY <= minY) return { canvas: null, tainted: true, img };

        wctx.putImageData(imgData, 0, 0);

        const pad = 2;
        const cx = Math.max(0, minX - pad);
        const cy = Math.max(0, minY - pad);
        const cw = Math.min(w - cx, (maxX - minX + 1) + pad * 2);
        const ch = Math.min(h - cy, (maxY - minY + 1) + pad * 2);

        const cropped = document.createElement('canvas');
        cropped.width = cw;
        cropped.height = ch;
        cropped.getContext('2d').drawImage(work, cx, cy, cw, ch, 0, 0, cw, ch);
        return { canvas: cropped, tainted: false, img };
      } catch (err) {
        // Локальный запуск file:// — используем аккуратный режим медальона без белых полей
        return { canvas: null, tainted: true, img };
      }
    }

    function getBgImage(fileName) {
      if (!fileName) return null;
      if (bgCache[fileName] !== undefined) {
        return bgCache[fileName].ok ? bgCache[fileName].img : null;
      }
      const img = new Image();
      const rec = { img, ok: false };
      bgCache[fileName] = rec;
      img.onload = () => {
        rec.ok = true;
        if (modal && modal.classList.contains('open') && !running) drawFrame(0.016);
      };
      img.onerror = () => { rec.ok = false; };
      img.src = fileName;
      return null;
    }

    function getSpriteAsset(fileName) {
      if (!fileName) return null;
      if (spriteCache[fileName] !== undefined) {
        return spriteCache[fileName].ok ? spriteCache[fileName] : null;
      }
      const img = new Image();
      const rec = { img, ok: false, canvas: null, tainted: false };
      spriteCache[fileName] = rec;
      img.onload = () => {
        const res = processSpriteCutout(img);
        rec.canvas = res.canvas;
        rec.tainted = res.tainted;
        rec.ok = true;
        if (modal && modal.classList.contains('open') && !running) drawFrame(0.016);
      };
      img.onerror = () => { rec.ok = false; };
      img.src = fileName;
      return null;
    }

    function preloadThemeAssets(univKey) {
      const th = THEMES[univKey] || THEMES["ALL"];
      if (th.bgFile) getBgImage(th.bgFile);
      if (th.spriteFile) getSpriteAsset(th.spriteFile);
    }

    function buildVocabList() {
      return (window.ALL_HUB_WORDS || window.MASTER_500_WORDS || [])
        .filter(w => w.en && w.ru && w.en.length <= 48)
        .map(w => {
          let shortRu = w.ru;
          if (shortRu.length > 26) shortRu = shortRu.replace(/\s*\([^)]*\)/g, '').trim();
          if (shortRu.length > 32 && shortRu.includes('/')) shortRu = shortRu.split('/')[0].trim();
          if (shortRu.length > 38) shortRu = shortRu.slice(0, 35).trim() + '…';
          return { id: w.id, s: w.s, deckKey: w.deckKey || w.s, en: w.en, ru: w.ru, shortRu };
        });
    }

    let audioCtx = null;
    let sfxEnabled = true;
    let voiceEnabled = true;

    function playTone(type) {
      if (!sfxEnabled) return;
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === 'move') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(240, now);
          osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          osc.start(now); osc.stop(now + 0.075);
        } else if (type === 'good') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.06);
          osc.frequency.setValueAtTime(783.99, now + 0.12);
          gain.gain.setValueAtTime(0.11, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.start(now); osc.stop(now + 0.29);
        } else if (type === 'bad') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.linearRampToValueAtTime(75, now + 0.24);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          osc.start(now); osc.stop(now + 0.27);
        }
      } catch (e) {}
    }

    function speakPhrase(text) {
      if (!voiceEnabled || !text) return;
      window.speakText(text);
    }

    let allWords = [];
    let activePool = [];
    let selectedUniverse = 'ALL';
    let selectedDeck = 'BY_TRACK'; // 'BY_TRACK' | 'Мои слова' | 'deck:<id>'
    let langMode = 'en-ru';        // 'en-ru' | 'ru-en' | 'mix'
    let speedMult = 0.55;
    let wordFilter = 'all';        // 'all' | 'unlearned' | 'learned'

    let running = false;
    let paused = false;
    let animId = null;
    let lastTs = 0;
    let pendingWaveTimer = null;

    let playerLane = 1;
    let playerXNorm = 0;
    let playerTilt = 0;
    let runPhase = 0;
    let trailTimer = 0;

    let lives = 3;
    let score = 0;
    let combo = 0;
    let maxCombo = 1;
    let wordsPassed = 0;
    let missedWords = [];
    let usedIndexes = [];

    let wave = null;
    let roadScroll = 0;
    let shakeTime = 0;
    let flashColor = null;
    let flashAlpha = 0;
    let particles = [];
    let floatTexts = [];
    let stars = [];

    const modal = document.getElementById('cpModal');
    const canvas = document.getElementById('cpCanvas');
    const ctx = canvas.getContext('2d');

    function getBestScore() { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; }
    function setBestScore(val) { if (val > getBestScore()) localStorage.setItem(BEST_KEY, String(val)); }

    function drawRoundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    }

    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(400, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initStars() {
      stars = [];
      for (let i = 0; i < 40; i++) {
        stars.push({ x: Math.random(), y: Math.random() * 0.42, r: Math.random() * 1.6 + 0.5, a: Math.random() * 0.7 + 0.2 });
      }
    }

    function getDictProgressSets() {
      let starred = [];
      let inProgress = [];
      try {
        const saved = JSON.parse(localStorage.getItem(DICT_KEY) || '{}');
        if (Array.isArray(saved.starred)) starred = saved.starred;
        if (saved.srs && typeof saved.srs === 'object') {
          Object.keys(saved.srs).forEach(id => {
            const rec = saved.srs[id];
            if (rec && (rec.mastery >= 100 || rec.lvl >= 4)) {
              if (!starred.includes(id)) starred.push(id);
            } else if (rec && (rec.mastery > 0 || rec.lvl > 0)) {
              inProgress.push(id);
            }
          });
        }
      } catch (e) {}
      return { starred, inProgress };
    }

    function getBasePoolForSelection() {
      if (selectedDeck === 'BY_TRACK') {
        return selectedUniverse === 'ALL'
          ? [...allWords]
          : allWords.filter(w => w.deckKey === selectedUniverse || w.s === selectedUniverse);
      }
      return allWords.filter(w => w.deckKey === selectedDeck || w.s === selectedDeck);
    }

    function refreshDeckSelect() {
      const sel = document.getElementById('cpDeckSelect');
      if (!sel) return;
      const myWordsCnt = allWords.filter(w => w.deckKey === 'Мои слова').length;
      const customDecks = typeof window.getCustomDecks === 'function' ? window.getCustomDecks() : [];
      const prev = selectedDeck;

      let html = `<option value="BY_TRACK">Слова выбранной трассы (по умолчанию)</option>`;
      html += `<option value="Мои слова">Мои слова (${myWordsCnt})</option>`;
      customDecks.forEach(d => {
        const safeName = String(d.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `<option value="deck:${d.id}">📁 Сборник: ${safeName} (${d.words.length})</option>`;
      });
      sel.innerHTML = html;

      if ([...sel.options].some(o => o.value === prev)) {
        sel.value = prev;
      } else {
        selectedDeck = 'BY_TRACK';
        sel.value = 'BY_TRACK';
      }
    }

    function updateFilterHint() {
      const hintEl = document.getElementById('cpFilterHint');
      if (!hintEl) return;
      const base = getBasePoolForSelection();
      const { starred, inProgress } = getDictProgressSets();

      if (selectedDeck !== 'BY_TRACK' && base.length === 0) {
        hintEl.style.color = '#fca5a5';
        hintEl.textContent = 'В выбранном сборнике пока 0 слов — добавь слова в Словаре, иначе запустятся слова трассы.';
        return;
      }

      const langLabel = langMode === 'en-ru' ? 'EN → RU' : (langMode === 'ru-en' ? 'RU → EN' : 'Микс (оба языка)');
      if (wordFilter === 'learned') {
        const learnedList = base.filter(w => starred.includes(w.id));
        const progList = base.filter(w => starred.includes(w.id) || inProgress.includes(w.id));
        if (learnedList.length >= 1 && selectedDeck !== 'BY_TRACK') {
          hintEl.style.color = '#6be38c';
          hintEl.textContent = `Повторение (${langLabel}): ${learnedList.length} выученных слов.`;
        } else if (learnedList.length >= 3) {
          hintEl.style.color = '#6be38c';
          hintEl.textContent = `Повторение (${langLabel}): ${learnedList.length} выученных слов.`;
        } else if (progList.length >= 3) {
          hintEl.style.color = '#e8c775';
          hintEl.textContent = `Выучено пока ${learnedList.length} — подключим ещё слова в процессе (всего ${progList.length}).`;
        } else {
          hintEl.style.color = '#fca5a5';
          hintEl.textContent = `Выученных слов пока мало (${learnedList.length}) — отметь ⭐ в словаре или выбери «Все слова».`;
        }
      } else if (wordFilter === 'unlearned') {
        const unl = base.filter(w => !starred.includes(w.id));
        hintEl.style.color = '#c2b29f';
        hintEl.textContent = `Режим ${langLabel} · Невыученных в колоде: ${unl.length}.`;
      } else {
        hintEl.style.color = '#c2b29f';
        hintEl.textContent = `Режим ${langLabel} · Доступно слов в колоде: ${base.length}.`;
      }
    }

    function buildActivePool(customList) {
      if (Array.isArray(customList) && customList.length > 0) { activePool = [...customList]; return; }
      let list = getBasePoolForSelection();
      const isUserDeck = selectedDeck !== 'BY_TRACK';
      const minNeeded = isUserDeck ? 1 : 3;
      const { starred, inProgress } = getDictProgressSets();

      if (wordFilter === 'unlearned') {
        const unlearned = list.filter(w => !starred.includes(w.id));
        if (unlearned.length >= minNeeded) list = unlearned;
      } else if (wordFilter === 'learned') {
        const learned = list.filter(w => starred.includes(w.id));
        if (learned.length >= minNeeded) {
          list = learned;
        } else {
          const withProgress = list.filter(w => starred.includes(w.id) || inProgress.includes(w.id));
          if (withProgress.length >= minNeeded) list = withProgress;
        }
      }
      activePool = list.length >= minNeeded ? list : [...allWords];
    }

    function spawnWave() {
      if (activePool.length === 0) return;
      if (usedIndexes.length >= activePool.length) usedIndexes = [];
      let idx, tries = 0;
      do { idx = Math.floor(Math.random() * activePool.length); tries++; } while (usedIndexes.includes(idx) && tries < 25);
      usedIndexes.push(idx);

      const target = activePool[idx];
      const dir = (langMode === 'mix') ? (Math.random() < 0.5 ? 'en-ru' : 'ru-en') : langMode;

      const distractors = [];
      const distSource = allWords.length >= 10 ? allWords : activePool;
      let guard = 0;
      while (distractors.length < 2 && guard < 160) {
        guard++;
        const cand = distSource[Math.floor(Math.random() * distSource.length)];
        if (!cand || cand.en === target.en || cand.shortRu === target.shortRu) continue;
        const val = (dir === 'en-ru') ? cand.shortRu : cand.en;
        if (val && !distractors.includes(val)) distractors.push(val);
      }
      while (distractors.length < 2) distractors.push(dir === 'en-ru' ? 'неверный путь' : 'wrong turn');

      const correctLane = Math.floor(Math.random() * 3);
      const correctOptionText = (dir === 'en-ru') ? target.shortRu : target.en;
      const options = [];
      let dIdx = 0;
      for (let l = 0; l < 3; l++) options.push(l === correctLane ? correctOptionText : distractors[dIdx++]);

      wave = { wordObj: target, dir, options, correctLane, z: 0.03, resolved: false, boosted: false };
      const dirTag = dir === 'en-ru' ? 'EN → RU' : 'RU → EN';
      document.getElementById('cpWordSeries').textContent = `${target.s.toUpperCase()} · ${dirTag}`;
      document.getElementById('cpWordMain').textContent = (dir === 'en-ru') ? target.en : target.shortRu;

      // В режиме EN → RU озвучиваем сразу; в RU → EN озвучим после прохода ворот, чтобы не спойлерить ответ
      if (dir === 'en-ru') {
        speakPhrase(target.en);
      }
    }

    function updateHud() {
      document.getElementById('cpLives').textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives));
      const mult = Math.min(5, 1 + Math.floor(combo / 3));
      document.getElementById('cpCombo').textContent = `COMBO x${mult}` + (combo >= 3 ? ` 🔥${combo}` : '');
      document.getElementById('cpScore').textContent = `${score} PTS`;
    }

    function spawnBurst(x, y, color, count) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 70 + Math.random() * 220;
        particles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 60, life: 0.55 + Math.random() * 0.35, maxLife: 0.9, size: 2.5 + Math.random() * 4, color, grav: 260 });
      }
    }

    function spawnMotionTrail(x, y, theme, boosted) {
      const count = boosted ? 3 : 1;
      for (let i = 0; i < count; i++) {
        if (theme.isVehicle) {
          // Дымок/искры из-под двух колёс или выхлопных труб
          const side = (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 14);
          particles.push({
            x: x + side,
            y: y + 8 + Math.random() * 4,
            vx: (Math.random() - 0.5) * 26,
            vy: 42 + Math.random() * 48,
            life: 0.28 + Math.random() * 0.2,
            maxLife: 0.48,
            size: boosted ? 4.5 : (2.6 + Math.random() * 2.5),
            color: boosted ? theme.glow : 'rgba(215, 200, 185, 0.55)',
            grav: 20
          });
        } else {
          // Искры скорости и туман из-под ног бегущего героя
          particles.push({
            x: x + (Math.random() - 0.5) * 22,
            y: y + 10,
            vx: (Math.random() - 0.5) * 34,
            vy: 30 + Math.random() * 40,
            life: 0.3 + Math.random() * 0.22,
            maxLife: 0.52,
            size: boosted ? 4 : (2.2 + Math.random() * 2.2),
            color: Math.random() < 0.55 ? theme.accent : theme.glow,
            grav: 15
          });
        }
      }
    }

    function resolveWave() {
      if (!wave || wave.resolved) return;
      wave.resolved = true;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const px = W * 0.5 + playerXNorm * Math.min(W * 0.28, 175);
      const py = H * 0.80;
      const toast = document.getElementById('cpFeedbackToast');

      if (playerLane === wave.correctLane) {
        combo++;
        wordsPassed++;
        const mult = Math.min(5, 1 + Math.floor(combo / 3));
        if (mult > maxCombo) maxCombo = mult;
        const pts = 100 * mult;
        score += pts;
        playTone('good');
        flashColor = '#10b981'; flashAlpha = 0.16;
        spawnBurst(px, py, '#f5d076', 24);
        floatTexts.push({ x: px, y: py - 24, text: `+${pts}`, color: '#6be38c', life: 0.9 });
        toast.style.color = '#6be38c';
        toast.textContent = `✓ ${wave.wordObj.en} — ${wave.wordObj.shortRu}`;
      } else {
        lives--;
        combo = 0;
        shakeTime = 0.32;
        flashColor = '#dc2626'; flashAlpha = 0.32;
        playTone('bad');
        spawnBurst(px, py, '#ef4444', 26);
        floatTexts.push({ x: px, y: py - 24, text: 'МИМО!', color: '#fca5a5', life: 0.95 });
        if (!missedWords.some(m => m.en === wave.wordObj.en)) missedWords.push(wave.wordObj);
        toast.style.color = '#fca5a5';
        toast.textContent = `✗ Верно: ${wave.wordObj.en} — ${wave.wordObj.shortRu}`;
      }
      if (wave.dir === 'ru-en') {
        speakPhrase(wave.wordObj.en);
      }
      updateHud();
      if (pendingWaveTimer) { clearTimeout(pendingWaveTimer); pendingWaveTimer = null; }
      if (lives <= 0) {
        pendingWaveTimer = setTimeout(() => { pendingWaveTimer = null; if (running) endGame(); }, 420);
      } else {
        const nextDelay = (wave && wave.dir === 'ru-en') ? 680 : 340;
        pendingWaveTimer = setTimeout(() => { pendingWaveTimer = null; if (running && !paused) spawnWave(); }, nextDelay);
      }
    }

    function moveLane(targetLane) {
      if (!running || paused) return;
      const clamped = Math.max(0, Math.min(2, targetLane));
      if (clamped !== playerLane) {
        playerTilt = (clamped - playerLane) * 0.32;
        playerLane = clamped;
        playTone('move');
      }
    }

    function triggerDash() {
      if (running && !paused && wave && !wave.resolved && wave.z > 0.10) wave.boosted = true;
    }

    function drawWrappedText(text, cx, cy, maxWidth, lineHeight) {
      const words = text.split(' ');
      const lines = [];
      let current = '';
      for (let i = 0; i < words.length; i++) {
        const test = current ? current + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = words[i]; }
        else current = test;
      }
      if (current) lines.push(current);
      const trimmed = lines.slice(0, 3);
      const startY = cy - ((trimmed.length - 1) * lineHeight) / 2;
      trimmed.forEach((line, idx) => ctx.fillText(line, cx, startY + idx * lineHeight));
    }

    function drawFrame(dt) {
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const theme = THEMES[selectedUniverse] || THEMES["ALL"];

      ctx.save();
      if (shakeTime > 0) {
        shakeTime = Math.max(0, shakeTime - dt);
        const amp = shakeTime * 22;
        ctx.translate((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp);
      }

      const horizonY = H * 0.41;
      const customBg = getBgImage(theme.bgFile);

      // 1. Фон сцены — мягко уходит за пределы горизонта и обрамляет дорогу
      ctx.fillStyle = '#090609';
      ctx.fillRect(0, 0, W, H);

      if (customBg) {
        const bgAreaH = H * 0.62;
        const imgRatio = customBg.width / customBg.height;
        const boxRatio = W / bgAreaH;
        let dw = W, dh = bgAreaH, dx = 0, dy = 0;
        if (imgRatio > boxRatio) { dw = dh * imgRatio; dx = (W - dw) / 2; }
        else { dh = dw / imgRatio; dy = (bgAreaH - dh) * 0.35; }
        ctx.drawImage(customBg, dx, dy, dw, dh);

        // Затемнение сверху под HUD-баннер и плавный уход в тёмную землю внизу
        const topFade = ctx.createLinearGradient(0, 0, 0, bgAreaH);
        topFade.addColorStop(0, 'rgba(7, 5, 8, 0.55)');
        topFade.addColorStop(0.28, 'rgba(7, 5, 8, 0.14)');
        topFade.addColorStop(0.72, 'rgba(9, 6, 9, 0.35)');
        topFade.addColorStop(1, '#090609');
        ctx.fillStyle = topFade;
        ctx.fillRect(0, 0, W, bgAreaH + 2);
      } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, theme.skyTop);
        skyGrad.addColorStop(1, theme.skyBot);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, horizonY + 4);

        stars.forEach(st => {
          ctx.fillStyle = `rgba(244, 238, 225, ${st.a})`;
          ctx.beginPath(); ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2); ctx.fill();
        });

        const moonR = Math.min(W, H) * 0.085;
        const moonGrad = ctx.createRadialGradient(W * 0.5, horizonY - moonR * 0.25, moonR * 0.1, W * 0.5, horizonY - moonR * 0.25, moonR * 1.9);
        moonGrad.addColorStop(0, theme.moonColor);
        moonGrad.addColorStop(0.55, theme.moonColor + '44');
        moonGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = moonGrad;
        ctx.beginPath(); ctx.arc(W * 0.5, horizonY - moonR * 0.25, moonR * 1.9, 0, Math.PI * 2); ctx.fill();
      }

      // 2. 3D-дорога в перспективе
      const roadTopW = Math.min(W * 0.22, 136);
      const roadBotW = Math.min(W * 0.94, 620);

      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      roadGrad.addColorStop(0, 'rgba(12, 8, 12, 0.55)');
      roadGrad.addColorStop(0.22, theme.road);
      roadGrad.addColorStop(1, '#0d070a');
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(W * 0.5 - roadTopW / 2, horizonY);
      ctx.lineTo(W * 0.5 + roadTopW / 2, horizonY);
      ctx.lineTo(W * 0.5 + roadBotW / 2, H);
      ctx.lineTo(W * 0.5 - roadBotW / 2, H);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(W * 0.5 - roadTopW / 2, horizonY); ctx.lineTo(W * 0.5 - roadBotW / 2, H);
      ctx.moveTo(W * 0.5 + roadTopW / 2, horizonY); ctx.lineTo(W * 0.5 + roadBotW / 2, H);
      ctx.stroke();

      const baseSpeed = (0.115 + Math.min(0.055, wordsPassed * 0.002)) * speedMult;
      const activeSpeed = wave && wave.boosted ? Math.max(0.55, baseSpeed * 4.5) : baseSpeed;
      roadScroll = (roadScroll + dt * activeSpeed * 5.8) % 1;
      runPhase += dt * (wave && wave.boosted ? 20 : 10.5) * Math.max(0.7, speedMult);

      ctx.strokeStyle = theme.laneLine;
      ctx.lineWidth = 1.6;
      [-1 / 6, 1 / 6].forEach(frac => {
        ctx.beginPath();
        ctx.moveTo(W * 0.5 + roadTopW * frac, horizonY);
        ctx.lineTo(W * 0.5 + roadBotW * frac, H);
        ctx.stroke();
      });

      for (let i = 0; i < 9; i++) {
        const t = (i / 9 + roadScroll / 9) % 1;
        const p = t * t;
        const y = horizonY + p * (H - horizonY);
        const curW = roadTopW + p * (roadBotW - roadTopW);
        ctx.strokeStyle = `rgba(212, 175, 55, ${0.06 + p * 0.14})`;
        ctx.lineWidth = 1 + p * 1.5;
        ctx.beginPath(); ctx.moveTo(W * 0.5 - curW / 2, y); ctx.lineTo(W * 0.5 + curW / 2, y); ctx.stroke();

        const lampSize = 2 + p * 7;
        ctx.fillStyle = theme.glow;
        ctx.globalAlpha = 0.25 + p * 0.65;
        ctx.beginPath();
        ctx.arc(W * 0.5 - curW * 0.56, y - lampSize * 1.4, lampSize * 0.55, 0, Math.PI * 2);
        ctx.arc(W * 0.5 + curW * 0.56, y - lampSize * 1.4, lampSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 3. Ворота с вариантами перевода (карточки быстрее выходят в читаемый размер)
      if (wave && !wave.resolved) {
        wave.z += dt * activeSpeed;
        const p = Math.pow(Math.max(0, Math.min(1.15, wave.z)), 1.22);
        const gateY = horizonY + p * (H * 0.80 - horizonY);
        const curRoadW = roadTopW + p * (roadBotW - roadTopW);
        const cardW = Math.max(Math.min(W * 0.30, 195), curRoadW * 0.32);
        const cardH = Math.max(58, 52 + p * 26);

        for (let lane = 0; lane < 3; lane++) {
          const spreadCx = W * 0.5 + (lane - 1) * Math.max(curRoadW / 3, cardW + 6);
          const drawX = spreadCx - cardW / 2;
          const drawY = gateY - cardH;
          const isSelectedLane = (lane === playerLane);

          ctx.save();
          ctx.fillStyle = isSelectedLane ? 'rgba(38, 16, 20, 0.94)' : 'rgba(18, 14, 16, 0.88)';
          ctx.strokeStyle = isSelectedLane ? '#f5d076' : 'rgba(212, 175, 55, 0.48)';
          ctx.lineWidth = isSelectedLane ? 2.6 : 1.4;
          drawRoundRect(ctx, drawX, drawY, cardW, cardH, 10);
          ctx.fill(); ctx.stroke();

          if (isSelectedLane) {
            ctx.fillStyle = theme.accent;
            ctx.fillRect(drawX + 10, drawY + cardH - 4, cardW - 20, 3);
          }

          const fontSize = Math.max(12.5, Math.min(16, 11.8 + p * 4.2));
          ctx.fillStyle = isSelectedLane ? '#fff7dc' : '#e5ded3';
          ctx.font = `700 ${fontSize}px "Courier Prime", "Courier New", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          drawWrappedText(wave.options[lane], spreadCx, drawY + cardH * 0.5, cardW - 14, fontSize * 1.2);
          ctx.restore();
        }
        if (wave.z >= 0.98) resolveWave();
      }

      // 4. Игрок + живая физика бега/подвески + авто-вырезка спрайта
      const targetXNorm = playerLane - 1;
      playerXNorm += (targetXNorm - playerXNorm) * Math.min(1, dt * 15);
      playerTilt *= Math.max(0, 1 - dt * 10);

      const playerY = H * 0.86;
      const roadWAtPlayer = roadTopW + Math.pow(0.86, 1.55) * (roadBotW - roadTopW);
      const playerX = W * 0.5 + playerXNorm * (roadWAtPlayer / 3);

      // Шлейф искр / дыма во время забега
      if (running) {
        trailTimer += dt;
        const interval = (wave && wave.boosted) ? 0.025 : 0.075;
        if (trailTimer >= interval) {
          trailTimer = 0;
          spawnMotionTrail(playerX, playerY, theme, !!(wave && wave.boosted));
        }
      }

      // Ритмичное покачивание: шаги для героев / вибрация двигателя для машин
      const stepBounce = running
        ? (theme.isVehicle ? Math.sin(runPhase * 2.2) * 1.6 : Math.abs(Math.sin(runPhase)) * 7.5)
        : 0;
      const stepSway = running
        ? (theme.isVehicle ? Math.sin(runPhase * 0.9) * 0.015 : Math.sin(runPhase) * 0.05)
        : 0;
      const shadowScale = theme.isVehicle ? 1 : (1 - stepBounce * 0.025);

      // Тень и свечение на асфальте под персонажем/машиной
      ctx.save();
      ctx.translate(playerX, playerY + 12);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 2, (theme.isVehicle ? 46 : 26) * shadowScale, (theme.isVehicle ? 13 : 9) * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, theme.isVehicle ? 54 : 42);
      aura.addColorStop(0, theme.accent + '90');
      aura.addColorStop(1, 'transparent');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(0, 0, theme.isVehicle ? 54 : 40, theme.isVehicle ? 16 : 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Сам спрайт
      ctx.save();
      ctx.translate(playerX, playerY - stepBounce);
      ctx.rotate(playerTilt + stepSway);

      const spriteAsset = getSpriteAsset(theme.spriteFile);
      if (spriteAsset && spriteAsset.canvas) {
        // Идеально вырезанный и обрезанный по контуру спрайт (работает на GitHub Pages / HTTP)
        const c = spriteAsset.canvas;
        let dw, dh;
        if (theme.isVehicle) {
          dw = Math.max(82, Math.min(W * 0.25, 132));
          dh = dw * (c.height / c.width);
        } else {
          dh = Math.max(92, Math.min(H * 0.20, 136));
          dw = dh * (c.width / c.height);
        }
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = theme.isVehicle ? 10 : 12;
        ctx.drawImage(c, -dw / 2, -dh + 18, dw, dh);
        ctx.shadowBlur = 0;

        // Дополнительное красное свечение стоп-сигналов у машин
        if (theme.isVehicle) {
          ctx.globalCompositeOperation = 'lighter';
          const tlGlow = ctx.createRadialGradient(-dw * 0.34, -dh * 0.28 + 18, 2, -dw * 0.34, -dh * 0.28 + 18, 16);
          tlGlow.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
          tlGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = tlGlow;
          ctx.beginPath(); ctx.arc(-dw * 0.34, -dh * 0.28 + 18, 16, 0, Math.PI * 2); ctx.fill();

          const trGlow = ctx.createRadialGradient(dw * 0.34, -dh * 0.28 + 18, 2, dw * 0.34, -dh * 0.28 + 18, 16);
          trGlow.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
          trGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = trGlow;
          ctx.beginPath(); ctx.arc(dw * 0.34, -dh * 0.28 + 18, 16, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
      } else if (spriteAsset && spriteAsset.tainted && spriteAsset.img) {
        // Аккуратный запасной медальон, если открыли локально через file://
        const img = spriteAsset.img;
        const rad = theme.isVehicle ? 44 : 42;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, -rad + 14, rad, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.clip();
        const cropW = img.height * 1.08;
        const cropX = Math.max(0, (img.width - cropW) / 2);
        ctx.drawImage(img, cropX, 0, cropW, img.height, -rad, -rad * 2 + 14, rad * 2, rad * 2);
        ctx.restore();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(0, -rad + 14, rad, 0, Math.PI * 2);
        ctx.stroke();
      } else if (theme.avatar === 'impala') {
        ctx.fillStyle = '#0c0c10'; ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1.6;
        drawRoundRect(ctx, -28, -14, 56, 26, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1f2937';
        drawRoundRect(ctx, -20, -25, 40, 13, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 12;
        ctx.fillRect(-24, -6, 12, 5); ctx.fillRect(12, -6, 12, 5);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f5d076'; ctx.fillRect(-7, -3, 14, 6);
      } else {
        ctx.fillStyle = '#180d12'; ctx.strokeStyle = '#f5d076'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(20, 14); ctx.lineTo(0, 6); ctx.lineTo(-20, 14); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = theme.accent; ctx.shadowColor = theme.glow; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(0, -8, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // 5. Частицы и всплывающие очки
      particles = particles.filter(pt => pt.life > 0);
      particles.forEach(pt => {
        pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += (pt.grav !== undefined ? pt.grav : 260) * dt;
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      floatTexts = floatTexts.filter(ft => ft.life > 0);
      floatTexts.forEach(ft => {
        ft.life -= dt; ft.y -= 48 * dt;
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.font = '700 20px "Courier Prime", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      if (flashAlpha > 0) {
        ctx.fillStyle = flashColor; ctx.globalAlpha = flashAlpha;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        flashAlpha = Math.max(0, flashAlpha - dt * 1.1);
      }
      ctx.restore();
    }

    function loop(ts) {
      if (!running || paused) return;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      drawFrame(dt);
      animId = requestAnimationFrame(loop);
    }

    function setPauseUI(isPaused) {
      const pauseScreen = document.getElementById('cpPauseScreen');
      const pauseBtn = document.getElementById('cpPauseBtn');
      if (pauseScreen) pauseScreen.classList.toggle('active', isPaused);
      if (pauseBtn) pauseBtn.textContent = isPaused ? '▶ Продолжить' : '⏸ Пауза';
    }

    function pauseGame() {
      if (!running || paused) return;
      paused = true;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      if (pendingWaveTimer) { clearTimeout(pendingWaveTimer); pendingWaveTimer = null; }
      if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
      setPauseUI(true);
    }

    function resumeGame() {
      if (!running || !paused) return;
      paused = false;
      setPauseUI(false);
      if (!wave || wave.resolved) {
        if (lives <= 0) { endGame(); return; }
        spawnWave();
      }
      lastTs = performance.now();
      animId = requestAnimationFrame(loop);
    }

    function togglePause() {
      if (!running) return;
      if (paused) resumeGame();
      else pauseGame();
    }

    function startRun(customWords) {
      allWords = buildVocabList();
      buildActivePool(customWords);
      preloadThemeAssets(selectedUniverse);
      if (pendingWaveTimer) { clearTimeout(pendingWaveTimer); pendingWaveTimer = null; }
      lives = 3; score = 0; combo = 0; maxCombo = 1; wordsPassed = 0;
      missedWords = []; usedIndexes = []; playerLane = 1; playerXNorm = 0;
      runPhase = 0; trailTimer = 0; paused = false;
      particles = []; floatTexts = []; shakeTime = 0; flashAlpha = 0;

      document.getElementById('cpStartScreen').classList.remove('active');
      document.getElementById('cpGameOverScreen').classList.remove('active');
      setPauseUI(false);
      const pauseBtn = document.getElementById('cpPauseBtn');
      if (pauseBtn) pauseBtn.style.display = 'inline-block';
      document.getElementById('cpHud').classList.add('active');
      document.getElementById('cpBottomBar').classList.add('active');
      document.getElementById('cpFeedbackToast').textContent = '';

      resizeCanvas(); initStars(); updateHud(); spawnWave();
      running = true; lastTs = performance.now();
      if (animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(loop);
    }

    function endGame() {
      running = false;
      paused = false;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      if (pendingWaveTimer) { clearTimeout(pendingWaveTimer); pendingWaveTimer = null; }
      setBestScore(score);
      setPauseUI(false);
      const pauseBtn = document.getElementById('cpPauseBtn');
      if (pauseBtn) pauseBtn.style.display = 'none';
      document.getElementById('cpHud').classList.remove('active');
      document.getElementById('cpBottomBar').classList.remove('active');
      document.getElementById('cpGameOverScreen').classList.add('active');
      document.getElementById('cpFinalScore').textContent = score;
      document.getElementById('cpFinalBest').textContent = getBestScore();
      document.getElementById('cpFinalCombo').textContent = 'x' + maxCombo;
      document.getElementById('cpBestScoreMenu').textContent = getBestScore();

      const missedSec = document.getElementById('cpMissedSection');
      const missedListEl = document.getElementById('cpMissedList');
      const retryBtn = document.getElementById('cpRetryMissedBtn');
      if (missedWords.length > 0) {
        missedSec.style.display = 'block';
        retryBtn.style.display = 'inline-block';
        missedListEl.innerHTML = missedWords.map(w => `
          <div class="cp-missed-item">
            <div>
              <b style="color:#f5d076;">${w.en}</b>
              <div style="color:#c9b7a3; font-size:11.5px;">${w.ru}</div>
            </div>
            <button class="cp-btn ghost" onclick="window._cpSpeak('${w.en.replace(/'/g, "\\'")}')">🔊</button>
          </div>
        `).join('');
      } else {
        missedSec.style.display = 'none';
        retryBtn.style.display = 'none';
      }
    }

    window._cpSpeak = function(t) { window.speakText(t); };

    function openCrimsonPursuit() {
      allWords = buildVocabList();
      preloadThemeAssets(selectedUniverse);
      paused = false;
      setPauseUI(false);
      const pauseBtn = document.getElementById('cpPauseBtn');
      if (pauseBtn) pauseBtn.style.display = 'none';
      document.getElementById('cpPoolCount').textContent = allWords.length;
      document.getElementById('cpBestScoreMenu').textContent = getBestScore();
      refreshDeckSelect();
      updateFilterHint();
      const drawer = document.getElementById('eshDrawer');
      if (drawer && drawer.classList.contains('open') && window.ESHHub) window.ESHHub.toggleDrawer();
      modal.classList.add('open');
      document.getElementById('cpStartScreen').classList.add('active');
      document.getElementById('cpGameOverScreen').classList.remove('active');
      document.getElementById('cpHud').classList.remove('active');
      document.getElementById('cpBottomBar').classList.remove('active');
      resizeCanvas(); initStars(); drawFrame(0.016);
    }

    function returnToMenuFromGame() {
      running = false;
      paused = false;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      if (pendingWaveTimer) { clearTimeout(pendingWaveTimer); pendingWaveTimer = null; }
      if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
      setPauseUI(false);
      const pauseBtn = document.getElementById('cpPauseBtn');
      if (pauseBtn) pauseBtn.style.display = 'none';
      document.getElementById('cpHud').classList.remove('active');
      document.getElementById('cpBottomBar').classList.remove('active');
      document.getElementById('cpGameOverScreen').classList.remove('active');
      document.getElementById('cpStartScreen').classList.add('active');
      allWords = buildVocabList();
      refreshDeckSelect();
      updateFilterHint();
    }

    function closeCrimsonPursuit() {
      running = false;
      paused = false;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      if (pendingWaveTimer) { clearTimeout(pendingWaveTimer); pendingWaveTimer = null; }
      setPauseUI(false);
      const pauseBtn = document.getElementById('cpPauseBtn');
      if (pauseBtn) pauseBtn.style.display = 'none';
      modal.classList.remove('open');
      if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
    }

    document.addEventListener('keydown', e => {
      if (!running) return;
      if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (paused) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') { e.preventDefault(); moveLane(playerLane - 1); }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') { e.preventDefault(); moveLane(playerLane + 1); }
      else if (e.key === '1') moveLane(0);
      else if (e.key === '2') moveLane(1);
      else if (e.key === '3') moveLane(2);
      else if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); triggerDash(); }
    });

    let touchStartX = null;
    canvas.addEventListener('touchstart', e => {
      if (!running || !e.touches[0]) return;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    canvas.addEventListener('touchend', e => {
      if (!running || !e.changedTouches[0]) return;
      const endX = e.changedTouches[0].clientX;
      const dx = touchStartX !== null ? endX - touchStartX : 0;
      touchStartX = null;
      if (Math.abs(dx) > 36) moveLane(playerLane + (dx > 0 ? 1 : -1));
      else {
        const rect = canvas.getBoundingClientRect();
        const rel = (endX - rect.left) / rect.width;
        moveLane(rel < 0.34 ? 0 : (rel > 0.66 ? 2 : 1));
      }
    }, { passive: true });

    canvas.addEventListener('mousedown', e => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const rel = (e.clientX - rect.left) / rect.width;
      moveLane(rel < 0.34 ? 0 : (rel > 0.66 ? 2 : 1));
    });

    window.addEventListener('resize', () => {
      if (modal.classList.contains('open')) resizeCanvas();
    });

    document.getElementById('cpLauncherBtn').onclick = openCrimsonPursuit;
    document.getElementById('cpCloseBtn').onclick = closeCrimsonPursuit;
    document.getElementById('cpStartBtn').onclick = () => startRun();
    document.getElementById('cpPlayAgainBtn').onclick = () => startRun();
    document.getElementById('cpRetryMissedBtn').onclick = () => startRun([...missedWords]);
    document.getElementById('cpPauseBtn').onclick = togglePause;
    document.getElementById('cpResumeBtn').onclick = resumeGame;
    document.getElementById('cpRestartFromPauseBtn').onclick = () => startRun();
    document.getElementById('cpMenuFromPauseBtn').onclick = returnToMenuFromGame;
    document.getElementById('cpBackToMenuBtn').onclick = returnToMenuFromGame;
    document.getElementById('cpDashBtn').onclick = triggerDash;
    document.getElementById('cpWordBanner').onclick = () => {
      if (wave && wave.wordObj && (wave.dir === 'en-ru' || wave.resolved)) {
        window.speakText(wave.wordObj.en);
      }
    };
    document.getElementById('cpSfxToggle').onclick = function() { sfxEnabled = !sfxEnabled; this.textContent = sfxEnabled ? 'SFX: ВКЛ' : 'SFX: ВЫКЛ'; };
    document.getElementById('cpVoiceToggle').onclick = function() { voiceEnabled = !voiceEnabled; this.textContent = voiceEnabled ? 'Голос: ВКЛ' : 'Голос: ВЫКЛ'; };

    const cpDeckSel = document.getElementById('cpDeckSelect');
    if (cpDeckSel) {
      cpDeckSel.addEventListener('change', () => {
        selectedDeck = cpDeckSel.value || 'BY_TRACK';
        updateFilterHint();
      });
    }

    document.querySelectorAll('#cpLangPicker button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#cpLangPicker button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        langMode = btn.getAttribute('data-lang') || 'en-ru';
        updateFilterHint();
      };
    });

    document.querySelectorAll('#cpFilterPicker button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#cpFilterPicker button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        wordFilter = btn.getAttribute('data-flt') || 'all';
        updateFilterHint();
      };
    });

    document.querySelectorAll('#cpUniversePicker button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#cpUniversePicker button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedUniverse = btn.getAttribute('data-u');
        preloadThemeAssets(selectedUniverse);
        updateFilterHint();
        if (!running) drawFrame(0.016);
      };
    });
    document.querySelectorAll('#cpSpeedPicker button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#cpSpeedPicker button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speedMult = parseFloat(btn.getAttribute('data-sp')) || 0.55;
      };
    });

    window.openCrimsonPursuit = openCrimsonPursuit;
  })();
