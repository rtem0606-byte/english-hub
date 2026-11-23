// =========================================================================
// ENGLISH SERIES HUB — APP MODULE (озвучка, словарь, тренажёр, досье, дела, новеллы, переводчик)
// =========================================================================

  (function() {
    let activeAudio = null;
    let speakSessionId = 0;

    // Кэш уже загруженных аудио-объектов (повторные клики играют мгновенно за 0 мс)
    const audioCache = new Map();
    const MAX_CACHE = 60;

    // Отслеживаем здоровье провайдеров: если сервер тормозит или недоступен, не ждём его на каждом слове
    const providerHealth = {
      youdao: { fails: 0, skipUntil: 0 },
      google: { fails: 0, skipUntil: 0 }
    };

    function cleanSpeechText(raw) {
      if (!raw) return '';
      let txt = String(raw).replace(/[🔊«»"]/g, '').trim();
      const dashParts = txt.split(/\s+[—–]\s+/);
      if (dashParts.length > 1 && /[А-Яа-яЁё]/.test(dashParts[1])) {
        txt = dashParts[0].trim();
      }
      return txt.replace(/\s+/g, ' ').trim();
    }

    function stopAllAudio() {
      speakSessionId++;
      if (activeAudio) {
        try {
          activeAudio.pause();
          activeAudio.currentTime = 0;
        } catch (e) {}
        activeAudio = null;
      }
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }

    function fallbackBrowserSpeak(text, session, rate) {
      if (session !== speakSessionId) return;
      if (!('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        // Фикс известного бага Chrome, когда speechSynthesis «засыпает» и перестаёт озвучивать
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = rate || 0.94;
        const voices = window.speechSynthesis.getVoices() || [];
        const preferred = voices.find(v => /en[-_]US/i.test(v.lang) && /(Natural|Neural|Google|Aria|Jenny|Guy|Samantha)/i.test(v.name))
          || voices.find(v => /en[-_]US/i.test(v.lang))
          || voices.find(v => /^en/i.test(v.lang));
        if (preferred) u.voice = preferred;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }

    function buildUrl(prov, chunk) {
      if (prov === 'youdao') return 'https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(chunk);
      return 'https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=en-US&q=' + encodeURIComponent(chunk);
    }

    function playUrlPromise(prov, chunk, session, rate) {
      return new Promise((resolve, reject) => {
        if (session !== speakSessionId) return reject('cancelled');
        const cacheKey = prov + '|' + chunk.toLowerCase();
        const url = buildUrl(prov, chunk);

        let audio = audioCache.get(cacheKey);
        const fromCache = !!audio;
        if (!audio) {
          audio = new Audio();
          audio.preload = 'auto';
          audio.src = url;
        } else {
          try { audio.pause(); audio.currentTime = 0; } catch (e) {}
        }

        if (rate && rate !== 1) {
          audio.playbackRate = rate;
          audio.defaultPlaybackRate = rate;
        } else {
          audio.playbackRate = 1.0;
          audio.defaultPlaybackRate = 1.0;
        }

        let settled = false;
        // Жёсткий короткий таймаут 1350мс, чтобы озвучка никогда не подвисала на 5 секунд
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            try { audio.pause(); } catch (e) {}
            reject('timeout');
          }
        }, fromCache ? 900 : 1350);

        const cleanup = () => {
          clearTimeout(timer);
          audio.onplaying = null;
          audio.onerror = null;
        };

        audio.onplaying = () => {
          if (session !== speakSessionId) {
            cleanup();
            try { audio.pause(); } catch (e) {}
            return reject('cancelled');
          }
          if (rate && rate !== 1) {
            try { audio.playbackRate = rate; } catch (e) {}
          }
          if (!settled) {
            settled = true;
            cleanup();
            providerHealth[prov].fails = 0;
            if (!fromCache) {
              if (audioCache.size >= MAX_CACHE) {
                const firstKey = audioCache.keys().next().value;
                audioCache.delete(firstKey);
              }
              audioCache.set(cacheKey, audio);
            }
            resolve(audio);
          }
        };

        audio.onerror = () => {
          if (!settled) {
            settled = true;
            cleanup();
            audioCache.delete(cacheKey);
            reject('error');
          }
        };

        activeAudio = audio;
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(err => {
            if (!settled) {
              settled = true;
              cleanup();
              reject(err);
            }
          });
        }
      });
    }

    function splitIntoChunks(text, maxLen) {
      if (text.length <= maxLen) return [text];
      const parts = text.match(/[^.!?]+[.!?]*/g) || [text];
      const chunks = [];
      let cur = '';
      for (const p of parts) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        if ((cur + ' ' + trimmed).trim().length <= maxLen) {
          cur = (cur + ' ' + trimmed).trim();
        } else {
          if (cur) chunks.push(cur);
          cur = trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
        }
      }
      if (cur) chunks.push(cur);
      return chunks;
    }

    async function speakNatural(rawText, opts) {
      const text = cleanSpeechText(rawText);
      if (!text) return;
      const rate = (opts && typeof opts.rate === 'number') ? opts.rate : 1.0;
      stopAllAudio();
      const session = speakSessionId;

      if (navigator.onLine === false) {
        fallbackBrowserSpeak(text, session, rate === 1 ? 0.94 : rate);
        return;
      }

      const chunks = splitIntoChunks(text, 165);
      const now = Date.now();
      const providers = ['youdao', 'google'].filter(p => providerHealth[p].skipUntil <= now);

      if (providers.length === 0) {
        fallbackBrowserSpeak(text, session, rate === 1 ? 0.94 : rate);
        return;
      }

      for (let i = 0; i < chunks.length; i++) {
        if (session !== speakSessionId) return;
        const chunk = chunks[i];
        let playedAudio = null;

        for (const prov of providers) {
          if (session !== speakSessionId) return;
          if (providerHealth[prov].skipUntil > Date.now()) continue;
          try {
            playedAudio = await playUrlPromise(prov, chunk, session, rate);
            break;
          } catch (e) {
            if (e === 'cancelled' || session !== speakSessionId) return;
            providerHealth[prov].fails++;
            if (providerHealth[prov].fails >= 2) {
              // Уводим тормозящий сервер в паузу на 3 минуты, чтобы не вешать каждое слово
              providerHealth[prov].skipUntil = Date.now() + 180000;
            }
          }
        }

        if (playedAudio) {
          if (i < chunks.length - 1) {
            await new Promise(res => {
              playedAudio.onended = res;
              setTimeout(res, 6000);
            });
          }
        } else {
          fallbackBrowserSpeak(chunks.slice(i).join(' '), session, rate === 1 ? 0.94 : rate);
          return;
        }
      }
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    window.speakText = speakNatural;
    window.speak = speakNatural;
    window.playAudio = speakNatural;
    window.stopAllAudio = stopAllAudio;
  })();

  (function() {
    const DICT_KEY = 'english_hub_master_dict_v2';
    const CUSTOM_KEY = 'esh_novel_words';
    const DECKS_KEY = 'esh_custom_decks_v1';
    const DAILY_KEY = 'esh_daily_goal_v1';
    const CUSTOM_SERIES = 'Мои слова';
    const PAGE_STEP = 36;

    let dictState = { starred: [], srs: {} };
    let dailyState = { date: '', count: 0, target: 10, streak: 0, lastCompletedDate: '' };

    let allWords = [];
    let filtered = [];
    let activeSeries = 'ALL';
    let activeStatus = 'ALL';
    let searchQuery = '';
    let visibleLimit = PAGE_STEP;
    let currentView = 'grid'; // 'grid' | 'trainer'

    // --- Лёгкие звуковые отклики тренажёра ---
    let wtAudioCtx = null;
    let wtSfxOn = true;
    function wtBeep(kind) {
      if (!wtSfxOn) return;
      try {
        if (!wtAudioCtx) wtAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (wtAudioCtx.state === 'suspended') wtAudioCtx.resume();
        const now = wtAudioCtx.currentTime;
        const osc = wtAudioCtx.createOscillator();
        const g = wtAudioCtx.createGain();
        osc.connect(g); g.connect(wtAudioCtx.destination);
        if (kind === 'ok') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.06);
          osc.frequency.setValueAtTime(783.99, now + 0.12);
          g.gain.setValueAtTime(0.09, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          osc.start(now); osc.stop(now + 0.25);
        } else if (kind === 'bad') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(170, now);
          osc.frequency.linearRampToValueAtTime(95, now + 0.2);
          g.gain.setValueAtTime(0.09, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now); osc.stop(now + 0.23);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(360, now);
          osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);
          g.gain.setValueAtTime(0.045, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now); osc.stop(now + 0.055);
        }
      } catch (e) {}
    }

    function todayKey() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function yesterdayKey() {
      const d = new Date(Date.now() - 86400000);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function loadDailyState() {
      try {
        const raw = localStorage.getItem(DAILY_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          dailyState = Object.assign({ date: '', count: 0, target: 10, streak: 0, lastCompletedDate: '' }, p);
        }
      } catch (e) {}
      const tk = todayKey();
      if (dailyState.date !== tk) {
        if (dailyState.lastCompletedDate && dailyState.lastCompletedDate !== yesterdayKey() && dailyState.lastCompletedDate !== tk) {
          dailyState.streak = 0;
        }
        dailyState.date = tk;
        dailyState.count = 0;
        saveDailyState();
      }
    }

    function saveDailyState() {
      try { localStorage.setItem(DAILY_KEY, JSON.stringify(dailyState)); } catch (e) {}
    }

    function recordDailyWordProgress() {
      const tk = todayKey();
      if (dailyState.date !== tk) { dailyState.date = tk; dailyState.count = 0; }
      dailyState.count++;
      if (dailyState.count >= dailyState.target && dailyState.lastCompletedDate !== tk) {
        dailyState.streak = (dailyState.lastCompletedDate === yesterdayKey()) ? (dailyState.streak + 1) : Math.max(1, dailyState.streak + 1);
        dailyState.lastCompletedDate = tk;
      }
      saveDailyState();
      renderDailyStrip();
    }

    function loadState() {
      try {
        const raw = localStorage.getItem(DICT_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (Array.isArray(p.starred)) dictState.starred = p.starred;
          if (p.srs && typeof p.srs === 'object') dictState.srs = p.srs;
        }
      } catch (e) {}
      loadDailyState();
    }

    function saveState() {
      try { localStorage.setItem(DICT_KEY, JSON.stringify(dictState)); } catch (e) {}
      window._proUpdateUI();
      if (typeof window.syncAllCounters === 'function') window.syncAllCounters();
    }

    // --- Пользовательские сборники («Мои слова» + отдельные создаваемые сборники) ---
    function loadCustomWordsRaw() {
      try {
        const arr = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }

    function saveCustomWordsRaw(arr) {
      try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr)); } catch (e) {}
      const cntEl = document.getElementById('eshSavedWordsCount');
      if (cntEl) cntEl.textContent = arr.length;
    }

    function loadCustomDecksRaw() {
      try {
        const arr = JSON.parse(localStorage.getItem(DECKS_KEY) || '[]');
        if (!Array.isArray(arr)) return [];
        return arr.filter(d => d && d.id && d.name && Array.isArray(d.words));
      } catch (e) { return []; }
    }

    function saveCustomDecksRaw(decks) {
      try { localStorage.setItem(DECKS_KEY, JSON.stringify(decks)); } catch (e) {}
      const dCnt = document.getElementById('eshDrawerDecksCount');
      if (dCnt) dCnt.textContent = decks.length;
    }

    window.getCustomDecks = function() {
      return loadCustomDecksRaw();
    };

    window.getCustomDecksCount = function() {
      return loadCustomDecksRaw().length;
    };

    function rebuildAllWords() {
      const customList = loadCustomWordsRaw();
      const customMapped = customList
        .filter(item => item && item.word)
        .map(item => {
          const cleanId = 'custom_' + String(item.word).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18);
          return {
            id: cleanId,
            s: CUSTOM_SERIES,
            deckKey: CUSTOM_SERIES,
            en: String(item.word).trim(),
            ru: String(item.translation || 'Перевод не указан').trim(),
            ex: item.example ? String(item.example).trim() : 'Сохранено тобой во время чтения на сайте.',
            isCustom: true,
            rawKey: item.word
          };
        })
        .reverse();

      const decks = loadCustomDecksRaw();
      const deckMapped = [];
      decks.forEach(deck => {
        const dKey = 'deck:' + deck.id;
        deck.words.slice().reverse().forEach((w, idx) => {
          if (!w || !w.en) return;
          deckMapped.push({
            id: w.id || ('dw_' + deck.id + '_' + idx),
            s: deck.name,
            deckKey: dKey,
            deckId: deck.id,
            en: String(w.en).trim(),
            ru: String(w.ru || 'Перевод не указан').trim(),
            ex: w.ex ? String(w.ex).trim() : ('Из твоего сборника «' + deck.name + '».'),
            isDeckWord: true
          });
        });
      });

      const baseMapped = (window.MASTER_500_WORDS || []).map(w => Object.assign({}, w, { deckKey: w.s }));

      allWords = [...deckMapped, ...customMapped, ...baseMapped];
      window.ALL_HUB_WORDS = allWords;

      const dCnt = document.getElementById('eshDrawerDecksCount');
      if (dCnt) dCnt.textContent = decks.length;
      const savedCnt = document.getElementById('eshSavedWordsCount');
      if (savedCnt) savedCnt.textContent = customList.length;

      updateSeriesPills();
      syncDeckSelectOptions();
    }

    function getWordMastery(id) {
      const rec = dictState.srs[id];
      if (rec && typeof rec.mastery === 'number') return Math.max(0, Math.min(100, rec.mastery));
      if (dictState.starred.includes(id)) return 100;
      if (rec && typeof rec.lvl === 'number' && rec.lvl > 0) return Math.min(100, rec.lvl * 25);
      return 0;
    }

    function setWordMastery(id, pct, delayMs) {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      const wasMastered = getWordMastery(id) >= 100 || dictState.starred.includes(id);
      dictState.srs[id] = {
        lvl: Math.round(clamped / 20),
        mastery: clamped,
        due: Date.now() + (delayMs !== undefined ? delayMs : (clamped >= 100 ? 96 * 3600 * 1000 : 10 * 60 * 1000))
      };
      if (clamped >= 100) {
        if (!dictState.starred.includes(id)) dictState.starred.push(id);
        if (!wasMastered) recordDailyWordProgress();
      } else {
        const idx = dictState.starred.indexOf(id);
        if (idx !== -1) dictState.starred.splice(idx, 1);
      }
      saveState();
    }

    function renderMasteryBarsHtml(pct) {
      const filled = Math.round(pct / 25);
      const isFull = pct >= 100;
      let segs = '';
      for (let i = 1; i <= 4; i++) {
        segs += `<span class="mastery-seg ${i <= filled ? (isFull ? 'full' : 'on') : ''}"></span>`;
      }
      return `<span class="mastery-bars" title="Освоение: ${pct}%">${segs}</span> <span style="color:${isFull ? '#6be38c' : '#d4af37'}; font-weight:700;">${pct}%</span>`;
    }

    function escapeHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function shortRussian(ru) {
      let s = String(ru || '').trim();
      if (s.length > 44 && s.includes('/')) s = s.split('/')[0].trim();
      if (s.length > 52) s = s.slice(0, 49).trim() + '…';
      return s;
    }

    window.getDictLearnedCount = function() {
      return dictState.starred.length;
    };

    window.getDictTotalCount = function() {
      return allWords.length || (window.MASTER_500_WORDS || []).length;
    };

    window.resetMasterDictState = function() {
      dictState = { starred: [], srs: {} };
      localStorage.removeItem(DICT_KEY);
      applyFilters();
    };

    window.syncCustomWordsIntoDictionary = function() {
      rebuildAllWords();
      applyFilters();
      if (typeof window.syncAllCounters === 'function') window.syncAllCounters();
    };

    window.filterDictBySeries = function(seriesName) {
      activeSeries = seriesName || 'ALL';
      window._proSetMode('grid');
      updateSeriesPills();
      applyFilters();
    };

    window.openTrainerFromOutside = function(presetDeck) {
      if (presetDeck) wtConfig.deck = presetDeck;
      window._proSetMode('trainer');
      if (!wtSession.active) renderTrainerLobby();
    };

    window.openDeckManagerFromOutside = function() {
      window._proSetMode('grid');
      const p = document.getElementById('deckManagerPanel');
      if (p) {
        p.classList.add('open');
        const inp = document.getElementById('newDeckNameInput');
        if (inp) inp.focus();
      }
    };

    function syncDeckSelectOptions() {
      const decks = loadCustomDecksRaw();
      const singleSel = document.getElementById('customTargetDeckSelect');
      const bulkSel = document.getElementById('bulkTargetDeckSelect');

      const optsHtml = `<option value="${CUSTOM_SERIES}">В «Мои слова»</option>` +
        decks.map(d => `<option value="deck:${d.id}">Сборник: ${escapeHtml(d.name)} (${d.words.length})</option>`).join('');

      if (singleSel) {
        const prev = singleSel.value;
        singleSel.innerHTML = optsHtml;
        if (activeSeries.startsWith('deck:') && decks.some(d => 'deck:' + d.id === activeSeries)) {
          singleSel.value = activeSeries;
        } else if (prev && [...singleSel.options].some(o => o.value === prev)) {
          singleSel.value = prev;
        }
      }

      if (bulkSel) {
        const prev = bulkSel.value;
        bulkSel.innerHTML = `<option value="NEW">+ Создать новый сборник (укажи имя выше)</option>` + optsHtml;
        if (activeSeries.startsWith('deck:') && decks.some(d => 'deck:' + d.id === activeSeries)) {
          bulkSel.value = activeSeries;
        } else if (prev && [...bulkSel.options].some(o => o.value === prev)) {
          bulkSel.value = prev;
        }
      }
    }

    function updateSeriesPills() {
      const pillsEl = document.getElementById('proSeriesPills');
      if (!pillsEl) return;
      const decks = loadCustomDecksRaw();
      const customCount = allWords.filter(w => w.isCustom).length;
      const counts = {
        ALL: allWords.length,
        [CUSTOM_SERIES]: customCount,
        "The Vampire Diaries": allWords.filter(w => w.deckKey === "The Vampire Diaries").length,
        "Desperate Housewives": allWords.filter(w => w.deckKey === "Desperate Housewives").length,
        "Supernatural": allWords.filter(w => w.deckKey === "Supernatural").length,
        "The Penthouse": allWords.filter(w => w.deckKey === "The Penthouse").length,
        "Once Upon a Time": allWords.filter(w => w.deckKey === "Once Upon a Time").length
      };
      const totalSpan = document.getElementById('proTotalCount');
      if (totalSpan) totalSpan.textContent = counts.ALL;

      const deckPillsHtml = decks.map(d => {
        const dk = 'deck:' + d.id;
        return `<button class="pro-pill deck-pill ${activeSeries === dk ? 'active' : ''}" data-s="${dk}">📁 ${escapeHtml(d.name)} (${d.words.length})</button>`;
      }).join('');

      pillsEl.innerHTML = `
        <button class="pro-pill ${activeSeries === 'ALL' ? 'active' : ''}" data-s="ALL">Все (${counts.ALL})</button>
        <button class="pro-pill custom-pill ${activeSeries === CUSTOM_SERIES ? 'active' : ''}" data-s="${CUSTOM_SERIES}">Мои слова (${counts[CUSTOM_SERIES]})</button>
        ${deckPillsHtml}
        <button class="pro-pill ${activeSeries === 'The Vampire Diaries' ? 'active' : ''}" data-s="The Vampire Diaries"><img src="tvd-card.jpg" alt="" class="series-thumb">Vampire Diaries (${counts["The Vampire Diaries"]})</button>
        <button class="pro-pill ${activeSeries === 'Desperate Housewives' ? 'active' : ''}" data-s="Desperate Housewives"><img src="house-wives.jpg" alt="" class="series-thumb">Housewives (${counts["Desperate Housewives"]})</button>
        <button class="pro-pill ${activeSeries === 'Supernatural' ? 'active' : ''}" data-s="Supernatural"><img src="spn-card.jpg" alt="" class="series-thumb">Supernatural (${counts["Supernatural"]})</button>
        <button class="pro-pill ${activeSeries === 'The Penthouse' ? 'active' : ''}" data-s="The Penthouse"><img src="penthouse-card.jpg" alt="" class="series-thumb">Penthouse (${counts["The Penthouse"]})</button>
        <button class="pro-pill ${activeSeries === 'Once Upon a Time' ? 'active' : ''}" data-s="Once Upon a Time"><img src="once-upon.jpg" alt="" class="series-thumb">Once Upon (${counts["Once Upon a Time"]})</button>
      `;
      pillsEl.querySelectorAll('.pro-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          activeSeries = btn.getAttribute('data-s');
          updateSeriesPills();
          syncDeckSelectOptions();
          applyFilters();
          if (activeSeries === CUSTOM_SERIES) {
            const p = document.getElementById('customAddPanel');
            if (p && loadCustomWordsRaw().length === 0) p.classList.add('open');
          }
        });
      });
    }

    function renderActiveDeckBar() {
      const bar = document.getElementById('activeDeckBar');
      if (!bar) return;
      if (!activeSeries.startsWith('deck:')) {
        bar.classList.remove('show');
        bar.innerHTML = '';
        return;
      }
      const deckId = activeSeries.slice(5);
      const deck = loadCustomDecksRaw().find(d => d.id === deckId);
      if (!deck) {
        activeSeries = 'ALL';
        bar.classList.remove('show');
        updateSeriesPills();
        return;
      }
      bar.classList.add('show');
      bar.innerHTML = `
        <div class="active-deck-title">📁 Сборник «${escapeHtml(deck.name)}» · слов: ${deck.words.length}</div>
        <div class="active-deck-actions">
          <button class="pro-mode-btn" onclick="window._proAddWordToActiveDeck('${deck.id}')">+ Слово сюда</button>
          <button class="pro-mode-btn" onclick="window._proOpenBulkForDeck('${deck.id}')">+ Списком</button>
          <button class="pro-mode-btn active" onclick="window.openTrainerFromOutside('deck:${deck.id}')">Тренировать</button>
          <button class="pro-mode-btn danger-btn" onclick="window._proDeleteDeck('${deck.id}')">Удалить сборник</button>
        </div>
      `;
    }

    function renderDailyStrip() {
      const el = document.getElementById('dailyGoalStrip');
      if (!el) return;
      const pct = Math.min(100, Math.round((dailyState.count / Math.max(1, dailyState.target)) * 100));
      const doneMark = dailyState.count >= dailyState.target ? '✅ Цель выполнена!' : '';
      el.innerHTML = `
        <div class="daily-goal-left">
          <span class="daily-streak-pill">Серия: ${dailyState.streak} дн.</span>
          <span>Цель дня: <b style="color:#6be38c;">${dailyState.count} / ${dailyState.target}</b> слов ${doneMark}</span>
        </div>
        <div class="pro-prog-bar-bg" style="max-width:220px;">
          <div class="pro-prog-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="daily-target-btns">
          <span>Цель:</span>
          ${[5, 10, 15, 20].map(n => `<button class="daily-target-btn ${dailyState.target === n ? 'active' : ''}" onclick="window._proSetDailyTarget(${n})">${n}</button>`).join('')}
        </div>
      `;
    }

    window._proSetDailyTarget = function(n) {
      dailyState.target = n;
      saveDailyState();
      renderDailyStrip();
    };

    function applyFilters() {
      const now = Date.now();
      renderActiveDeckBar();
      filtered = allWords.filter(w => {
        if (activeSeries !== 'ALL' && w.deckKey !== activeSeries) return false;
        const m = getWordMastery(w.id);
        if (activeStatus === 'STARRED' && m < 100) return false;
        if (activeStatus === 'UNLEARNED' && m >= 100) return false;
        if (activeStatus === 'IN_PROGRESS' && (m === 0 || m >= 100)) return false;
        if (activeStatus === 'DUE') {
          const rec = dictState.srs[w.id];
          if (rec && rec.due > now && m >= 100) return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return w.en.toLowerCase().includes(q) || w.ru.toLowerCase().includes(q) || w.ex.toLowerCase().includes(q);
        }
        return true;
      });
      visibleLimit = PAGE_STEP;
      renderGrid();
      window._proUpdateUI();
    }

    function renderGrid() {
      const grid = document.getElementById('proCardsGrid');
      const loadMoreWrap = document.getElementById('proLoadMoreWrap');
      if (!grid) return;
      if (filtered.length === 0) {
        if (activeSeries === CUSTOM_SERIES && !searchQuery) {
          grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:34px 16px; color:var(--text-muted); background:rgba(0,0,0,0.22); border:1px dashed var(--border-strong); border-radius:10px;">
            Здесь появляются слова, которые ты сохраняешь при чтении новелл, цитат или дел (кнопка <b>«+ В Мои слова»</b>), а также добавленные вручную.<br><br>
            <button class="pro-mode-btn active" onclick="window._proToggleAddForm()">+ Добавить первое слово вручную</button>
          </div>`;
        } else if (activeSeries.startsWith('deck:') && !searchQuery) {
          const dId = activeSeries.slice(5);
          grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:34px 16px; color:var(--text-muted); background:rgba(0,0,0,0.22); border:1px dashed var(--border-strong); border-radius:10px;">
            В этом сборнике пока нет слов. Добавь их по одному или сразу целым списком!<br><br>
            <button class="pro-mode-btn active" onclick="window._proAddWordToActiveDeck('${dId}')">+ Добавить слово</button>
            <button class="pro-mode-btn" style="margin-left:6px;" onclick="window._proOpenBulkForDeck('${dId}')">+ Загрузить списком</button>
          </div>`;
        } else {
          grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:36px; color:var(--text-muted);">Ничего не найдено. Измени параметры поиска или фильтр.</div>`;
        }
        if (loadMoreWrap) loadMoreWrap.innerHTML = '';
        return;
      }
      const slice = filtered.slice(0, visibleLimit);
      grid.innerHTML = slice.map(w => {
        const mastery = getWordMastery(w.id);
        const starred = mastery >= 100;
        const safeEn = w.en.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const safeRaw = w.isCustom ? String(w.rawKey).replace(/\\/g, '\\\\').replace(/'/g, "\\'") : '';
        const isUserOwned = w.isCustom || w.isDeckWord;
        const badgeText = w.isCustom ? 'МОИ СЛОВА' : (w.isDeckWord ? ('📁 ' + escapeHtml(w.s)) : escapeHtml(w.s));
        const deleteBtnHtml = w.isCustom
          ? `<button class="pro-icon-btn" onclick="window._proDeleteCustom('${safeRaw}')" title="Удалить из «Моих слов»">🗑️</button>`
          : (w.isDeckWord ? `<button class="pro-icon-btn" onclick="window._proDeleteDeckWord('${w.deckId}', '${w.id}')" title="Удалить из сборника">🗑️</button>` : '');
        return `
          <div class="pro-vocab-card ${starred ? 'learned' : ''}">
            <div>
              <div class="pro-card-head">
                <span class="pro-card-badge" style="${isUserOwned ? 'color:#fde047; border-color:#f5d076; background:rgba(158,27,27,0.3);' : ''}">${badgeText}</span>
                <div class="pro-card-actions">
                  <button class="pro-icon-btn" onclick="window._proSpeak('${safeEn}')" title="Озвучить">🔊</button>
                  <button class="pro-icon-btn ${starred ? 'starred' : ''}" onclick="window._proToggle('${w.id}')" title="${starred ? 'Снять отметку выученного' : 'Отметить 100% выученным'}">⭐</button>
                  ${deleteBtnHtml}
                </div>
              </div>
              <div class="pro-card-en" onclick="window._proSpeak('${safeEn}')">${escapeHtml(w.en)}</div>
              <div class="pro-card-ru">${escapeHtml(w.ru)}</div>
              <div class="pro-card-ex">${escapeHtml(w.ex)}</div>
            </div>
            <div class="pro-card-srs-tag">
              <span>${renderMasteryBarsHtml(mastery)}</span>
              <span>${starred ? '✅ Освоено' : (mastery > 0 ? '🔥 В изучении' : 'Новое')}</span>
            </div>
          </div>
        `;
      }).join('');

      if (loadMoreWrap) {
        const remaining = filtered.length - slice.length;
        if (remaining > 0) {
          loadMoreWrap.innerHTML = `
            <button class="pro-mode-btn" onclick="window._proShowMore()">Показать ещё (осталось ${remaining})</button>
            <button class="pro-mode-btn" onclick="window._proShowAll()">Открыть все ${filtered.length}</button>
          `;
        } else {
          loadMoreWrap.innerHTML = '';
        }
      }
    }

    window._proUpdateUI = function() {
      const learned = allWords.filter(w => getWordMastery(w.id) >= 100).length;
      const inProg = allWords.filter(w => { const m = getWordMastery(w.id); return m > 0 && m < 100; }).length;
      const pct = allWords.length ? Math.min(100, Math.round((learned / allWords.length) * 100)) : 0;

      const lEl = document.getElementById('proLearnedStat');
      const dEl = document.getElementById('proDueStat');
      const fEl = document.getElementById('proDictProgFill');
      if (lEl) lEl.textContent = `${learned} / ${allWords.length} (${pct}%)`;
      if (dEl) dEl.textContent = inProg > 0 ? `• В процессе: ${inProg}` : `• Готовы к тренировке`;
      if (fEl) fEl.style.width = pct + '%';
    };

    window._proSpeak = function(txt, slow) { window.speakText(txt, slow ? { rate: 0.72 } : undefined); };
    window._proShowMore = function() { visibleLimit += PAGE_STEP; renderGrid(); };
    window._proShowAll = function() { visibleLimit = filtered.length; renderGrid(); };

    window._proToggle = function(id) {
      const cur = getWordMastery(id);
      setWordMastery(id, cur >= 100 ? 0 : 100);
      renderGrid();
    };

    window._proDeleteCustom = function(rawWord) {
      const list = loadCustomWordsRaw().filter(x => String(x.word).toLowerCase() !== String(rawWord).toLowerCase());
      saveCustomWordsRaw(list);
      rebuildAllWords();
      applyFilters();
      if (typeof window.syncAllCounters === 'function') window.syncAllCounters();
    };

    window._proDeleteDeckWord = function(deckId, wordId) {
      const decks = loadCustomDecksRaw();
      const deck = decks.find(d => d.id === deckId);
      if (!deck) return;
      deck.words = deck.words.filter(w => w.id !== wordId);
      saveCustomDecksRaw(decks);
      rebuildAllWords();
      applyFilters();
      if (typeof window.syncAllCounters === 'function') window.syncAllCounters();
    };

    window._proDeleteDeck = function(deckId) {
      const decks = loadCustomDecksRaw();
      const deck = decks.find(d => d.id === deckId);
      if (!deck) return;
      if (!confirm(`Удалить сборник «${deck.name}» (${deck.words.length} слов)? Встроенные слова останутся на месте.`)) return;
      const nextDecks = decks.filter(d => d.id !== deckId);
      saveCustomDecksRaw(nextDecks);
      if (activeSeries === 'deck:' + deckId) activeSeries = 'ALL';
      if (wtConfig.deck === 'deck:' + deckId) wtConfig.deck = 'UNLEARNED';
      rebuildAllWords();
      applyFilters();
      if (typeof window.syncAllCounters === 'function') window.syncAllCounters();
    };

    window._proToggleAddForm = function() {
      const p = document.getElementById('customAddPanel');
      const dm = document.getElementById('deckManagerPanel');
      if (dm) dm.classList.remove('open');
      if (p) {
        p.classList.toggle('open');
        if (p.classList.contains('open')) {
          syncDeckSelectOptions();
          const inp = document.getElementById('customEnInput');
          if (inp) inp.focus();
        }
      }
    };

    window._proToggleDeckManager = function() {
      const dm = document.getElementById('deckManagerPanel');
      const p = document.getElementById('customAddPanel');
      if (p) p.classList.remove('open');
      if (dm) {
        dm.classList.toggle('open');
        if (dm.classList.contains('open')) {
          syncDeckSelectOptions();
          const inp = document.getElementById('newDeckNameInput');
          if (inp) inp.focus();
        }
      }
    };

    window._proAddWordToActiveDeck = function(deckId) {
      const dm = document.getElementById('deckManagerPanel');
      if (dm) dm.classList.remove('open');
      const p = document.getElementById('customAddPanel');
      if (p) {
        p.classList.add('open');
        syncDeckSelectOptions();
        const sel = document.getElementById('customTargetDeckSelect');
        if (sel) sel.value = 'deck:' + deckId;
        const inp = document.getElementById('customEnInput');
        if (inp) inp.focus();
      }
    };

    window._proOpenBulkForDeck = function(deckId) {
      const p = document.getElementById('customAddPanel');
      if (p) p.classList.remove('open');
      const dm = document.getElementById('deckManagerPanel');
      if (dm) {
        dm.classList.add('open');
        syncDeckSelectOptions();
        const sel = document.getElementById('bulkTargetDeckSelect');
        if (sel) sel.value = 'deck:' + deckId;
        const ta = document.getElementById('newDeckBulkInput');
        if (ta) ta.focus();
      }
    };

    window._proAutoTranslateCustom = async function() {
      const enInp = document.getElementById('customEnInput');
      const ruInp = document.getElementById('customRuInput');
      const btn = document.getElementById('customAutoTransBtn');
      const val = enInp ? enInp.value.trim() : '';
      if (!val || !ruInp) return;
      if (btn) btn.textContent = '⏳...';
      if (typeof window.translateWordFast === 'function') {
        const res = await window.translateWordFast(val);
        if (res && res.ok) ruInp.value = res.text;
      }
      if (btn) btn.textContent = 'Перевести';
    };

    window._proSaveCustomWord = function() {
      const enInp = document.getElementById('customEnInput');
      const ruInp = document.getElementById('customRuInput');
      const sel = document.getElementById('customTargetDeckSelect');
      const en = (enInp ? enInp.value : '').trim();
      const ru = (ruInp ? ruInp.value : '').trim();
      const target = sel ? sel.value : CUSTOM_SERIES;
      if (!en || !ru) {
        alert('Введи английское слово и его перевод (или нажми «Перевести»).');
        return;
      }

      if (target && target.startsWith('deck:')) {
        const deckId = target.slice(5);
        const decks = loadCustomDecksRaw();
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
          const exists = deck.words.find(x => String(x.en).toLowerCase() === en.toLowerCase());
          if (exists) exists.ru = ru;
          else deck.words.push({ id: 'dw_' + Date.now() + '_' + Math.floor(Math.random() * 1000), en, ru });
          saveCustomDecksRaw(decks);
          activeSeries = target;
        }
      } else {
        const list = loadCustomWordsRaw();
        const existing = list.find(x => String(x.word).toLowerCase() === en.toLowerCase());
        if (existing) existing.translation = ru;
        else list.push({ word: en, translation: ru, date: Date.now() });
        saveCustomWordsRaw(list);
        activeSeries = CUSTOM_SERIES;
      }

      if (enInp) enInp.value = '';
      if (ruInp) ruInp.value = '';
      rebuildAllWords();
      applyFilters();
      if (typeof window.syncAllCounters === 'function') window.syncAllCounters();
    };

    function parseBulkLines(rawText) {
      const lines = String(rawText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const parsed = [];
      for (const line of lines) {
        // Разделители: " — ", " – ", " - ", "=", ";", табуляция
        let en = '', ru = '';
        const sepMatch = line.match(/^(.+?)\s*(?:[—–=;|\t]|\s-\s)\s*(.+)$/);
        if (sepMatch) {
          en = sepMatch[1].trim();
          ru = sepMatch[2].trim();
        } else {
          // Если в строке одно английское слово/фраза без перевода
          en = line.trim();
          ru = '';
        }
        if (en.length >= 1) parsed.push({ en, ru });
      }
      return parsed;
    }

    window._proCreateOrImportDeck = async function() {
      const nameInp = document.getElementById('newDeckNameInput');
      const targetSel = document.getElementById('bulkTargetDeckSelect');
      const ta = document.getElementById('newDeckBulkInput');
      const statusEl = document.getElementById('deckManagerStatus');
      const btn = document.getElementById('deckCreateSubmitBtn');

      const nameVal = (nameInp ? nameInp.value : '').trim();
      const targetVal = targetSel ? targetSel.value : 'NEW';
      const bulkItems = parseBulkLines(ta ? ta.value : '');

      let destKey = targetVal;
      const decks = loadCustomDecksRaw();
      let destDeck = null;

      if (targetVal === 'NEW') {
        if (!nameVal) {
          alert('Введи название нового сборника (например: Фразовые глаголы).');
          if (nameInp) nameInp.focus();
          return;
        }
        const newId = 'd' + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10);
        destDeck = { id: newId, name: nameVal.slice(0, 40), createdAt: Date.now(), words: [] };
        decks.unshift(destDeck);
        destKey = 'deck:' + newId;
      } else if (targetVal.startsWith('deck:')) {
        const dId = targetVal.slice(5);
        destDeck = decks.find(d => d.id === dId);
        if (!destDeck) {
          alert('Выбранный сборник не найден.');
          return;
        }
        if (bulkItems.length === 0) {
          alert('Вставь в поле ниже хотя бы одну строку со словом (формат: give up - сдаваться).');
          if (ta) ta.focus();
          return;
        }
      } else if (targetVal === CUSTOM_SERIES) {
        if (bulkItems.length === 0) {
          alert('Вставь хотя бы одну строку со словом для добавления в «Мои слова».');
          if (ta) ta.focus();
          return;
        }
      }

      // Если есть слова без перевода, автоматически переведём до 25 строк
      const needTrans = bulkItems.filter(it => !it.ru);
      if (needTrans.length > 0 && typeof window.translateWordFast === 'function') {
        if (btn) { btn.disabled = true; btn.textContent = 'Переводим...'; }
        if (statusEl) statusEl.textContent = `Автоперевод ${Math.min(needTrans.length, 25)} слов...`;
        for (let i = 0; i < Math.min(needTrans.length, 25); i++) {
          const res = await window.translateWordFast(needTrans[i].en);
          needTrans[i].ru = (res && res.ok) ? res.text : 'перевод не указан';
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Сохранить сборник'; }
      }

      let addedCount = 0;
      if (destKey === CUSTOM_SERIES) {
        const list = loadCustomWordsRaw();
        bulkItems.forEach(it => {
          const ex = list.find(x => String(x.word).toLowerCase() === it.en.toLowerCase());
          if (ex) ex.translation = it.ru || ex.translation;
          else { list.push({ word: it.en, translation: it.ru || 'перевод не указан', date: Date.now() }); addedCount++; }
        });
        saveCustomWordsRaw(list);
      } else if (destDeck) {
        bulkItems.forEach((it, idx) => {
          const ex = destDeck.words.find(x => String(x.en).toLowerCase() === it.en.toLowerCase());
          if (ex) ex.ru = it.ru || ex.ru;
          else {
            destDeck.words.push({
              id: 'dw_' + destDeck.id + '_' + Date.now() + '_' + idx,
              en: it.en,
              ru: it.ru || 'перевод не указан'
            });
            addedCount++;
          }
        });
        saveCustomDecksRaw(decks);
      }

      if (nameInp && targetVal === 'NEW') nameInp.value = '';
      if (ta) ta.value = '';
      if (statusEl) {
        statusEl.style.color = '#6be38c';
        statusEl.textContent = targetVal === 'NEW'
          ? `Сборник «${destDeck.name}» создан${addedCount ? ` (+${addedCount} слов)` : ''}!`
          : `Добавлено слов: ${addedCount}.`;
        setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3200);
      }

      activeSeries = destKey;
      rebuildAllWords();
      applyFilters();
      if (typeof window.syncAllCounters === 'function') window.syncAllCounters();
    };

    window._proShuffle = function() {
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
      renderGrid();
    };

    window._proSetMode = function(mode) {
      currentView = mode;
      const bGrid = document.getElementById('btnModeGrid');
      const bTr = document.getElementById('btnModeTrainer');
      const trArea = document.getElementById('proTrainerArea');
      const grid = document.getElementById('proCardsGrid');
      const lm = document.getElementById('proLoadMoreWrap');
      const ctrls = document.getElementById('proGridControlsWrap');
      const activeBar = document.getElementById('activeDeckBar');

      if (bGrid) bGrid.classList.toggle('active', mode === 'grid');
      if (bTr) bTr.classList.toggle('active', mode === 'trainer');
      if (trArea) trArea.classList.toggle('active', mode === 'trainer');
      if (grid) grid.style.display = mode === 'grid' ? 'grid' : 'none';
      if (lm) lm.style.display = mode === 'grid' ? 'flex' : 'none';
      if (ctrls) ctrls.style.display = mode === 'grid' ? 'block' : 'none';
      if (activeBar && mode !== 'grid') activeBar.classList.remove('show');

      if (mode === 'trainer') {
        if (!wtSession.active) renderTrainerLobby();
      } else {
        wtSession.active = false;
        applyFilters();
      }
    };

    // ==================== 4-СТУПЕНЧАТЫЙ ИНТЕНСИВ-ТРЕНАЖЁР СЛОВ ====================
    let wtConfig = {
      deck: 'UNLEARNED', // 'UNLEARNED' | 'ALL' | 'Мои слова' | seriesName
      size: 10,
      mode: 'smart' // 'smart' | 'flash' | 'quiz' | 'build' | 'listen'
    };

    let wtSession = {
      active: false,
      queue: [],          // [{ word, forcedStep }]
      currentItem: null,
      currentStep: 'intro', // 'intro' | 'quiz_en_ru' | 'quiz_ru_en' | 'build_letters' | 'build_words' | 'listen'
      completedSteps: 0,
      totalTargetSteps: 0,
      correctCount: 0,
      wrongCount: 0,
      masteredInSession: [],
      missedInSession: [],
      practicedWords: [],
      locked: false,
      options: [],
      correctOptIdx: -1,
      // Для конструктора слов/букв
      targetTokens: [],
      bankTokens: [],
      chosenBankIdxs: [],
      hintUsed: false,
      isLetterMode: true
    };

    function getDeckWords(deckKey) {
      if (deckKey === 'UNLEARNED') {
        const unl = allWords.filter(w => getWordMastery(w.id) < 100);
        return unl.length > 0 ? unl : [...allWords];
      }
      if (deckKey === 'ALL') return [...allWords];
      return allWords.filter(w => w.deckKey === deckKey || w.s === deckKey);
    }

    function renderTrainerLobby() {
      const area = document.getElementById('proTrainerArea');
      if (!area) return;
      const customCnt = allWords.filter(w => w.isCustom).length;
      const unlCnt = allWords.filter(w => getWordMastery(w.id) < 100).length;

      // Если активный фильтр в словаре — конкретный сериал или «Мои слова», удобно предложить его
      const userDecks = loadCustomDecksRaw().map(d => ({
        k: 'deck:' + d.id,
        label: `📁 ${escapeHtml(d.name)} (${d.words.length})`
      }));

      const decks = [
        { k: 'UNLEARNED', label: `Невыученные (${unlCnt})` },
        { k: CUSTOM_SERIES, label: `Мои слова (${customCnt})` },
        ...userDecks,
        { k: 'The Vampire Diaries', label: '<img src="tvd-card.jpg" alt="" class="series-thumb">Vampire Diaries' },
        { k: 'Desperate Housewives', label: '<img src="house-wives.jpg" alt="" class="series-thumb">Housewives' },
        { k: 'Supernatural', label: '<img src="spn-card.jpg" alt="" class="series-thumb">Supernatural' },
        { k: 'The Penthouse', label: '<img src="penthouse-card.jpg" alt="" class="series-thumb">Penthouse' },
        { k: 'Once Upon a Time', label: '<img src="once-upon.jpg" alt="" class="series-thumb">Once Upon a Time' },
        { k: 'ALL', label: `Вся база (${allWords.length})` }
      ];

      const modes = [
        { k: 'smart', label: 'Умный цикл (0% → 100%)' },
        { k: 'flash', label: 'Знакомство / Карточки' },
        { k: 'quiz', label: 'Выбор перевода (4 вар.)' },
        { k: 'build', label: 'Сборка слова / фразы' },
        { k: 'listen', label: 'Аудирование (на слух)' }
      ];

      const deckPool = getDeckWords(wtConfig.deck);
      const startDisabled = deckPool.length === 0;

      area.innerHTML = `
        <div class="wt-lobby-title"><img src="ico-trainer.jpg" alt="" class="ui-ico" style="width:16px;height:16px;" onerror="this.style.display='none'"> Тренажёр лексики</div>
        <div class="wt-lobby-sub">
          Каждое слово проходит 4 этапа до полного освоения (<b>0% → 25% → 50% → 75% → 100% ⭐</b>):<br>
          Знакомство → Выбор перевода → Сборка по буквам/словам → Аудирование на слух.
        </div>

        <div class="wt-label">1. Колода для тренировки:</div>
        <div class="wt-chip-row">
          ${decks.map(d => `<button class="wt-chip ${wtConfig.deck === d.k ? 'active' : ''}" onclick="window._wtSetCfg('deck', '${d.k.replace(/'/g, "\\'")}')">${d.label}</button>`).join('')}
        </div>

        <div class="wt-label">2. Режим тренировки:</div>
        <div class="wt-chip-row">
          ${modes.map(m => `<button class="wt-chip ${wtConfig.mode === m.k ? 'active' : ''}" onclick="window._wtSetCfg('mode', '${m.k}')">${m.label}</button>`).join('')}
        </div>

        <div class="wt-label">3. Размер сессии (слов за подход):</div>
        <div class="wt-chip-row">
          ${[5, 10, 15].map(n => `<button class="wt-chip ${wtConfig.size === n ? 'active' : ''}" onclick="window._wtSetCfg('size', ${n})">${n} слов</button>`).join('')}
        </div>

        ${startDisabled
          ? `<div style="margin-top:16px; padding:12px; border:1px dashed #ef4444; border-radius:8px; color:#fca5a5; font-size:0.84rem; text-align:center;">В выбранной колоде «${escapeHtml(wtConfig.deck)}» пока 0 слов. Добавь слова при чтении или выбери другую колоду.</div>`
          : `<button class="wt-start-btn" onclick="window._wtStartSession()">Начать тренировку (${Math.min(wtConfig.size, deckPool.length)} слов)</button>`
        }
      `;
    }

    window._wtSetCfg = function(key, val) {
      wtConfig[key] = val;
      renderTrainerLobby();
    };

    function pickStepForWord(word) {
      const m = getWordMastery(word.id);
      if (wtConfig.mode === 'flash') return 'intro';
      if (wtConfig.mode === 'quiz') return Math.random() < 0.6 ? 'quiz_en_ru' : 'quiz_ru_en';
      if (wtConfig.mode === 'build') return shouldUseLetterMode(word.en) ? 'build_letters' : 'build_words';
      if (wtConfig.mode === 'listen') return 'listen';

      // Умный цикл: строгая прогрессия 0% -> 25% -> 50% -> 75% -> 100%
      if (m < 25) return 'intro';
      if (m < 50) return Math.random() < 0.65 ? 'quiz_en_ru' : 'quiz_ru_en';
      if (m < 75) return shouldUseLetterMode(word.en) ? 'build_letters' : 'build_words';
      return 'listen';
    }

    function shouldUseLetterMode(enText) {
      const clean = String(enText || '').trim();
      const lettersOnly = clean.replace(/[^A-Za-z]/g, '');
      const wordCount = clean.split(/\s+/).length;
      return (wordCount === 1 && lettersOnly.length >= 2 && lettersOnly.length <= 15)
        || (wordCount === 2 && lettersOnly.length <= 12);
    }

    function shuffleArr(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    window._wtStartSession = function(customWordsList) {
      let pool = Array.isArray(customWordsList) && customWordsList.length > 0
        ? [...customWordsList]
        : getDeckWords(wtConfig.deck);
      if (pool.length === 0) return;

      // В умном режиме сначала берём слова в процессе (25-75%), затем новые (0%), и только потом выученные
      if (!customWordsList) {
        pool = shuffleArr(pool);
        if (wtConfig.mode === 'smart') {
          pool.sort((a, b) => {
            const ma = getWordMastery(a.id);
            const mb = getWordMastery(b.id);
            const rank = m => (m > 0 && m < 100) ? 0 : (m === 0 ? 1 : 2);
            return rank(ma) - rank(mb);
          });
        }
      }

      const chosen = pool.slice(0, Math.min(wtConfig.size, pool.length));
      wtSession = {
        active: true,
        queue: chosen.map(w => ({ word: w, pass: 0 })),
        currentItem: null,
        currentStep: 'intro',
        completedSteps: 0,
        totalTargetSteps: wtConfig.mode === 'smart' ? chosen.length * 2 : chosen.length,
        correctCount: 0,
        wrongCount: 0,
        masteredInSession: [],
        missedInSession: [],
        practicedWords: [...chosen],
        locked: false,
        options: [],
        correctOptIdx: -1,
        targetTokens: [],
        bankTokens: [],
        chosenBankIdxs: [],
        hintUsed: false,
        isLetterMode: true
      };
      nextTrainerCard();
    };

    function nextTrainerCard() {
      if (!wtSession.active) return;
      if (wtSession.queue.length === 0) {
        renderTrainerSummary();
        return;
      }
      wtSession.currentItem = wtSession.queue.shift();
      wtSession.locked = false;
      wtSession.hintUsed = false;
      wtSession.currentStep = pickStepForWord(wtSession.currentItem.word);
      renderTrainerStep();
    }

    function maskWordInQuote(quote, wordEn) {
      if (!quote) return '';
      const esc = wordEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(esc, 'gi');
      if (rx.test(quote)) return escapeHtml(quote).replace(new RegExp(esc, 'gi'), '<b style="color:#fde047; border-bottom:1px dashed #d4af37;">_____</b>');
      return escapeHtml(quote);
    }

    function buildQuizOptions(targetWord, isEnToRu) {
      const distractors = [];
      const src = shuffleArr(allWords);
      const targetVal = isEnToRu ? shortRussian(targetWord.ru) : targetWord.en;
      for (let i = 0; i < src.length && distractors.length < 3; i++) {
        const cand = src[i];
        if (!cand || cand.id === targetWord.id) continue;
        const val = isEnToRu ? shortRussian(cand.ru) : cand.en;
        if (!val || val.toLowerCase() === targetVal.toLowerCase()) continue;
        if (distractors.some(d => d.text.toLowerCase() === val.toLowerCase())) continue;
        distractors.push({ text: val, isCorrect: false });
      }
      while (distractors.length < 3) distractors.push({ text: isEnToRu ? 'другое значение' : 'other phrase', isCorrect: false });
      const opts = shuffleArr([{ text: targetVal, isCorrect: true }, ...distractors]);
      wtSession.options = opts;
      wtSession.correctOptIdx = opts.findIndex(o => o.isCorrect);
      return opts;
    }

    function stageMetaLabel(step) {
      const map = {
        intro: 'ЭТАП 1/4 • ЗНАКОМСТВО',
        quiz_en_ru: 'ЭТАП 2/4 • ВЫБОР ПЕРЕВОДА',
        quiz_ru_en: 'ЭТАП 2/4 • ОБРАТНЫЙ ПЕРЕВОД',
        build_letters: 'ЭТАП 3/4 • СБОРКА ПО БУКВАМ',
        build_words: 'ЭТАП 3/4 • КОНСТРУКТОР ФРАЗЫ',
        listen: 'ЭТАП 4/4 • АУДИРОВАНИЕ'
      };
      return map[step] || 'ТРЕНИРОВКА';
    }

    function renderTrainerStep() {
      const area = document.getElementById('proTrainerArea');
      if (!area || !wtSession.currentItem) return;
      const w = wtSession.currentItem.word;
      const step = wtSession.currentStep;
      const mastery = getWordMastery(w.id);
      const progressPct = Math.min(100, Math.round((wtSession.completedSteps / Math.max(1, wtSession.totalTargetSteps)) * 100));
      const safeEn = w.en.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      let bodyHtml = '';

      if (step === 'intro') {
        bodyHtml = `
          <div class="wt-big-word">${escapeHtml(w.en)}</div>
          <div class="wt-audio-row">
            <button class="wt-audio-btn" onclick="window._proSpeak('${safeEn}', false)">🔊 Озвучить</button>
            <button class="wt-audio-btn" onclick="window._proSpeak('${safeEn}', true)">🐢 Медленно</button>
          </div>
          <div class="wt-trans-reveal">${escapeHtml(w.ru)}</div>
          <div class="wt-quote-ctx">«${escapeHtml(w.ex)}»</div>
          <div class="wt-action-row">
            <button class="pro-mode-btn" style="background:#195228; border-color:#6be38c;" onclick="window._wtIntroKnown()">✅ Уже знаю (100% ⭐)</button>
            <button class="pro-mode-btn active" style="padding:11px 22px;" onclick="window._wtIntroLearn()">🚀 Учить слово (+25%) →</button>
          </div>
        `;
        setTimeout(() => window._proSpeak(w.en, false), 120);
      } else if (step === 'quiz_en_ru' || step === 'quiz_ru_en') {
        const isEnToRu = step === 'quiz_en_ru';
        const opts = buildQuizOptions(w, isEnToRu);
        bodyHtml = `
          <div style="font-size:0.78rem; color:#b8a693; margin-bottom:6px;">${isEnToRu ? 'Выбери верный перевод:' : 'Выбери верное английское выражение:'}</div>
          <div class="wt-big-word" style="${!isEnToRu ? 'font-size:clamp(1.4rem,4vw,1.95rem); color:#6be38c;' : ''}">${escapeHtml(isEnToRu ? w.en : shortRussian(w.ru))}</div>
          ${isEnToRu ? `
            <div class="wt-audio-row">
              <button class="wt-audio-btn" onclick="window._proSpeak('${safeEn}', false)">🔊 Повторить</button>
              <button class="wt-audio-btn" onclick="window._proSpeak('${safeEn}', true)">🐢 Медленно</button>
            </div>` : ''}
          <div class="wt-opts-grid">
            ${opts.map((o, i) => `
              <button class="wt-opt-btn" id="wtOpt-${i}" onclick="window._wtAnswerQuiz(${i})">
                <span class="wt-opt-num">${i + 1}</span>
                <span>${escapeHtml(o.text)}</span>
              </button>
            `).join('')}
          </div>
          <div id="wtFeedback" class="wt-feedback"></div>
          <div id="wtNextRow" class="wt-action-row" style="display:none;">
            <button class="pro-mode-btn active" onclick="window._wtContinue()">Дальше (Enter) →</button>
          </div>
        `;
        if (isEnToRu) setTimeout(() => window._proSpeak(w.en, false), 120);
      } else if (step === 'build_letters' || step === 'build_words') {
        wtSession.isLetterMode = (step === 'build_letters');
        wtSession.chosenBankIdxs = [];

        if (wtSession.isLetterMode) {
          // Собираем только буквы (пробелы/дефисы/апострофы отображаются автоматически)
          const rawChars = w.en.split('');
          wtSession.targetTokens = rawChars;
          const letterChars = rawChars.filter(ch => /[A-Za-z]/.test(ch)).map(ch => ch.toLowerCase());
          // Добавляем 2 случайные лишние буквы для интереса, если слово короткое
          const extraLetters = 'aeiourstlndcm';
          const bank = [...letterChars];
          if (letterChars.length <= 8) {
            bank.push(extraLetters[Math.floor(Math.random() * extraLetters.length)]);
            bank.push(extraLetters[Math.floor(Math.random() * extraLetters.length)]);
          }
          wtSession.bankTokens = shuffleArr(bank);
        } else {
          const wordsArr = w.en.trim().split(/\s+/);
          wtSession.targetTokens = wordsArr;
          const extras = [];
          const poolWords = shuffleArr(allWords);
          for (let i = 0; i < poolWords.length && extras.length < 2; i++) {
            const parts = poolWords[i].en.trim().split(/\s+/);
            const pick = parts[Math.floor(Math.random() * parts.length)];
            if (pick && pick.length >= 2 && !wordsArr.some(x => x.toLowerCase() === pick.toLowerCase()) && !extras.includes(pick)) {
              extras.push(pick);
            }
          }
          wtSession.bankTokens = shuffleArr([...wordsArr, ...extras]);
        }

        bodyHtml = `
          <div style="font-size:0.78rem; color:#b8a693; margin-bottom:6px;">${wtSession.isLetterMode ? 'Собери слово по буквам (тапай или печатай с клавиатуры):' : 'Собери выражение из слов в правильном порядке:'}</div>
          <div class="wt-trans-reveal" style="font-size:1.25rem; margin-top:4px;">${escapeHtml(shortRussian(w.ru))}</div>
          <div class="wt-quote-ctx">Контекст: «${maskWordInQuote(w.ex, w.en)}»</div>
          <div id="wtSlots" class="wt-slots"></div>
          <div id="wtTilesBank" class="wt-tiles-bank"></div>
          <div class="wt-action-row" id="wtBuildTools">
            <button class="wt-audio-btn" onclick="window._wtBuildBackspace()">⌫ Стереть</button>
            <button class="wt-audio-btn" onclick="window._wtBuildHint()">💡 Подсказка</button>
            <button class="wt-audio-btn" onclick="window._proSpeak('${safeEn}', false)">🔊 На слух</button>
          </div>
          <div id="wtFeedback" class="wt-feedback"></div>
          <div id="wtNextRow" class="wt-action-row" style="display:none;">
            <button class="pro-mode-btn active" onclick="window._wtContinue()">Дальше (Enter) →</button>
          </div>
        `;
      } else if (step === 'listen') {
        const opts = buildQuizOptions(w, true);
        bodyHtml = `
          <div style="font-size:0.8rem; color:#b8a693; margin-bottom:8px;">Прослушай фразу и выбери её точный перевод:</div>
          <button class="wt-audio-orb" onclick="window._proSpeak('${safeEn}', false)" title="Прослушать снова">🔊</button>
          <div class="wt-audio-row">
            <button class="wt-audio-btn" onclick="window._proSpeak('${safeEn}', true)">🐢 Прослушать медленно</button>
            <button class="wt-audio-btn" id="wtListenPeekBtn" onclick="window._wtListenPeek()">👁️ Показать текст</button>
          </div>
          <div id="wtListenRevealWord" style="display:none; font-family:'Cormorant Garamond',serif; font-size:1.65rem; font-weight:700; color:#fde047; margin-bottom:10px;">${escapeHtml(w.en)}</div>
          <div class="wt-opts-grid">
            ${opts.map((o, i) => `
              <button class="wt-opt-btn" id="wtOpt-${i}" onclick="window._wtAnswerQuiz(${i})">
                <span class="wt-opt-num">${i + 1}</span>
                <span>${escapeHtml(o.text)}</span>
              </button>
            `).join('')}
          </div>
          <div id="wtFeedback" class="wt-feedback"></div>
          <div id="wtNextRow" class="wt-action-row" style="display:none;">
            <button class="pro-mode-btn active" onclick="window._wtContinue()">Дальше (Enter) →</button>
          </div>
        `;
        setTimeout(() => window._proSpeak(w.en, false), 140);
      }

      area.innerHTML = `
        <div class="wt-topbar">
          <span class="wt-stage-badge">${stageMetaLabel(step)}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.78rem; color:#c9b7a3;">Осталось шагов: <b style="color:#f5d076;">${wtSession.queue.length + 1}</b></span>
            <button class="hud-btn" onclick="window._wtToggleSfx()">${wtSfxOn ? '🎵 Звук: ВКЛ' : '🔇 Звук: ВЫКЛ'}</button>
            <button class="hud-btn" onclick="window._wtExitToLobby()">✕ Завершить</button>
          </div>
        </div>
        <div class="wt-session-bar"><div class="wt-session-fill" style="width:${progressPct}%"></div></div>
        <div class="wt-card-stage">
          <div class="wt-word-meta">
            <span>📁 ${escapeHtml(w.isCustom ? 'Мои слова' : w.s)}</span>
            <span>Освоение слова: ${renderMasteryBarsHtml(mastery)}</span>
          </div>
          ${bodyHtml}
        </div>
      `;

      if (step === 'build_letters' || step === 'build_words') {
        renderBuildBoard();
      }
    }

    function renderBuildBoard() {
      const slotsEl = document.getElementById('wtSlots');
      const bankEl = document.getElementById('wtTilesBank');
      if (!slotsEl || !bankEl) return;

      if (wtSession.isLetterMode) {
        let filledCursor = 0;
        slotsEl.innerHTML = wtSession.targetTokens.map(ch => {
          if (!/[A-Za-z]/.test(ch)) {
            return ch === ' '
              ? `<span class="wt-slot-char space-gap"></span>`
              : `<span class="wt-slot-char" style="border-style:dotted; opacity:0.8;">${escapeHtml(ch)}</span>`;
          }
          const bIdx = wtSession.chosenBankIdxs[filledCursor];
          const pos = filledCursor;
          filledCursor++;
          if (bIdx !== undefined) {
            return `<span class="wt-slot-char filled" onclick="window._wtBuildRemoveAt(${pos})">${escapeHtml(wtSession.bankTokens[bIdx])}</span>`;
          }
          return `<span class="wt-slot-char">·</span>`;
        }).join('');
      } else {
        slotsEl.innerHTML = wtSession.targetTokens.map((_, idx) => {
          const bIdx = wtSession.chosenBankIdxs[idx];
          if (bIdx !== undefined) {
            return `<span class="wt-slot-char filled" style="padding:0 11px; font-size:0.9rem;" onclick="window._wtBuildRemoveAt(${idx})">${escapeHtml(wtSession.bankTokens[bIdx])}</span>`;
          }
          return `<span class="wt-slot-char" style="min-width:62px;">___</span>`;
        }).join('');
      }

      bankEl.innerHTML = wtSession.bankTokens.map((tok, i) => {
        const used = wtSession.chosenBankIdxs.includes(i);
        return `<button class="wt-tile" ${used || wtSession.locked ? 'disabled' : ''} onclick="window._wtBuildPick(${i})">${escapeHtml(tok)}</button>`;
      }).join('');
    }

    function getRequiredSlotCount() {
      if (wtSession.isLetterMode) {
        return wtSession.targetTokens.filter(ch => /[A-Za-z]/.test(ch)).length;
      }
      return wtSession.targetTokens.length;
    }

    window._wtBuildPick = function(bankIdx) {
      if (wtSession.locked) return;
      if (wtSession.chosenBankIdxs.includes(bankIdx)) return;
      const reqCount = getRequiredSlotCount();
      if (wtSession.chosenBankIdxs.length >= reqCount) return;
      wtBeep('tap');
      wtSession.chosenBankIdxs.push(bankIdx);
      renderBuildBoard();
      if (wtSession.chosenBankIdxs.length === reqCount) {
        evaluateBuildAnswer();
      }
    };

    window._wtBuildRemoveAt = function(pos) {
      if (wtSession.locked) return;
      wtSession.chosenBankIdxs.splice(pos, 1);
      renderBuildBoard();
    };

    window._wtBuildBackspace = function() {
      if (wtSession.locked || wtSession.chosenBankIdxs.length === 0) return;
      wtSession.chosenBankIdxs.pop();
      renderBuildBoard();
    };

    window._wtBuildHint = function() {
      if (wtSession.locked) return;
      wtSession.hintUsed = true;
      const reqList = wtSession.isLetterMode
        ? wtSession.targetTokens.filter(ch => /[A-Za-z]/.test(ch)).map(c => c.toLowerCase())
        : wtSession.targetTokens;

      // Откатываем неправильный хвост, если пользователь уже ввёл что-то не то
      while (wtSession.chosenBankIdxs.length > 0) {
        const idx = wtSession.chosenBankIdxs.length - 1;
        const picked = wtSession.bankTokens[wtSession.chosenBankIdxs[idx]];
        if (picked.toLowerCase() !== reqList[idx].toLowerCase()) {
          wtSession.chosenBankIdxs.pop();
        } else {
          break;
        }
      }

      const nextPos = wtSession.chosenBankIdxs.length;
      if (nextPos >= reqList.length) return;
      const needed = reqList[nextPos].toLowerCase();
      const foundBankIdx = wtSession.bankTokens.findIndex((tok, i) => !wtSession.chosenBankIdxs.includes(i) && tok.toLowerCase() === needed);
      if (foundBankIdx !== -1) {
        window._wtBuildPick(foundBankIdx);
      }
    };

    function evaluateBuildAnswer() {
      const w = wtSession.currentItem.word;
      const reqList = wtSession.isLetterMode
        ? wtSession.targetTokens.filter(ch => /[A-Za-z]/.test(ch)).map(c => c.toLowerCase())
        : wtSession.targetTokens.map(t => t.toLowerCase());
      const userList = wtSession.chosenBankIdxs.map(i => wtSession.bankTokens[i].toLowerCase());
      const isCorrect = reqList.length === userList.length && reqList.every((v, i) => v === userList[i]);

      wtSession.locked = true;
      const slots = document.querySelectorAll('#wtSlots .wt-slot-char.filled');
      slots.forEach(s => s.classList.add(isCorrect ? 'ok' : 'bad'));

      const tools = document.getElementById('wtBuildTools');
      if (tools) tools.style.display = 'none';

      finishStepEvaluation(isCorrect, w);
    }

    window._wtListenPeek = function() {
      wtSession.hintUsed = true;
      const el = document.getElementById('wtListenRevealWord');
      if (el) el.style.display = 'block';
      const btn = document.getElementById('wtListenPeekBtn');
      if (btn) btn.style.display = 'none';
    };

    window._wtIntroKnown = function() {
      const w = wtSession.currentItem.word;
      wtBeep('ok');
      setWordMastery(w.id, 100);
      if (!wtSession.masteredInSession.some(x => x.id === w.id)) wtSession.masteredInSession.push(w);
      wtSession.completedSteps++;
      wtSession.correctCount++;
      nextTrainerCard();
    };

    window._wtIntroLearn = function() {
      const w = wtSession.currentItem.word;
      wtBeep('tap');
      const curM = getWordMastery(w.id);
      if (curM < 25) setWordMastery(w.id, 25);
      wtSession.completedSteps++;
      if (wtConfig.mode === 'smart') {
        // Ставим слово на следующий этап тренировки чуть дальше в очереди
        const insertAt = Math.min(wtSession.queue.length, 2);
        wtSession.queue.splice(insertAt, 0, { word: w, pass: wtSession.currentItem.pass + 1 });
      }
      nextTrainerCard();
    };

    window._wtAnswerQuiz = function(idx) {
      if (wtSession.locked) return;
      wtSession.locked = true;
      const w = wtSession.currentItem.word;
      const isCorrect = (idx === wtSession.correctOptIdx);

      const chosenBtn = document.getElementById('wtOpt-' + idx);
      const rightBtn = document.getElementById('wtOpt-' + wtSession.correctOptIdx);
      document.querySelectorAll('.wt-opt-btn').forEach(b => b.disabled = true);
      if (rightBtn) rightBtn.classList.add('correct');
      if (!isCorrect && chosenBtn) chosenBtn.classList.add('wrong');

      const revWord = document.getElementById('wtListenRevealWord');
      if (revWord) revWord.style.display = 'block';

      finishStepEvaluation(isCorrect, w);
    };

    function finishStepEvaluation(isCorrect, w) {
      const fb = document.getElementById('wtFeedback');
      const nextRow = document.getElementById('wtNextRow');
      wtSession.completedSteps++;

      if (isCorrect) {
        wtBeep('ok');
        wtSession.correctCount++;
        const curM = getWordMastery(w.id);
        const bump = wtSession.hintUsed ? 0 : 25;
        const newM = Math.min(100, curM + bump);
        if (bump > 0) setWordMastery(w.id, newM);

        if (newM >= 100) {
          if (!wtSession.masteredInSession.some(x => x.id === w.id)) wtSession.masteredInSession.push(w);
        } else if (wtConfig.mode === 'smart' && wtSession.currentItem.pass < 3) {
          const insertAt = Math.min(wtSession.queue.length, 3);
          wtSession.queue.splice(insertAt, 0, { word: w, pass: wtSession.currentItem.pass + 1 });
        }

        if (fb) {
          fb.className = 'wt-feedback ok';
          fb.innerHTML = newM >= 100
            ? `🏆 Блестяще! Слово <b>«${escapeHtml(w.en)}»</b> освоено на 100% ⭐`
            : (wtSession.hintUsed
                ? `✓ Верно (с подсказкой): <b>${escapeHtml(w.en)}</b> — ${escapeHtml(shortRussian(w.ru))}`
                : `✓ Отлично! Прогресс слова: <b>${newM}%</b> — ${escapeHtml(w.en)}`);
        }
        window._proSpeak(w.en, false);
        if (nextRow) nextRow.style.display = 'flex';
      } else {
        wtBeep('bad');
        wtSession.wrongCount++;
        const curM = getWordMastery(w.id);
        setWordMastery(w.id, Math.max(25, curM - 25), 60 * 1000);
        if (!wtSession.missedInSession.some(x => x.id === w.id)) wtSession.missedInSession.push(w);

        // Возвращаем слово в очередь на закрепление
        const insertAt = Math.min(wtSession.queue.length, 2);
        wtSession.queue.splice(insertAt, 0, { word: w, pass: wtSession.currentItem.pass });

        if (fb) {
          fb.className = 'wt-feedback bad';
          fb.innerHTML = `✗ Верный ответ: <b style="color:#fde047;">${escapeHtml(w.en)}</b> — ${escapeHtml(w.ru)}<br><span style="font-weight:400; font-size:0.8rem; opacity:0.9;">Вернём это слово чуть позже, чтобы точно закрепить!</span>`;
        }
        window._proSpeak(w.en, false);
        if (nextRow) nextRow.style.display = 'flex';
      }
    }

    window._wtContinue = function() {
      nextTrainerCard();
    };

    window._wtToggleSfx = function() {
      wtSfxOn = !wtSfxOn;
      renderTrainerStep();
    };

    window._wtExitToLobby = function() {
      wtSession.active = false;
      if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
      renderTrainerLobby();
    };

    function renderTrainerSummary() {
      wtSession.active = false;
      const area = document.getElementById('proTrainerArea');
      if (!area) return;
      const totalAns = wtSession.correctCount + wtSession.wrongCount;
      const acc = totalAns > 0 ? Math.round((wtSession.correctCount / totalAns) * 100) : 100;
      const hasMissed = wtSession.missedInSession.length > 0;

      area.innerHTML = `
        <div class="wt-card-stage">
          <div class="wt-lobby-title">🏆 Сессия завершена!</div>
          <div class="wt-lobby-sub">Отличная тренировка, агент. Прогресс по всем словам сохранён.</div>

          <div class="wt-summary-grid">
            <div class="wt-summary-tile"><b>${acc}%</b><span>ТОЧНОСТЬ</span></div>
            <div class="wt-summary-tile"><b>+${wtSession.masteredInSession.length} ⭐</b><span>ОСВОЕНО НА 100%</span></div>
            <div class="wt-summary-tile"><b>${dailyState.count}/${dailyState.target}</b><span>ЦЕЛЬ ДНЯ</span></div>
          </div>

          <div style="text-align:left; max-height:210px; overflow-y:auto; background:rgba(0,0,0,0.34); border:1px solid rgba(212,175,55,0.25); border-radius:10px; padding:10px; margin:12px 0;">
            ${wtSession.practicedWords.map(w => {
              const safeEn = w.en.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
              return `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:7px 4px; border-bottom:1px dashed rgba(212,175,55,0.18); font-size:0.82rem;">
                  <div>
                    <b style="color:#f5d076;">${escapeHtml(w.en)}</b>
                    <span style="color:#c9b7a3;"> — ${escapeHtml(shortRussian(w.ru))}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <span style="font-size:0.72rem; color:#6be38c;">${getWordMastery(w.id)}%</span>
                    <button class="pro-icon-btn" onclick="window._proSpeak('${safeEn}', false)">🔊</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="wt-action-row">
            ${hasMissed ? `<button class="pro-mode-btn" style="background:#6e4814;" onclick="window._wtRetryMissed()">🎯 Отработать ошибки (${wtSession.missedInSession.length})</button>` : ''}
            <button class="pro-mode-btn active" onclick="window._wtStartSession()">🔥 Следующая сессия</button>
            <button class="pro-mode-btn" onclick="window._wtExitToLobby()">⚙️ Настройки</button>
            <button class="pro-mode-btn" onclick="window._proSetMode('grid')">🗂️ К карточкам</button>
          </div>
        </div>
      `;
    }

    window._wtRetryMissed = function() {
      window._wtStartSession([...wtSession.missedInSession]);
    };

    // Клавиатурные горячие клавиши для ноутбука (1-4, Enter, Backspace, ввод букв в конструкторе)
    document.addEventListener('keydown', function(e) {
      if (!wtSession.active || currentView !== 'trainer') return;
      const dictTab = document.getElementById('dict');
      if (!dictTab || !dictTab.classList.contains('active')) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;

      const step = wtSession.currentStep;
      if (e.key === 'Enter') {
        if (step === 'intro') { e.preventDefault(); window._wtIntroLearn(); return; }
        if (wtSession.locked) { e.preventDefault(); window._wtContinue(); return; }
      }
      if ((step === 'quiz_en_ru' || step === 'quiz_ru_en' || step === 'listen') && !wtSession.locked) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx < wtSession.options.length) { e.preventDefault(); window._wtAnswerQuiz(idx); }
        }
      }
      if (step === 'build_letters' && !wtSession.locked) {
        if (e.key === 'Backspace') {
          e.preventDefault();
          window._wtBuildBackspace();
        } else if (/^[a-zA-Z]$/.test(e.key)) {
          const ch = e.key.toLowerCase();
          const bIdx = wtSession.bankTokens.findIndex((tok, i) => !wtSession.chosenBankIdxs.includes(i) && tok.toLowerCase() === ch);
          if (bIdx !== -1) {
            e.preventDefault();
            window._wtBuildPick(bIdx);
          }
        }
      }
    });

    function mount500Dictionary() {
      const container = document.getElementById('masterDictMount');
      if (!container) return;
      loadState();
      container.innerHTML = `
        <div class="pro-dict-wrap">
          <div class="pro-dict-top">
            <div>
              <h2 class="pro-dict-title"><img src="ico-dict.jpg" alt="" class="ui-ico-md" onerror="this.style.display='none'"> Мастер-Словарь (<span id="proTotalCount">500</span>)</h2>
              <div class="pro-dict-sub">Живая озвучка, личная коллекция «Мои слова» и 4-ступенчатый интенсив-тренажёр</div>
            </div>
            <div class="pro-dict-modes">
              <button id="btnModeGrid" class="pro-mode-btn active" onclick="window._proSetMode('grid')">Карточки</button>
              <button id="btnModeTrainer" class="pro-mode-btn" onclick="window._proSetMode('trainer')"><img src="ico-trainer.jpg" alt="" class="ui-ico" style="width:16px;height:16px;" onerror="this.style.display='none'"> Тренажёр</button>
              <button class="pro-mode-btn" onclick="window._proToggleAddForm()">+ Слово</button>
              <button class="pro-mode-btn" onclick="window._proToggleDeckManager()">+ Сборник</button>
              <button class="pro-mode-btn" onclick="window._proShuffle()">Перемешать</button>
            </div>
          </div>

          <!-- Полоса дневной цели и серии -->
          <div id="dailyGoalStrip" class="daily-goal-strip"></div>

          <!-- Панель создания сборников и массовой загрузки списком -->
          <div id="deckManagerPanel" class="deck-manager-panel">
            <div style="font-size:0.8rem; color:var(--accent-gold-bright); margin-bottom:9px; font-weight:700;">📁 Создать свой сборник или загрузить слова списком (работает в словаре, тренажёре и раннере):</div>
            <div class="deck-create-row">
              <input type="text" id="newDeckNameInput" class="pro-search-input" placeholder="Название нового сборника (напр. Фразовые глаголы, Песни...)">
              <select id="bulkTargetDeckSelect" class="pro-select"></select>
            </div>
            <textarea id="newDeckBulkInput" class="deck-bulk-textarea" placeholder="Необязательно: вставь сразу список слов (по одному на строку), например:&#10;give up - сдаваться&#10;figure out - разобраться&#10;run into - случайно встретить&#10;(Если написать только английское слово — перевод подставится автоматически)"></textarea>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
              <span id="deckManagerStatus" style="font-size:0.78rem; color:var(--text-muted);"></span>
              <div style="display:flex; gap:7px;">
                <button class="pro-mode-btn" onclick="window._proToggleDeckManager()">Свернуть</button>
                <button id="deckCreateSubmitBtn" class="pro-mode-btn active" onclick="window._proCreateOrImportDeck()">Сохранить сборник</button>
              </div>
            </div>
          </div>

          <!-- Панель быстрого добавления своего слова -->
          <div id="customAddPanel" class="custom-add-panel">
            <div style="font-size:0.78rem; color:var(--accent-gold-bright); margin-bottom:8px; font-weight:700;">Добавить одно слово в «Мои слова» или любой свой сборник:</div>
            <div class="custom-add-grid-4">
              <select id="customTargetDeckSelect" class="pro-select"></select>
              <input type="text" id="customEnInput" class="pro-search-input" placeholder="English word or phrase...">
              <input type="text" id="customRuInput" class="pro-search-input" placeholder="Перевод на русский...">
              <div style="display:flex; gap:6px;">
                <button id="customAutoTransBtn" class="pro-mode-btn" onclick="window._proAutoTranslateCustom()">Перевести</button>
                <button class="pro-mode-btn active" onclick="window._proSaveCustomWord()">Сохранить</button>
              </div>
            </div>
          </div>

          <!-- Общий прогресс базы -->
          <div class="pro-dict-progress-box">
            <div style="font-size:0.82rem;">
              ⭐ Освоено на 100%: <b id="proLearnedStat" style="color:#6be38c">0 / 500</b>
              <span style="margin-left:12px; color:#d4af37;" id="proDueStat"></span>
            </div>
            <div class="pro-prog-bar-bg">
              <div id="proDictProgFill" class="pro-prog-bar-fill"></div>
            </div>
          </div>

          <!-- Панель поиска и фильтров сетки -->
          <div id="proGridControlsWrap">
            <div class="pro-dict-controls">
              <input type="text" id="proSearchInput" class="pro-search-input" placeholder="🔍 Поиск по-английски, по-русски или по цитате...">
              <select id="proStatusSelect" class="pro-select">
                <option value="ALL">📌 Все статусы</option>
                <option value="UNLEARNED">⏳ Ещё не выучены (&lt;100%)</option>
                <option value="IN_PROGRESS">🔥 В процессе (25–75%)</option>
                <option value="STARRED">⭐ Освоены на 100%</option>
              </select>
            </div>
            <div class="pro-series-pills" id="proSeriesPills"></div>
            <div id="activeDeckBar" class="active-deck-bar"></div>
          </div>

          <!-- 4-ступенчатый Интенсив-тренажёр -->
          <div id="proTrainerArea" class="wt-wrap"></div>

          <!-- Сетка карточек -->
          <div id="proCardsGrid" class="pro-cards-grid"></div>
          <div id="proLoadMoreWrap" class="pro-load-more-wrap"></div>
        </div>
      `;

      rebuildAllWords();
      renderDailyStrip();

      document.getElementById('proSearchInput').addEventListener('input', e => {
        searchQuery = e.target.value.trim();
        applyFilters();
      });
      document.getElementById('proStatusSelect').addEventListener('change', e => {
        activeStatus = e.target.value;
        applyFilters();
      });
      applyFilters();
    }

    mount500Dictionary();
  })();

  // ==================== ОСНОВНАЯ ЛОГИКА: ВКЛАДКИ, ТЕСТЫ, ТЕМЫ, ЗИМА, ДОСЬЕ ====================
  (function() {
    const D = window.ESH_DATA || {};
    const quizData = D.quizData || [];
    const lessonsData = D.lessonsData || {};
    const nyQuotes = D.nyQuotes || [];
    const UNIVERSE_FILES = D.UNIVERSE_FILES || {};
    const goalsList = D.goalsList || [];

    let currentQuizCategory = 'all';
    let quizAnswers = JSON.parse(localStorage.getItem('esh_quiz') || '{}');
    let completedGoals = JSON.parse(localStorage.getItem('esh_goals') || '[]');
    let savedTheme = localStorage.getItem('esh_theme') || 'dark';
    if (savedTheme !== 'dark' && savedTheme !== 'emerald') savedTheme = 'dark';
    let winterEnabled = localStorage.getItem('esh_winter') !== 'off';
    let currentQuoteIdx = 0;

    window.switchTab = function(tabId, btn) {
      document.querySelectorAll('nav.main-nav button.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const tab = document.getElementById(tabId);
      if (tab) tab.classList.add('active');
      if (btn) {
        btn.classList.add('active');
      } else {
        const match = document.querySelector(`nav.main-nav button.nav-tab[data-tab="${tabId}"]`);
        if (match) match.classList.add('active');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.openShowDict = function(seriesFullName) {
      window.closeUniverseDossier();
      window.switchTab('dict');
      if (typeof window.filterDictBySeries === 'function') {
        window.filterDictBySeries(seriesFullName);
      }
    };

    // --- Тесты ---
    window.setQuizCategory = function(cat, btn) {
      currentQuizCategory = cat;
      document.querySelectorAll('#tests .filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderQuiz();
    };

    function renderQuiz() {
      const container = document.getElementById('quizContainer');
      if (!container) return;
      container.innerHTML = '';
      const list = quizData.filter(q => currentQuizCategory === 'all' || q.cat.trim() === currentQuizCategory);
      list.forEach((q, idx) => {
        const answered = quizAnswers[q.id];
        const box = document.createElement('div');
        box.className = 'quiz-question-box';
        let optionsHtml = '';
        q.options.forEach((opt, optIndex) => {
          let cls = 'quiz-option';
          let disabled = '';
          if (answered !== undefined) {
            disabled = 'disabled';
            if (optIndex === q.correct) cls += ' correct';
            else if (optIndex === answered) cls += ' wrong';
          }
          optionsHtml += `<button class="${cls}" ${disabled} onclick="answerQuiz(${q.id}, ${optIndex})">${opt}</button>`;
        });
        box.innerHTML = `
          <div class="quiz-q-title">${idx + 1}. ${q.q}</div>
          ${optionsHtml}
          <div class="quiz-explanation" style="display: ${answered !== undefined ? 'block' : 'none'}">
            <b>Разбор:</b> ${q.exp}
          </div>
        `;
        container.appendChild(box);
      });
      updateQuizProgress();
    }

    window.answerQuiz = function(qId, selectedIdx) {
      quizAnswers[qId] = selectedIdx;
      localStorage.setItem('esh_quiz', JSON.stringify(quizAnswers));
      renderQuiz();
      window.syncAllCounters();
    };

    function updateQuizProgress() {
      let correctCount = 0;
      quizData.forEach(q => { if (quizAnswers[q.id] === q.correct) correctCount++; });
      const badge = document.getElementById('quizScoreBadge');
      const bar = document.getElementById('quizProgressBar');
      if (badge) badge.textContent = `Счет: ${correctCount} / ${quizData.length}`;
      if (bar) bar.style.width = `${Math.round((Object.keys(quizAnswers).length / Math.max(1, quizData.length)) * 100)}%`;
    }

    window.resetQuiz = function() {
      quizAnswers = {};
      localStorage.setItem('esh_quiz', JSON.stringify(quizAnswers));
      renderQuiz();
      window.syncAllCounters();
    };

    // --- Чек-лист, темы и зимний режим ---
    function renderChecklist() {
      const container = document.getElementById('checklistContainer');
      if (!container) return;
      container.innerHTML = '';
      goalsList.forEach(g => {
        const checked = completedGoals.includes(g.id);
        const label = document.createElement('label');
        label.className = 'checklist-item';
        label.innerHTML = `
          <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleGoal('${g.id}')">
          <span>${g.text}</span>
        `;
        container.appendChild(label);
      });
    }

    window.toggleGoal = function(goalId) {
      if (completedGoals.includes(goalId)) completedGoals = completedGoals.filter(g => g !== goalId);
      else completedGoals.push(goalId);
      localStorage.setItem('esh_goals', JSON.stringify(completedGoals));
      window.syncAllCounters();
    };

    window.setTheme = function(mode) {
      const isEmerald = (mode === 'emerald');
      document.body.classList.toggle('theme-emerald', isEmerald);
      document.body.classList.remove('theme-parchment');
      localStorage.setItem('esh_theme', isEmerald ? 'emerald' : 'dark');
      const darkBtn = document.getElementById('themeDarkBtn');
      const emBtn = document.getElementById('themeEmeraldBtn');
      if (darkBtn) darkBtn.className = isEmerald ? 'action-btn secondary' : 'action-btn';
      if (emBtn) emBtn.className = isEmerald ? 'action-btn' : 'action-btn secondary';
    };

    function applyWinterState() {
      document.body.classList.toggle('winter-off', !winterEnabled);
      const btn = document.getElementById('winterToggleBtn');
      if (btn) btn.textContent = winterEnabled ? 'Зимний режим: ВКЛ' : 'Зимний режим: ВЫКЛ';
    }

    window.toggleWinterMode = function() {
      winterEnabled = !winterEnabled;
      localStorage.setItem('esh_winter', winterEnabled ? 'on' : 'off');
      applyWinterState();
    };

    window.clearAllProgress = function() {
      if (confirm('Точно сбросить весь сохраненный прогресс?')) {
        quizAnswers = {};
        completedGoals = [];
        localStorage.removeItem('esh_quiz');
        localStorage.removeItem('esh_goals');
        if (typeof window.resetMasterDictState === 'function') window.resetMasterDictState();
        renderQuiz();
        renderChecklist();
        window.syncAllCounters();
      }
    };

    // --- Таймер и цитаты ---
    function renderNyQuote() {
      const box = document.getElementById('nyQuoteBox');
      if (!box || nyQuotes.length === 0) return;
      const item = nyQuotes[currentQuoteIdx];
      box.innerHTML = `<b>"${item.en}"</b><br><span style="font-size:0.82rem; color:#c2b29f; font-style:normal; display:block; margin-top:6px;">${item.ru} (Нажми, чтобы прослушать)</span>`;
      box.onclick = () => window.speakText(nyQuotes[currentQuoteIdx].en);
    }

    window.nextNyQuote = function() {
      const box = document.getElementById('nyQuoteBox');
      if (!box || nyQuotes.length === 0) return;
      currentQuoteIdx = (currentQuoteIdx + 1) % nyQuotes.length;
      box.style.opacity = '0';
      setTimeout(() => {
        renderNyQuote();
        box.style.opacity = '1';
      }, 160);
    };

    function updateCountdown() {
      const now = new Date();
      const newYearDate = new Date(`January 1, ${now.getFullYear() + 1} 00:00:00`);
      const diff = newYearDate - now;
      if (diff > 0) {
        const dEl = document.getElementById('cd-days');
        if (!dEl) return;
        dEl.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
        document.getElementById('cd-hours').textContent = String(Math.floor((diff / 3600000) % 24)).padStart(2, '0');
        document.getElementById('cd-mins').textContent = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
        document.getElementById('cd-secs').textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      }
    }

    // --- Досье 5 вселенных (с интегрированным разбором цитат и грамматики) + Единый HUD ---
    const AGENT_SAVE_KEY = 'english_hub_detective_v3';
    let agentState = { solved: [], clues: [], srs: {} };

    function loadAgentState() {
      try {
        const raw = localStorage.getItem(AGENT_SAVE_KEY) || localStorage.getItem('english_hub_detective_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.solved)) agentState.solved = parsed.solved;
          if (Array.isArray(parsed.clues)) agentState.clues = parsed.clues;
          if (parsed.srs && typeof parsed.srs === 'object') agentState.srs = parsed.srs;
        }
      } catch (e) {}
      window.syncAllCounters();
    }

    function saveAgentState() {
      try { localStorage.setItem(AGENT_SAVE_KEY, JSON.stringify(agentState)); } catch (e) {}
      window.syncAllCounters();
    }

    window.syncAllCounters = function() {
      const dictLearned = typeof window.getDictLearnedCount === 'function' ? window.getDictLearnedCount() : 0;
      const totalWords = typeof window.getDictTotalCount === 'function' ? window.getDictTotalCount() : (window.MASTER_500_WORDS || []).length;
      const casesSolved = typeof window.getCasesSolvedCount === 'function' ? window.getCasesSolvedCount() : 0;

      const sw = document.getElementById('statWords');
      if (sw) sw.textContent = `${dictLearned} / ${totalWords}`;
      const drL = document.getElementById('eshDrawerLearned');
      if (drL) drL.textContent = `${dictLearned} / ${totalWords}`;
      const drD = document.getElementById('eshDrawerDecksCount');
      if (drD && typeof window.getCustomDecksCount === 'function') drD.textContent = window.getCustomDecksCount();

      let correctCount = 0;
      quizData.forEach(q => { if (quizAnswers[q.id] === q.correct) correctCount++; });
      const st = document.getElementById('statTests');
      if (st) st.textContent = `${correctCount} / ${quizData.length}`;

      const sg = document.getElementById('statGoals');
      if (sg) sg.textContent = `${completedGoals.length} / ${goalsList.length}`;

      const xp = (agentState.solved.length * 50) + (agentState.clues.length * 15) + (casesSolved * 40) + (dictLearned * 5);
      const pct = Math.min(100, Math.round((xp / 900) * 100));
      let rank = "ROOKIE CADET";
      if (xp >= 120) rank = "FIELD DETECTIVE";
      if (xp >= 300) rank = "SPECIAL AGENT";
      if (xp >= 550) rank = "CHIEF INVESTIGATOR";
      if (xp >= 800) rank = "MASTERMIND ARCHIVIST";

      const rankEl = document.getElementById('agentRankTitle');
      const statsEl = document.getElementById('agentStatsText');
      const barEl = document.getElementById('agentXpBar');
      if (rankEl) rankEl.textContent = `ДОПУСК: ${rank} (${xp} XP)`;
      if (statsEl) statsEl.textContent = `Досье: ${agentState.solved.length}/5 · Архив дел: ${casesSolved}/10 · Словарь: ${dictLearned}/${totalWords}`;
      if (barEl) barEl.style.width = pct + '%';

      ['tvd', 'dh', 'spn', 'penthouse', 'ouat'].forEach(k => {
        const card = document.getElementById('card-' + k);
        if (card) card.classList.toggle('solved', agentState.solved.includes(k));
      });

      const locker = document.getElementById('lockerChipsContainer');
      if (locker) {
        const allEv = Object.values(UNIVERSE_FILES).flatMap(u => u.evidence);
        const collectedObjs = allEv.filter(e => agentState.clues.includes(e.id));
        if (collectedObjs.length === 0) {
          locker.innerHTML = `<span style="font-family:'Courier Prime',monospace; font-size:0.76rem; color:var(--text-muted);">Пока пусто. Открой любое из 5 досье выше и нажми на выражения-улики.</span>`;
        } else {
          locker.innerHTML = collectedObjs.map(e => `
            <span class="locker-chip" onclick="window.speakText('${e.phrase.replace(/'/g, "\\'")}')">
              <b>${e.phrase}</b> — ${e.meaning}
            </span>
          `).join('');
        }
      }
    };

    window.exportSaveCode = function() {
      try {
        const fullBackup = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          fullBackup[k] = localStorage.getItem(k);
        }
        const code = btoa(unescape(encodeURIComponent(JSON.stringify(fullBackup))));
        prompt("Скопируй код сохранения (переносит словарь, тренажёр, досье, дела, тесты и рекорды):", code);
      } catch (e) {
        alert("Не удалось сформировать код сохранения.");
      }
    };

    window.importSaveCode = function() {
      const code = prompt("Вставь сюда код сохранения:");
      if (!code || !code.trim()) return;
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        if (decoded && typeof decoded === 'object') {
          if (Array.isArray(decoded.solved)) {
            agentState = { solved: decoded.solved || [], clues: decoded.clues || [], srs: decoded.srs || {} };
            saveAgentState();
          } else {
            Object.keys(decoded).forEach(k => {
              if (typeof decoded[k] === 'string') localStorage.setItem(k, decoded[k]);
            });
          }
          alert("Прогресс восстановлен. Страница обновится.");
          location.reload();
        }
      } catch (e) {
        alert("Неверный код сохранения.");
      }
    };

    window.collectClue = function(id, phrase) {
      window.speakText(phrase);
      if (!agentState.clues.includes(id)) {
        agentState.clues.push(id);
        saveAgentState();
        const cardEl = document.getElementById('ev-card-' + id);
        if (cardEl) cardEl.classList.add('collected');
      }
    };

    window.openUniverseDossier = function(key) {
      const data = UNIVERSE_FILES[key];
      if (!data) return;
      const evidenceHtml = data.evidence.map(ev => {
        const isCollected = agentState.clues.includes(ev.id) ? 'collected' : '';
        return `
          <div id="ev-card-${ev.id}" class="uv-evidence-card ${isCollected}" onclick="collectClue('${ev.id}', '${ev.phrase.replace(/'/g, "\\'")}')">
            <div class="uv-ev-object">${ev.obj}</div>
            <div class="uv-ev-phrase">${ev.phrase}</div>
            <div class="uv-ev-meaning">${ev.meaning}</div>
          </div>`;
      }).join('');

      // Интегрированный разбор культовых цитат, грамматики и сленга (перенесено из вкладки «Сериалы»)
      const showLessons = (data.lessonKey && lessonsData[data.lessonKey]) ? lessonsData[data.lessonKey] : [];
      const lessonsHtml = showLessons.length > 0 ? `
        <div class="uv-section-label">Разбор сцен: грамматика и живой сленг</div>
        ${showLessons.map(item => {
          const sq = item.quote.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          return `
            <div class="lesson-card">
              <div class="quote-box">"${item.quote}"</div>
              <div class="quote-ru">${item.ru}</div>
              <button class="icon-btn" onclick="window.speakText('${sq}')">Прослушать цитату</button>
              <div class="analysis-block">
                <div class="analysis-title">Грамматика</div>
                <p>${item.grammar}</p>
              </div>
              <div class="analysis-block">
                <div class="analysis-title">Контекст и сленг</div>
                <p>${item.slang}</p>
              </div>
            </div>`;
        }).join('')}
      ` : '';

      const optsHtml = data.options.map(opt => `<button class="uv-opt-btn" onclick="checkUniverseCipher('${key}', '${opt}')">${opt}</button>`).join('');
      const isSolved = agentState.solved.includes(key);
      const safeQuote = data.quoteEn.replace(/"/g, '').replace(/'/g, "\\'");
      const safeSeries = (data.seriesName || data.title).replace(/'/g, "\\'");

      document.getElementById('uvDossierContent').innerHTML = `
        <button class="uv-close-btn" onclick="closeUniverseDossier()">ЗАКРЫТЬ ДОСЬЕ И ВЕРНУТЬСЯ</button>
        <div class="uv-top-grid">
          <div class="uv-mini-polaroid"><img src="${data.img}" alt="${data.title}"></div>
          <div>
            <div class="uv-stamp">${data.code}</div>
            <h2 class="uv-title">${data.title}</h2>
            <div class="uv-atmo">${data.atmo}</div>
            <div class="uv-quote-box">
              <div class="uv-quote-en">${data.quoteEn}</div>
              <div class="uv-quote-ru">${data.quoteRu}</div>
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                <button class="icon-btn" onclick="window.speakText('${safeQuote}')">Прослушать реплику</button>
                <button class="hud-btn" onclick="openShowDict('${safeSeries}')">Словарь сериала (100) →</button>
              </div>
            </div>
          </div>
        </div>
        <div class="uv-section-label">Ключевые выражения досье (нажми для озвучки и сохранения):</div>
        <div class="uv-evidence-grid">${evidenceHtml}</div>
        ${lessonsHtml}
        <div class="uv-cipher-box">
          <div class="uv-stamp" style="margin-bottom:8px;">ПРОВЕРКА ПО ДОСЬЕ (+50 XP)</div>
          <div class="uv-cipher-q">${data.cipherQ}</div>
          <div class="uv-cipher-opts">${optsHtml}</div>
          <div id="uvCipherFeedback" class="uv-cipher-feedback" style="color:${isSolved ? 'var(--success)' : 'var(--text-main)'}">${isSolved ? data.explain : ''}</div>
        </div>
      `;
      document.getElementById('uvModalOverlay').classList.add('active');
    };

    window.checkUniverseCipher = function(key, chosen) {
      const data = UNIVERSE_FILES[key];
      const fb = document.getElementById('uvCipherFeedback');
      if (!fb) return;
      if (chosen === data.answer) {
        fb.style.color = "var(--success)";
        fb.textContent = data.explain;
        window.speakText(data.answer);
        if (!agentState.solved.includes(key)) {
          agentState.solved.push(key);
          saveAgentState();
        }
      } else {
        fb.style.color = "var(--danger)";
        fb.textContent = "Неверный вариант. Попробуй другую улику.";
      }
    };

    window.closeUniverseDossier = function() {
      const ov = document.getElementById('uvModalOverlay');
      if (ov) ov.classList.remove('active');
      if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
    };

    // Проработанный зимний снегопад (резные снежинки + золотые зимние звёзды) + гирлянда под навигацией
    (function() {
      const fairyStrip = document.getElementById('winterFairyStrip');
      if (fairyStrip) {
        const bulbCount = window.innerWidth < 600 ? 14 : 26;
        for (let b = 0; b < bulbCount; b++) {
          const bulb = document.createElement('span');
          bulb.className = 'winter-bulb';
          bulb.style.animationDelay = ((b * 0.27) % 3.2).toFixed(2) + 's';
          fairyStrip.appendChild(bulb);
        }
      }

      const snowBox = document.getElementById('vhSnow');
      if (!snowBox) return;
      const snowGlyphs = ['❄', '❅', '❆', '❄', '❅'];
      const goldGlyphs = ['✦', '✧', '✶'];
      const totalFlakes = window.innerWidth < 600 ? 24 : 36;
      for (let i = 0; i < totalFlakes; i++) {
        const flake = document.createElement('div');
        const isGold = i % 5 === 0;
        const isFar = i % 3 === 0;
        flake.className = 'vh-flake' + (isGold ? ' gold' : '') + (isFar ? ' soft' : '');
        flake.textContent = isGold
          ? goldGlyphs[i % goldGlyphs.length]
          : snowGlyphs[i % snowGlyphs.length];
        flake.style.left = (Math.random() * 98) + 'vw';
        const fontSize = isGold
          ? (Math.random() * 6 + 9)
          : (isFar ? (Math.random() * 6 + 9) : (Math.random() * 9 + 13));
        flake.style.fontSize = fontSize.toFixed(1) + 'px';
        flake.style.opacity = (isFar ? (Math.random() * 0.3 + 0.22) : (Math.random() * 0.35 + 0.42)).toFixed(2);
        flake.style.animationDuration = (isFar ? (Math.random() * 10 + 16) : (Math.random() * 9 + 10)).toFixed(1) + 's';
        flake.style.animationDelay = (-Math.random() * 16).toFixed(1) + 's';
        snowBox.appendChild(flake);
      }
    })();

    // Старт приложения
    window.setTheme(savedTheme);
    applyWinterState();
    renderQuiz();
    renderChecklist();
    renderNyQuote();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    loadAgentState();
  })();


  (function() {
    var SAVE_KEY = 'esh_cases_save';
    var SHOWS = {
      ouat: 'Once Upon a Time',
      tvd: 'The Vampire Diaries',
      dh: 'Desperate Housewives',
      spn: 'Supernatural',
      ph: 'The Penthouse'
    };
    var RANKS = [
      {xp:0, name:'Стажёр архива'},
      {xp:200, name:'Младший детектив'},
      {xp:400, name:'Детектив'},
      {xp:600, name:'Старший инспектор'},
      {xp:800, name:'Мастер-сыщик'},
      {xp:1000, name:'Легенда архива'}
    ];
  var CASES = (window.ESH_DATA && window.ESH_DATA.CASES) || [];

    var state = {solved:{}};
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) { var p = JSON.parse(raw); if (p && p.solved) state = p; }
    } catch(e) {}
    var filter = 'all';
    var cur = null, step = 0, busy = false;

    function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {} }
    function solvedCount() { return Object.keys(state.solved).length; }
    function xp() { return solvedCount() * 100; }
    function rank() {
      var r = RANKS[0];
      for (var i = 0; i < RANKS.length; i++) { if (xp() >= RANKS[i].xp) r = RANKS[i]; }
      return r;
    }
    function nextRank() {
      for (var i = 0; i < RANKS.length; i++) { if (RANKS[i].xp > xp()) return RANKS[i]; }
      return null;
    }
    function $(id) { return document.getElementById(id); }
    window.getCasesSolvedCount = solvedCount;
    function updateCounter() { $('dcfCounter').textContent = solvedCount() + '/10'; if (typeof window.syncAllCounters === 'function') window.syncAllCounters(); }

    function renderGrid() {
      cur = null;
      var nr = nextRank();
      var pct = nr ? Math.min(100, Math.round((xp() - rank().xp) / (nr.xp - rank().xp) * 100)) : 100;
      var h = '<div class="dcf-head"><h2>АРХИВ ДЕЛ</h2>'
        + '<div class="dcf-rank">Звание: <b>' + rank().name + '</b> &nbsp;|&nbsp; XP: <b>' + xp() + '</b> / 1000'
        + (nr ? ' &nbsp;|&nbsp; до звания «' + nr.name + '»: ' + (nr.xp - xp()) + ' XP' : ' &nbsp;|&nbsp; максимальное звание!')
        + '</div><div class="dcf-bar"><i style="width:' + pct + '%"></i></div></div>';
      h += '<div class="dcf-filters">';
      h += '<button class="dcf-fbtn' + (filter === 'all' ? ' on' : '') + '" data-f="all">Все дела</button>';
      Object.keys(SHOWS).forEach(function(k) {
        h += '<button class="dcf-fbtn' + (filter === k ? ' on' : '') + '" data-f="' + k + '">' + SHOWS[k] + '</button>';
      });
      h += '</div><div class="dcf-grid">';
      CASES.forEach(function(c) {
        if (filter !== 'all' && c.show !== filter) return;
        var d = !!state.solved[c.id];
        h += '<div class="dcf-folder' + (d ? ' done' : '') + '" data-id="' + c.id + '">'
          + '<div class="n">ДЕЛО №' + ('0' + c.id).slice(-2) + '</div>'
          + '<div class="t">' + c.title + '</div>'
          + '<div class="s">' + SHOWS[c.show] + '</div>'
          + '<div class="st">' + (d ? 'Раскрыто' : 'Не раскрыто') + '</div></div>';
      });
      h += '</div>';
      $('dcfView').innerHTML = h;
      document.querySelectorAll('#dcfView .dcf-fbtn').forEach(function(b) {
        b.onclick = function() { filter = b.getAttribute('data-f'); renderGrid(); };
      });
      document.querySelectorAll('#dcfView .dcf-folder').forEach(function(f) {
        f.onclick = function() { openCase(parseInt(f.getAttribute('data-id'), 10)); };
      });
    }

    function openCase(id) {
      cur = CASES.filter(function(c) { return c.id === id; })[0];
      step = 0; busy = false;
      renderStep();
    }

    function stepsBar() {
      var names = ['1. Письмо', '2. Допрос', '3. Вердикт'];
      return '<div class="dcf-steps">' + names.map(function(n, i) {
        return '<span class="' + (i < step ? 'ok' : (i === step ? 'on' : '')) + '">' + n + '</span>';
      }).join('') + '</div>';
    }

    function renderStep() {
      if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
      var c = cur;
      var h = '<button class="dcf-back" id="dcfBack">← Назад к картотеке</button><div class="dcf-sheet">'
        + '<div class="dcf-stamp" id="dcfStamp">CASE SOLVED</div>'
        + '<h3>ДЕЛО №' + ('0' + c.id).slice(-2) + ': ' + c.title + '</h3>'
        + '<div class="dcf-meta">' + SHOWS[c.show] + (state.solved[c.id] ? ' · ✅ уже раскрыто' : '') + '</div>'
        + '<div class="dcf-brief">' + c.brief + '</div>' + stepsBar();
      var opts;
      if (step === 0) {
        h += '<div class="dcf-lbl">УЛИКА 1 — ПИСЬМЕННАЯ. Выберите слово для пропуска:</div>'
          + '<div class="dcf-text">' + c.clue.text.replace('___', '<u>&nbsp;&nbsp;_______&nbsp;&nbsp;</u>') + '</div>';
        opts = c.clue.opts;
      } else if (step === 1) {
        h += '<div class="dcf-lbl">УЛИКА 2 — АУДИО-ДОПРОС СВИДЕТЕЛЯ</div>'
          + '<button class="dcf-play" id="dcfPlay">▶ Прослушать показания</button>'
          + '<div class="dcf-q">' + c.audio.q + '</div>';
        opts = c.audio.opts;
      } else {
        h += '<div class="dcf-lbl">УЛИКА 3 — ФИНАЛЬНЫЙ ВЕРДИКТ</div>'
          + '<div class="dcf-q">' + c.verdict.q + '</div>';
        opts = c.verdict.opts;
      }
      h += '<div class="dcf-opts">' + opts.map(function(o, i) {
        return '<button class="dcf-opt" data-i="' + i + '">' + o + '</button>';
      }).join('') + '</div><div class="dcf-fb" id="dcfFb"></div></div>';
      $('dcfView').innerHTML = h;
      $('dcfBack').onclick = renderGrid;
      if ($('dcfPlay')) $('dcfPlay').onclick = function() { window.speakText(c.audio.text); };
      document.querySelectorAll('#dcfView .dcf-opt').forEach(function(b) {
        b.onclick = function() { answer(b, parseInt(b.getAttribute('data-i'), 10)); };
      });
    }

    function answer(btn, i) {
      if (busy) return;
      var c = cur;
      var correct = step === 0 ? c.clue.ans : (step === 1 ? c.audio.ans : c.verdict.ans);
      var fb = $('dcfFb');
      if (i === correct) {
        busy = true;
        btn.classList.add('right');
        document.querySelectorAll('#dcfView .dcf-opt').forEach(function(b) { b.disabled = true; });
        fb.style.color = '#3f6b2a';
        fb.textContent = '✔ Улика принята!';
        setTimeout(function() {
          step++; busy = false;
          if (step >= 3) win(); else renderStep();
        }, 850);
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        fb.style.color = '#8c1c13';
        fb.textContent = '✘ Это ложный след. Подумайте ещё раз.';
      }
    }

    function win() {
      var c = cur;
      var first = !state.solved[c.id];
      var before = rank().name;
      if (first) { state.solved[c.id] = true; save(); updateCounter(); }
      var after = rank().name;
      var h = '<button class="dcf-back" id="dcfBack">← Назад к картотеке</button><div class="dcf-sheet" style="min-height:280px">'
        + '<div class="dcf-stamp" id="dcfStamp">CASE SOLVED</div>'
        + '<h3>ДЕЛО №' + ('0' + c.id).slice(-2) + ': ' + c.title + '</h3>'
        + '<div class="dcf-meta">' + SHOWS[c.show] + '</div>'
        + '<div class="dcf-steps"><span class="ok">1. Письмо</span><span class="ok">2. Допрос</span><span class="ok">3. Вердикт</span></div>'
        + '<div class="dcf-result"><p style="font-size:16px">' + c.outro + '</p>'
        + '<p class="dcf-lbl">' + (first ? '+100 XP! Всего: ' + xp() + ' XP' : 'Дело уже было раскрыто ранее.') + '</p>'
        + (first && after !== before ? '<p class="dcf-lbl">🎖 Новое звание: ' + after + '!</p>' : '')
        + '<button class="dcf-play" id="dcfAgain">Следующее дело →</button></div></div>';
      $('dcfView').innerHTML = h;
      $('dcfBack').onclick = renderGrid;
      $('dcfAgain').onclick = function() {
        var next = CASES.filter(function(x) { return !state.solved[x.id]; })[0];
        if (next) openCase(next.id); else renderGrid();
      };
      setTimeout(function() { var s = $('dcfStamp'); if (s) s.classList.add('show'); }, 150);
    }

    function openModal() { $('dcfOverlay').classList.add('dcf-open'); renderGrid(); }
    function closeModal() {
      $('dcfOverlay').classList.remove('dcf-open');
      if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
    }
    $('dcfWidget').onclick = openModal;
    $('dcfWidget').onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); } };
    $('dcfClose').onclick = closeModal;
    $('dcfOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && $('dcfOverlay').classList.contains('dcf-open')) closeModal();
    });
    updateCounter();
  })();

  (function() {
  const FAST_DICT = (window.ESH_DATA && window.ESH_DATA.FAST_DICT) || {};

  const NOVELS = (window.ESH_DATA && window.ESH_DATA.NOVELS) || {};

    let activeNovelKey = 'tvd_s4';
    let activeChapterIdx = 0;
    let globalTranslatorEnabled = true;
    let currentSelectedWord = '';
    let currentSelectedTrans = '';

    // Быстрый локальный индекс по всем 500 словам + FAST_DICT
    const LOCAL_LOOKUP = Object.assign({}, FAST_DICT);
    (window.MASTER_500_WORDS || []).forEach(w => {
      const cleanKey = w.en.toLowerCase().trim();
      if (!LOCAL_LOOKUP[cleanKey]) LOCAL_LOOKUP[cleanKey] = w.ru;
    });

    function wrapEnglishWords(htmlText) {
      return htmlText.replace(/([A-Za-z’'-]{2,})/g, function(match) {
        return `<span class="vn-word" data-word="${match.replace(/['’]/g, '')}">${match}</span>`;
      });
    }

    function renderNovel() {
      const novel = NOVELS[activeNovelKey];
      if (!novel) return;
      document.getElementById('eshVnSeriesBadge').textContent = novel.badge;
      document.getElementById('eshVnTabs').innerHTML = novel.chapters.map((ch, idx) => `
        <button class="esh-vn-tab ${idx === activeChapterIdx ? 'active' : ''}" onclick="window.ESHHub.selectChapter(${idx})">
          ${ch.tabTitle}
        </button>
      `).join('');

      const ch = novel.chapters[activeChapterIdx];
      const paragraphsHtml = ch.paragraphs.map(p => `<p class="esh-vn-paragraph">${wrapEnglishWords(p)}</p>`).join('');
      const dialoguesHtml = ch.dialogues.map(d => `
        <div class="esh-vn-dialogue">
          <div class="esh-vn-speaker">${d.speaker}</div>
          <div>${wrapEnglishWords(d.text)}</div>
        </div>
      `).join('');
      const choicesHtml = ch.choices.map((c, cIdx) => `
        <button class="esh-vn-choice-btn" onclick="window.ESHHub.answerChoice(${cIdx})">${c.text}</button>
      `).join('');
      const nextChapBtn = (activeChapterIdx < novel.chapters.length - 1)
        ? `<button id="eshNextChapBtn" onclick="window.ESHHub.selectChapter(${activeChapterIdx + 1})" style="display:none; margin-top:14px; width:100%; background:#7f1d1d; border:1.5px solid #d4af37; color:#fde047; padding:13px; border-radius:10px; font-weight:700; cursor:pointer; font-size:15px;">Перейти к следующей главе →</button>`
        : '';

      document.getElementById('eshVnContent').innerHTML = `
        <div class="esh-vn-visual" style="background: ${ch.bgStyle};">
          <div class="esh-vn-visual-caption">
            <div style="font-weight:700; font-size:14px; margin-bottom:3px;">${ch.sceneTitle}</div>
            <div style="color:#d1d5db;">${ch.locationTag}</div>
          </div>
        </div>
        <div class="esh-vn-story-box">
          ${paragraphsHtml}
          ${dialoguesHtml}
          <div class="esh-vn-choices">
            <div style="color:#fde047; font-weight:700; margin-bottom:12px; font-size:15px;">${ch.questionTitle}</div>
            ${choicesHtml}
            <div id="eshVnFeedback" class="esh-vn-feedback"></div>
            ${nextChapBtn}
          </div>
        </div>
      `;
    }

    const TRANS_CACHE_KEY = 'esh_trans_cache_v1';
    let transCache = {};
    try { transCache = JSON.parse(localStorage.getItem(TRANS_CACHE_KEY) || '{}') || {}; } catch (e) { transCache = {}; }
    let translateReqId = 0;

    function saveTransCache(key, val) {
      if (!key || !val) return;
      transCache[key] = val;
      try {
        const keys = Object.keys(transCache);
        if (keys.length > 400) {
          keys.slice(0, 80).forEach(k => delete transCache[k]);
        }
        localStorage.setItem(TRANS_CACHE_KEY, JSON.stringify(transCache));
      } catch (e) {}
    }

    // Умный локальный поиск (база 1000+ слов + все 500 карточек + лемматизатор окончаний)
    function lookupLocalWord(low) {
      if (LOCAL_LOOKUP[low]) return LOCAL_LOOKUP[low];
      if (transCache[low]) return transCache[low];

      const cands = [];
      if (low.endsWith('ies') && low.length > 4) cands.push(low.slice(0, -3) + 'y');
      if (low.endsWith('ves') && low.length > 4) cands.push(low.slice(0, -3) + 'f', low.slice(0, -3) + 'fe');
      if (low.endsWith('es') && low.length > 3) cands.push(low.slice(0, -2), low.slice(0, -1));
      if (low.endsWith('s') && low.length > 2) cands.push(low.slice(0, -1));
      if (low.endsWith('ied') && low.length > 4) cands.push(low.slice(0, -3) + 'y');
      if (low.endsWith('ed') && low.length > 3) {
        const st = low.slice(0, -2);
        cands.push(st, st + 'e');
        if (st.length >= 2 && st[st.length - 1] === st[st.length - 2]) cands.push(st.slice(0, -1));
      }
      if (low.endsWith('ing') && low.length > 4) {
        const st = low.slice(0, -3);
        cands.push(st, st + 'e');
        if (st.length >= 2 && st[st.length - 1] === st[st.length - 2]) cands.push(st.slice(0, -1));
      }
      if (low.endsWith('ly') && low.length > 4) {
        const st = low.slice(0, -2);
        cands.push(st, st + 'e');
        if (st.endsWith('i')) cands.push(st.slice(0, -1) + 'y');
      }
      if (low.endsWith('er') && low.length > 4) {
        const st = low.slice(0, -2);
        cands.push(st, st + 'e');
        if (st.length >= 2 && st[st.length - 1] === st[st.length - 2]) cands.push(st.slice(0, -1));
      }
      if (low.endsWith('est') && low.length > 5) {
        const st = low.slice(0, -3);
        cands.push(st, st + 'e');
        if (st.endsWith('i')) cands.push(st.slice(0, -1) + 'y');
      }
      for (const c of cands) {
        if (LOCAL_LOOKUP[c]) return LOCAL_LOOKUP[c];
        if (transCache[c]) return transCache[c];
      }
      return '';
    }

    function fetchJsonTimeout(url, ms) {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
      return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .finally(() => { if (timer) clearTimeout(timer); });
    }

    function isGoodRuTranslation(text, srcLow) {
      if (!text) return false;
      const t = String(text).trim();
      if (!t || t.length > 140) return false;
      if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID|PLEASE SELECT/i.test(t)) return false;
      if (t.toLowerCase() === srcLow && !/[А-Яа-яЁё]/.test(t)) return false;
      return /[А-Яа-яЁё]/.test(t);
    }

    function raceFirstResolved(promises) {
      return new Promise((resolve, reject) => {
        let pending = promises.length;
        if (pending === 0) return reject(new Error('empty'));
        let settled = false;
        promises.forEach(p => {
          Promise.resolve(p).then(val => {
            if (!settled && val) {
              settled = true;
              resolve(val);
            } else {
              pending--;
              if (!settled && pending === 0) reject(new Error('all failed'));
            }
          }).catch(() => {
            pending--;
            if (!settled && pending === 0) reject(new Error('all failed'));
          });
        });
      });
    }

    // Универсальный быстрый переводчик (0ms локально/кэш → параллельный запрос Google GTX + MyMemory с жёстким таймаутом 3.2с)
    async function translateWordFast(rawInput) {
      const clean = String(rawInput || '').replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '').trim();
      if (!clean) return { ok: false, text: '' };
      const low = clean.toLowerCase();

      const localHit = lookupLocalWord(low);
      if (localHit) return { ok: true, text: localHit, source: 'local' };

      if (navigator.onLine === false) return { ok: false, text: 'Нет интернета для перевода нового слова' };

      const pGoogle = fetchJsonTimeout(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(low)}`,
        3200
      ).then(data => {
        const joined = Array.isArray(data && data[0]) ? data[0].map(seg => seg && seg[0] ? seg[0] : '').join('').trim() : '';
        if (isGoodRuTranslation(joined, low)) return joined.toLowerCase();
        throw new Error('bad google');
      });

      const pMyMemory = fetchJsonTimeout(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(low)}&langpair=en|ru`,
        3200
      ).then(data => {
        const tr = data && data.responseData && data.responseData.translatedText ? String(data.responseData.translatedText).trim() : '';
        if (isGoodRuTranslation(tr, low)) return tr.toLowerCase();
        throw new Error('bad mymemory');
      });

      try {
        const winner = await raceFirstResolved([pGoogle, pMyMemory]);
        saveTransCache(low, winner);
        return { ok: true, text: winner, source: 'online' };
      } catch (e1) {
        // Резервный сервер с коротким таймаутом (2.6с), чтобы не зависать
        try {
          const d3 = await fetchJsonTimeout(
            `https://lingva.thedaviddelta.com/api/v1/en/ru/${encodeURIComponent(low)}`,
            2600
          );
          const tr3 = d3 && d3.translation ? String(d3.translation).trim() : '';
          if (isGoodRuTranslation(tr3, low)) {
            const out = tr3.toLowerCase();
            saveTransCache(low, out);
            return { ok: true, text: out, source: 'backup' };
          }
        } catch (e2) {}
      }

      return { ok: false, text: 'Не удалось перевести (сервер не ответил)' };
    }

    window.translateWordFast = translateWordFast;

    function updatePopupSaveState(low) {
      const saveBtn = document.getElementById('eshPopupSaveBtn');
      const openBtn = document.getElementById('eshPopupOpenSavedBtn');
      if (!saveBtn) return;
      const saved = JSON.parse(localStorage.getItem('esh_novel_words') || '[]');
      const already = saved.some(item => String(item.word).toLowerCase() === low);
      if (already) {
        saveBtn.textContent = '✓ В «Моих словах»';
        saveBtn.style.background = '#14532d';
        if (openBtn) openBtn.style.display = 'block';
      } else {
        saveBtn.textContent = '+ В «Мои слова»';
        saveBtn.style.background = '#065f46';
        if (openBtn) openBtn.style.display = 'none';
      }
    }

    async function translateAndShowPopup(rawWord) {
      const clean = String(rawWord || '').replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '').trim();
      if (!clean || clean.length < 2 || !/^[A-Za-z'-]{2,28}$/.test(clean)) return;

      const low = clean.toLowerCase();
      currentSelectedWord = low;
      currentSelectedTrans = '';
      const myReq = ++translateReqId;

      const popup = document.getElementById('eshWordPopup');
      const wordEl = document.getElementById('eshPopupWord');
      const transEl = document.getElementById('eshPopupTrans');
      const retryBtn = document.getElementById('eshPopupRetryBtn');

      wordEl.textContent = low;
      if (retryBtn) retryBtn.style.display = 'none';
      updatePopupSaveState(low);
      popup.classList.add('show');
      window.speakText(low);

      // Мгновенная проверка локально (0мс — даже без мигания "Переводим...")
      const instant = lookupLocalWord(low);
      if (instant) {
        currentSelectedTrans = instant;
        transEl.textContent = instant;
        return;
      }

      transEl.textContent = 'Переводим...';
      const res = await translateWordFast(low);
      if (myReq !== translateReqId) return; // пользователь уже тапнул другое слово

      if (res.ok) {
        currentSelectedTrans = res.text;
        transEl.textContent = res.text;
        if (retryBtn) retryBtn.style.display = 'none';
      } else {
        currentSelectedTrans = '';
        transEl.textContent = res.text;
        if (retryBtn) retryBtn.style.display = 'block';
      }
    }

    // Точное определение слова под пальцем или курсором (ПК + Телефоны)
    function getWordAtPoint(x, y) {
      let node = null, offset = 0;
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(x, y);
        if (range) { node = range.startContainer; offset = range.startOffset; }
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (pos) { node = pos.offsetNode; offset = pos.offset; }
      }
      if (!node || node.nodeType !== Node.TEXT_NODE) return '';

      const text = node.textContent || '';
      let start = offset, end = offset;
      while (start > 0 && /[A-Za-z’'-]/.test(text[start - 1])) start--;
      while (end < text.length && /[A-Za-z’'-]/.test(text[end])) end++;

      const rawWord = text.slice(start, end).replace(/^['’-]+|['’-]+$/g, '');
      if (!/^[A-Za-z]{2,25}$/.test(rawWord)) return '';

      try {
        const wordRange = document.createRange();
        wordRange.setStart(node, start);
        wordRange.setEnd(node, end);
        const rect = wordRange.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return '';
        if (x < rect.left - 6 || x > rect.right + 6 || y < rect.top - 6 || y > rect.bottom + 6) {
          return '';
        }
      } catch (e) {
        return '';
      }
      return rawWord;
    }

    const INTERACTIVE_SKIP = 'button, a, input, select, textarea, label, nav, #eshWordPopup, #eshDrawer, #eshBurgerBtn, #eshVnModal, #cpModal, #cpLauncherBtn, #proTrainerArea, #customAddPanel, #deckManagerPanel, #activeDeckBar, .dcf-widget, .dcf-overlay, .uv-modal-overlay, .universe-card, .noir-polaroid-item, .locker-chip, .pro-card-en, .ny-quote, .quiz-option';

    let lastTouchTriggerAt = 0;
    let touchStartInfo = null;

    document.addEventListener('touchstart', function(e) {
      if (e.touches && e.touches.length === 1) {
        touchStartInfo = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          t: Date.now()
        };
      } else {
        touchStartInfo = null;
      }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
      if (!touchStartInfo || !e.changedTouches || !e.changedTouches[0]) return;
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartInfo.x);
      const dy = Math.abs(touch.clientY - touchStartInfo.y);
      const dt = Date.now() - touchStartInfo.t;
      touchStartInfo = null;

      // Игнорируем свайп/прокрутку и долгое удержание (его поймает selectionchange)
      if (dx > 10 || dy > 10 || dt > 360) return;

      const target = e.target;
      const wordSpan = target && target.closest ? target.closest('.vn-word') : null;
      if (wordSpan) {
        lastTouchTriggerAt = Date.now();
        document.querySelectorAll('.vn-word.active-word').forEach(el => el.classList.remove('active-word'));
        wordSpan.classList.add('active-word');
        translateAndShowPopup(wordSpan.getAttribute('data-word') || wordSpan.textContent);
        return;
      }

      if (!globalTranslatorEnabled) return;
      if (target && target.closest && target.closest(INTERACTIVE_SKIP)) return;

      const tappedWord = getWordAtPoint(touch.clientX, touch.clientY);
      if (tappedWord) {
        lastTouchTriggerAt = Date.now();
        translateAndShowPopup(tappedWord);
      }
    }, { passive: true });

    document.addEventListener('click', function(e) {
      // Не дублируем срабатывание, если только что обработали touchend
      if (Date.now() - lastTouchTriggerAt < 450) return;

      const wordSpan = e.target.closest ? e.target.closest('.vn-word') : null;
      if (wordSpan) {
        e.stopPropagation();
        document.querySelectorAll('.vn-word.active-word').forEach(el => el.classList.remove('active-word'));
        wordSpan.classList.add('active-word');
        translateAndShowPopup(wordSpan.getAttribute('data-word') || wordSpan.textContent);
        return;
      }

      if (!globalTranslatorEnabled) return;
      if (e.target.closest && e.target.closest(INTERACTIVE_SKIP)) return;

      const sel = window.getSelection ? window.getSelection().toString().trim() : '';
      const cleanSel = sel.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
      if (cleanSel && /^[A-Za-z'-]{2,25}$/.test(cleanSel)) {
        translateAndShowPopup(cleanSel);
        return;
      }

      const tappedWord = getWordAtPoint(e.clientX, e.clientY);
      if (tappedWord) {
        translateAndShowPopup(tappedWord);
      }
    });

    // Долгое выделение пальцем на телефоне или мышкой на ПК
    let selTimer = null;
    let lastSelectedWord = '';
    document.addEventListener('selectionchange', function() {
      if (!globalTranslatorEnabled) return;
      const cp = document.getElementById('cpModal');
      if (cp && cp.classList.contains('open')) return;
      clearTimeout(selTimer);
      selTimer = setTimeout(function() {
        const selObj = window.getSelection ? window.getSelection() : null;
        const rawSel = selObj ? selObj.toString().trim() : '';
        const cleanSel = rawSel.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
        if (cleanSel && /^[A-Za-z'-]{2,25}$/.test(cleanSel) && cleanSel.toLowerCase() !== lastSelectedWord) {
          lastSelectedWord = cleanSel.toLowerCase();
          translateAndShowPopup(cleanSel);
        } else if (!cleanSel) {
          lastSelectedWord = '';
        }
      }, 420);
    });

    document.getElementById('eshPopupSpeakBtn').addEventListener('click', function() {
      if (currentSelectedWord) window.speakText(currentSelectedWord);
    });

    const retryBtnEl = document.getElementById('eshPopupRetryBtn');
    if (retryBtnEl) {
      retryBtnEl.addEventListener('click', function() {
        if (currentSelectedWord) translateAndShowPopup(currentSelectedWord);
      });
    }

    document.getElementById('eshPopupSaveBtn').addEventListener('click', function() {
      if (!currentSelectedWord) return;
      const saved = JSON.parse(localStorage.getItem('esh_novel_words') || '[]');
      const existing = saved.find(item => String(item.word).toLowerCase() === currentSelectedWord);
      const bestTrans = currentSelectedTrans || lookupLocalWord(currentSelectedWord) || 'добавлено из чтения';
      if (!existing) {
        saved.push({ word: currentSelectedWord, translation: bestTrans, date: Date.now() });
        localStorage.setItem('esh_novel_words', JSON.stringify(saved));
      } else if (currentSelectedTrans && (!existing.translation || existing.translation.includes('не указан'))) {
        existing.translation = currentSelectedTrans;
        localStorage.setItem('esh_novel_words', JSON.stringify(saved));
      }

      const el = document.getElementById('eshSavedWordsCount');
      if (el) el.textContent = saved.length;
      if (typeof window.syncCustomWordsIntoDictionary === 'function') {
        window.syncCustomWordsIntoDictionary();
      }
      updatePopupSaveState(currentSelectedWord);
    });

    function syncDrawerSummary() {
      const savedWordsEl = document.getElementById('eshSavedWordsCount');
      const savedList = JSON.parse(localStorage.getItem('esh_novel_words') || '[]');
      if (savedWordsEl) savedWordsEl.textContent = savedList.length;
      if (typeof window.syncAllCounters === 'function') window.syncAllCounters();
    }

    function closeOverlaysForNav() {
      document.getElementById('eshBurgerBtn').classList.remove('active');
      document.getElementById('eshDrawer').classList.remove('open');
      document.getElementById('eshDrawerBackdrop').classList.remove('open');
      document.getElementById('eshVnModal').classList.remove('open');
      document.getElementById('eshWordPopup').classList.remove('show');
    }

    window.ESHHub = {
      toggleDrawer: function() {
        document.getElementById('eshBurgerBtn').classList.toggle('active');
        document.getElementById('eshDrawer').classList.toggle('open');
        document.getElementById('eshDrawerBackdrop').classList.toggle('open');
      },
      openMyWords: function() {
        closeOverlaysForNav();
        if (typeof switchTab === 'function') switchTab('dict');
        if (typeof window.filterDictBySeries === 'function') window.filterDictBySeries('Мои слова');
      },
      openCollections: function() {
        closeOverlaysForNav();
        if (typeof switchTab === 'function') switchTab('dict');
        if (typeof window.openDeckManagerFromOutside === 'function') window.openDeckManagerFromOutside();
      },
      openWordTrainer: function() {
        closeOverlaysForNav();
        if (typeof switchTab === 'function') switchTab('dict');
        if (typeof window.openTrainerFromOutside === 'function') window.openTrainerFromOutside();
      },
      openNovelModal: function(novelKey) {
        activeNovelKey = novelKey || 'tvd_s4';
        activeChapterIdx = 0;
        document.getElementById('eshBurgerBtn').classList.remove('active');
        document.getElementById('eshDrawer').classList.remove('open');
        document.getElementById('eshDrawerBackdrop').classList.remove('open');
        document.getElementById('eshVnModal').classList.add('open');
        renderNovel();
      },
      closeNovelModal: function() {
        document.getElementById('eshVnModal').classList.remove('open');
        document.getElementById('eshWordPopup').classList.remove('show');
        if (typeof window.stopAllAudio === 'function') window.stopAllAudio();
      },
      selectChapter: function(idx) {
        activeChapterIdx = idx;
        renderNovel();
        document.getElementById('eshVnModal').scrollTo({ top: 0, behavior: 'smooth' });
      },
      answerChoice: function(choiceIdx) {
        const ch = NOVELS[activeNovelKey].chapters[activeChapterIdx];
        const choice = ch.choices[choiceIdx];
        const fb = document.getElementById('eshVnFeedback');
        if (!fb || !choice) return;
        fb.style.display = 'block';
        if (choice.correct) {
          fb.style.background = 'rgba(16, 185, 129, 0.14)';
          fb.style.border = '1px solid #10b981';
          fb.style.color = '#d1fae5';
          const nextBtn = document.getElementById('eshNextChapBtn');
          if (nextBtn) nextBtn.style.display = 'block';
        } else {
          fb.style.background = 'rgba(239, 68, 68, 0.14)';
          fb.style.border = '1px solid #ef4444';
          fb.style.color = '#fee2e2';
        }
        fb.innerHTML = choice.response;
      },
      toggleGlobalTranslator: function() {
        globalTranslatorEnabled = !globalTranslatorEnabled;
        const st = document.getElementById('eshGlobalTransStatus');
        st.textContent = globalTranslatorEnabled ? 'ВКЛ' : 'ВЫКЛ';
        st.style.color = globalTranslatorEnabled ? '#10b981' : '#ef4444';
      }
    };

    syncDrawerSummary();
  })();
