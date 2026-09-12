const LANGUAGE_STORAGE_KEY = 'my-center-languages-v1';

const LANGUAGE_COURSES = {
  ar: {
    name: 'ערבית',
    nativeName: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl',
    sets: [
      {
        category: 'בסיס ושיחה',
        words: [
          ['مرحبا', 'מַרְחַבַּא', 'שלום'],
          ['شكرا', 'שֻכְּרַן', 'תודה'],
          ['لو سمحت', 'לַו סַמַחְת', 'בבקשה / סליחה'],
          ['نعم', 'נַעַם', 'כן'],
          ['لا', 'לַא', 'לא']
        ],
        sentences: [
          ['كيفك؟', 'כִּיפַכּ?', 'מה שלומך?'],
          ['أنا منيح.', 'אַנַא מְנִיח.', 'אני בסדר.']
        ]
      },
      {
        category: 'מקומות וכיוון',
        words: [
          ['بيت', 'בֵּית', 'בית'],
          ['طريق', 'טַרִיק', 'דרך'],
          ['هون', 'הוֹן', 'כאן'],
          ['هناك', 'הְנַאכּ', 'שם'],
          ['قريب', 'קַרִיבּ', 'קרוב']
        ],
        sentences: [
          ['وين الطريق؟', 'וֵין אֶ־טַרִיק?', 'איפה הדרך?'],
          ['البيت قريب.', 'אֶל־בֵּית קַרִיבּ.', 'הבית קרוב.']
        ]
      },
      {
        category: 'זמן',
        words: [
          ['اليوم', 'אִלְיוֹם', 'היום'],
          ['بكرة', 'בֻּכְּרַה', 'מחר'],
          ['هسا', 'הַסַּא', 'עכשיו'],
          ['وقت', 'וַקְת', 'זמן'],
          ['بعدين', 'בַּעְדֵין', 'אחר כך']
        ],
        sentences: [
          ['ما عندي وقت.', 'מַא עִנְדִי וַקְת.', 'אין לי זמן.'],
          ['بشوفك بكرة.', 'בְּשוּפַכּ בֻּכְּרַה.', 'אראה אותך מחר.']
        ]
      },
      {
        category: 'פעולות יומיומיות',
        words: [
          ['بدي', 'בַּדִּי', 'אני רוצה'],
          ['بروح', 'בְּרוּח', 'אני הולך'],
          ['بجي', 'בְּגִ׳י', 'אני בא'],
          ['باكل', 'בַּאכֹּל', 'אני אוכל'],
          ['بشرب', 'בַּשְרַבּ', 'אני שותה']
        ],
        sentences: [
          ['بدي أشرب مي.', 'בַּדִּי אַשְרַבּ מַי.', 'אני רוצה לשתות מים.'],
          ['بروح عالبيت.', 'בְּרוּח עַלְבֵּית.', 'אני הולך הביתה.']
        ]
      }
    ]
  },
  it: {
    name: 'איטלקית',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    direction: 'ltr',
    sets: [
      {
        category: 'בסיס ושיחה',
        words: [
          ['ciao', '', 'שלום / ביי'],
          ['grazie', '', 'תודה'],
          ['per favore', '', 'בבקשה'],
          ['sì', '', 'כן'],
          ['no', '', 'לא']
        ],
        sentences: [
          ['Come stai?', '', 'מה שלומך?'],
          ['Sto bene, grazie.', '', 'אני בסדר, תודה.']
        ]
      },
      {
        category: 'מקומות וכיוון',
        words: [
          ['casa', '', 'בית'],
          ['strada', '', 'רחוב / דרך'],
          ['dove', '', 'איפה'],
          ['vicino', '', 'קרוב'],
          ['lontano', '', 'רחוק']
        ],
        sentences: [
          ["Dov'è la strada?", '', 'איפה הדרך?'],
          ['La casa è vicina.', '', 'הבית קרוב.']
        ]
      },
      {
        category: 'זמן',
        words: [
          ['oggi', '', 'היום'],
          ['domani', '', 'מחר'],
          ['adesso', '', 'עכשיו'],
          ['tempo', '', 'זמן'],
          ['dopo', '', 'אחר כך']
        ],
        sentences: [
          ['Non ho tempo.', '', 'אין לי זמן.'],
          ['Ci vediamo domani.', '', 'נתראה מחר.']
        ]
      },
      {
        category: 'פעולות יומיומיות',
        words: [
          ['voglio', '', 'אני רוצה'],
          ['vado', '', 'אני הולך'],
          ['vengo', '', 'אני בא'],
          ['mangio', '', 'אני אוכל'],
          ['bevo', '', 'אני שותה']
        ],
        sentences: [
          ['Voglio bere acqua.', '', 'אני רוצה לשתות מים.'],
          ['Vado a casa.', '', 'אני הולך הביתה.']
        ]
      }
    ]
  },
  ru: {
    name: 'רוסית',
    nativeName: 'Русский',
    flag: '🇷🇺',
    direction: 'ltr',
    sets: [
      {
        category: 'בסיס ושיחה',
        words: [
          ['привет', '', 'שלום'],
          ['спасибо', '', 'תודה'],
          ['пожалуйста', '', 'בבקשה'],
          ['да', '', 'כן'],
          ['нет', '', 'לא']
        ],
        sentences: [
          ['Как дела?', '', 'מה שלומך?'],
          ['Всё хорошо, спасибо.', '', 'הכול בסדר, תודה.']
        ]
      },
      {
        category: 'מקומות וכיוון',
        words: [
          ['дом', '', 'בית'],
          ['дорога', '', 'דרך'],
          ['где', '', 'איפה'],
          ['близко', '', 'קרוב'],
          ['далеко', '', 'רחוק']
        ],
        sentences: [
          ['Где дорога?', '', 'איפה הדרך?'],
          ['Дом близко.', '', 'הבית קרוב.']
        ]
      },
      {
        category: 'זמן',
        words: [
          ['сегодня', '', 'היום'],
          ['завтра', '', 'מחר'],
          ['сейчас', '', 'עכשיו'],
          ['время', '', 'זמן'],
          ['потом', '', 'אחר כך']
        ],
        sentences: [
          ['У меня нет времени.', '', 'אין לי זמן.'],
          ['Увидимся завтра.', '', 'נתראה מחר.']
        ]
      },
      {
        category: 'פעולות יומיומיות',
        words: [
          ['хочу', '', 'אני רוצה'],
          ['иду', '', 'אני הולך'],
          ['прихожу', '', 'אני מגיע'],
          ['ем', '', 'אני אוכל'],
          ['пью', '', 'אני שותה']
        ],
        sentences: [
          ['Я хочу воды.', '', 'אני רוצה מים.'],
          ['Я иду домой.', '', 'אני הולך הביתה.']
        ]
      }
    ]
  },
  es: {
    name: 'ספרדית',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
    sets: [
      {
        category: 'בסיס ושיחה',
        words: [
          ['hola', '', 'שלום'],
          ['gracias', '', 'תודה'],
          ['por favor', '', 'בבקשה'],
          ['sí', '', 'כן'],
          ['no', '', 'לא']
        ],
        sentences: [
          ['¿Cómo estás?', '', 'מה שלומך?'],
          ['Estoy bien, gracias.', '', 'אני בסדר, תודה.']
        ]
      },
      {
        category: 'מקומות וכיוון',
        words: [
          ['casa', '', 'בית'],
          ['calle', '', 'רחוב'],
          ['dónde', '', 'איפה'],
          ['cerca', '', 'קרוב'],
          ['lejos', '', 'רחוק']
        ],
        sentences: [
          ['¿Dónde está la calle?', '', 'איפה הרחוב?'],
          ['La casa está cerca.', '', 'הבית קרוב.']
        ]
      },
      {
        category: 'זמן',
        words: [
          ['hoy', '', 'היום'],
          ['mañana', '', 'מחר'],
          ['ahora', '', 'עכשיו'],
          ['tiempo', '', 'זמן'],
          ['después', '', 'אחר כך']
        ],
        sentences: [
          ['No tengo tiempo.', '', 'אין לי זמן.'],
          ['Nos vemos mañana.', '', 'נתראה מחר.']
        ]
      },
      {
        category: 'פעולות יומיומיות',
        words: [
          ['quiero', '', 'אני רוצה'],
          ['voy', '', 'אני הולך'],
          ['vengo', '', 'אני בא'],
          ['como', '', 'אני אוכל'],
          ['bebo', '', 'אני שותה']
        ],
        sentences: [
          ['Quiero beber agua.', '', 'אני רוצה לשתות מים.'],
          ['Voy a casa.', '', 'אני הולך הביתה.']
        ]
      }
    ]
  }
};

const languageCodes = ['ar', 'it', 'ru', 'es'];

function loadLanguageState() {
  const fallback = {
    completedByDate: {},
    refreshByDate: {},
    seenWords: {},
    wordStatus: {},
    selectedLanguage: 'ar'
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(LANGUAGE_STORAGE_KEY) || '{}');
    return {
      ...fallback,
      ...parsed,
      completedByDate: parsed.completedByDate || {},
      refreshByDate: parsed.refreshByDate || {},
      seenWords: parsed.seenWords || {},
      wordStatus: parsed.wordStatus || {}
    };
  } catch {
    return fallback;
  }
}

let languageState = loadLanguageState();

function saveLanguageState() {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(languageState));
}

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateSeed(dateKey) {
  return [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function refreshStateFor(code) {
  const date = localDateKey();
  languageState.refreshByDate[date] ||= {};
  languageState.refreshByDate[date][code] ||= { words: 0, sentence: 0, exercise: 0 };
  return languageState.refreshByDate[date][code];
}

function getDailySet(code) {
  const course = LANGUAGE_COURSES[code];
  const refresh = refreshStateFor(code);
  const index = (dateSeed(localDateKey()) + languageCodes.indexOf(code) + refresh.words) % course.sets.length;
  return { set: course.sets[index], setIndex: index };
}

function wordId(code, setIndex, wordIndex) {
  return `${code}-${setIndex}-${wordIndex}`;
}

function rememberCurrentWords(code, setIndex, set) {
  const date = localDateKey();
  set.words.forEach((word, wordIndex) => {
    const id = wordId(code, setIndex, wordIndex);
    if (!languageState.seenWords[id]) {
      languageState.seenWords[id] = {
        id,
        code,
        target: word[0],
        transliteration: word[1],
        hebrew: word[2],
        category: set.category,
        firstSeen: date
      };
      languageState.wordStatus[id] = languageState.wordStatus[id] || 'new';
    }
  });
  saveLanguageState();
}

function completedToday() {
  return languageState.completedByDate[localDateKey()] || [];
}

function isCompleted(code) {
  return completedToday().includes(code);
}

function toggleCompleted(code) {
  const date = localDateKey();
  const current = new Set(languageState.completedByDate[date] || []);
  if (current.has(code)) current.delete(code);
  else current.add(code);
  languageState.completedByDate[date] = [...current];
  saveLanguageState();
  renderAll();
  if (current.has(code)) {
    const next = languageCodes.find(item => !current.has(item));
    if (next) selectLanguage(next, false);
  }
}

function selectLanguage(code, scroll = true) {
  languageState.selectedLanguage = code;
  saveLanguageState();
  renderLanguagePicker();
  renderDailyUnit();
  if (scroll) document.getElementById('daily-language-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderLanguagePicker() {
  const el = document.getElementById('language-picker');
  if (!el) return;
  el.innerHTML = languageCodes.map(code => {
    const course = LANGUAGE_COURSES[code];
    const active = languageState.selectedLanguage === code ? ' active' : '';
    const done = isCompleted(code);
    return `<button class="language-choice${active}${done ? ' done' : ''}" type="button" data-language="${code}">
      <span class="language-flag">${course.flag}</span>
      <span><b>${course.name}</b><small>${course.nativeName}</small></span>
      <span class="language-done">${done ? '✓' : ''}</span>
    </button>`;
  }).join('');

  el.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => selectLanguage(button.dataset.language));
  });
}

function renderProgress() {
  const count = completedToday().length;
  const label = document.getElementById('language-progress-label');
  const bar = document.getElementById('language-progress-bar');
  if (label) label.textContent = `${count}/4 הושלמו היום`;
  if (bar) bar.style.width = `${count * 25}%`;
}

function sentenceMarkup(code, sentence) {
  if (code === 'ar') {
    return `<b class="target-text" dir="rtl">${sentence[0]}</b>
      <span class="transliteration">${sentence[1]}</span>
      <span>${sentence[2]}</span>`;
  }
  return `<b class="target-text" dir="ltr">${sentence[0]}</b><span>${sentence[2]}</span>`;
}

function wordMarkup(code, word, id) {
  const transliteration = code === 'ar' && word[1] ? `<span class="transliteration">${word[1]}</span>` : '';
  return `<div class="language-word" data-word-id="${id}">
    <b class="target-text" dir="${LANGUAGE_COURSES[code].direction}">${word[0]}</b>
    ${transliteration}
    <span>${word[2]}</span>
  </div>`;
}

function exerciseOptions(set, answerIndex) {
  const indexes = [answerIndex, (answerIndex + 2) % set.words.length, (answerIndex + 4) % set.words.length];
  return indexes.map(index => set.words[index][2]);
}

function renderDailyUnit() {
  const el = document.getElementById('daily-language-unit');
  if (!el) return;

  const code = languageState.selectedLanguage || 'ar';
  const course = LANGUAGE_COURSES[code];
  const { set, setIndex } = getDailySet(code);
  const refresh = refreshStateFor(code);
  rememberCurrentWords(code, setIndex, set);

  const sentence = set.sentences[(dateSeed(localDateKey()) + refresh.sentence) % set.sentences.length];
  const answerIndex = (dateSeed(localDateKey()) + refresh.exercise) % set.words.length;
  const exerciseWord = set.words[answerIndex];
  const options = exerciseOptions(set, answerIndex);

  el.innerHTML = `<article class="card daily-language-card">
    <div class="daily-language-head">
      <div>
        <div class="label lang">${course.flag} ${course.name}</div>
        <h2>${set.category}</h2>
        <p class="meta">יחידה יומית · 5 מילים חדשות + משפט שימושי + תרגיל קצר</p>
      </div>
      <span class="completion-badge${isCompleted(code) ? ' complete' : ''}">${isCompleted(code) ? 'הושלם ✓' : 'להיום'}</span>
    </div>

    <div class="language-lesson-block">
      <h3>5 מילים</h3>
      ${code === 'ar' ? '<p class="meta">ערבית → תעתיק בעברית → תרגום לעברית</p>' : ''}
      <div class="language-word-grid">
        ${set.words.map((word, index) => wordMarkup(code, word, wordId(code, setIndex, index))).join('')}
      </div>
    </div>

    <div class="language-lesson-block sentence-box">
      <div class="lesson-row-head">
        <h3>משפט שימושי</h3>
        <button class="btn small" id="refresh-sentence" type="button">משפט אחר ↻</button>
      </div>
      <div class="sentence-content">${sentenceMarkup(code, sentence)}</div>
    </div>

    <div class="language-lesson-block exercise-box">
      <div class="lesson-row-head">
        <h3>תרגיל קצר</h3>
        <button class="btn small" id="refresh-exercise" type="button">תרגיל אחר ↻</button>
      </div>
      <p>מה פירוש <b class="target-text" dir="${course.direction}">${exerciseWord[0]}</b>?</p>
      <div class="exercise-options">
        ${options.map(option => `<button class="exercise-option" type="button" data-answer="${option === exerciseWord[2] ? 'correct' : 'wrong'}">${option}</button>`).join('')}
      </div>
      <div id="exercise-feedback" class="exercise-feedback" aria-live="polite"></div>
    </div>

    <div class="card-actions language-unit-actions">
      <button class="btn" id="refresh-words" type="button">החלף 5 מילים ↻</button>
      <button class="btn language-complete-btn${isCompleted(code) ? ' completed' : ''}" id="complete-language" type="button">
        ${isCompleted(code) ? 'בטל סימון השלמה' : 'סיימתי את היחידה ✓'}
      </button>
    </div>
    <p class="meta safe-refresh-note">החלפת מילים אינה מוחקת את הקודמות — הן נשארות במאגר ובחזרות.</p>
  </article>`;

  document.getElementById('refresh-sentence')?.addEventListener('click', () => {
    refresh.sentence += 1;
    saveLanguageState();
    renderDailyUnit();
  });

  document.getElementById('refresh-exercise')?.addEventListener('click', () => {
    refresh.exercise += 1;
    saveLanguageState();
    renderDailyUnit();
  });

  document.getElementById('refresh-words')?.addEventListener('click', () => {
    refresh.words += 1;
    refresh.sentence = 0;
    refresh.exercise = 0;
    saveLanguageState();
    renderDailyUnit();
    renderArchive();
    renderStats();
    renderReview();
    toast('המילים הוחלפו והקודמות נשמרו במאגר');
  });

  document.getElementById('complete-language')?.addEventListener('click', () => toggleCompleted(code));

  el.querySelectorAll('.exercise-option').forEach(button => {
    button.addEventListener('click', () => {
      const feedback = document.getElementById('exercise-feedback');
      el.querySelectorAll('.exercise-option').forEach(option => option.disabled = true);
      if (button.dataset.answer === 'correct') {
        button.classList.add('correct');
        if (feedback) feedback.textContent = 'נכון ✓';
      } else {
        button.classList.add('wrong');
        const correct = [...el.querySelectorAll('.exercise-option')].find(option => option.dataset.answer === 'correct');
        correct?.classList.add('correct');
        if (feedback) feedback.textContent = `כמעט. התשובה הנכונה: ${exerciseWord[2]}`;
      }
    });
  });
}

function statusLabel(status) {
  if (status === 'known') return 'יודע ✓';
  if (status === 'practice') return 'לתרגול';
  return 'חדש';
}

function cycleWordStatus(id) {
  const current = languageState.wordStatus[id] || 'new';
  const next = current === 'new' ? 'practice' : current === 'practice' ? 'known' : 'new';
  languageState.wordStatus[id] = next;
  saveLanguageState();
  renderArchive();
  renderStats();
  renderReview();
}

function seenEntries() {
  return Object.values(languageState.seenWords).sort((a, b) => b.firstSeen.localeCompare(a.firstSeen));
}

function renderStats() {
  const el = document.getElementById('language-stats');
  if (!el) return;
  const entries = seenEntries();
  el.innerHTML = languageCodes.map(code => {
    const total = entries.filter(entry => entry.code === code).length;
    const known = entries.filter(entry => entry.code === code && languageState.wordStatus[entry.id] === 'known').length;
    const course = LANGUAGE_COURSES[code];
    return `<div class="language-stat">
      <span>${course.flag}</span>
      <div><b>${course.name}</b><small>${total} במאגר · ${known} יודע</small></div>
    </div>`;
  }).join('');
}

function renderArchive() {
  const el = document.getElementById('archive-list');
  if (!el) return;
  const search = (document.getElementById('archive-search')?.value || '').trim().toLowerCase();
  const filter = document.getElementById('archive-language')?.value || 'all';

  const entries = seenEntries().filter(entry => {
    const matchesLanguage = filter === 'all' || entry.code === filter;
    const haystack = `${entry.target} ${entry.transliteration || ''} ${entry.hebrew} ${entry.category}`.toLowerCase();
    return matchesLanguage && (!search || haystack.includes(search));
  });

  if (!entries.length) {
    el.innerHTML = '<p class="meta">עדיין אין מילים מתאימות במאגר.</p>';
    return;
  }

  el.innerHTML = entries.slice(0, 40).map(entry => {
    const course = LANGUAGE_COURSES[entry.code];
    const status = languageState.wordStatus[entry.id] || 'new';
    return `<div class="archive-row">
      <div class="archive-word">
        <span class="archive-flag">${course.flag}</span>
        <div>
          <b dir="${course.direction}">${entry.target}</b>
          ${entry.code === 'ar' && entry.transliteration ? `<small>${entry.transliteration}</small>` : ''}
          <small>${entry.hebrew} · ${entry.category}</small>
        </div>
      </div>
      <button class="status-button status-${status}" type="button" data-status-id="${entry.id}">${statusLabel(status)}</button>
    </div>`;
  }).join('');

  el.querySelectorAll('[data-status-id]').forEach(button => {
    button.addEventListener('click', () => cycleWordStatus(button.dataset.statusId));
  });
}

function reviewPool() {
  const filter = document.getElementById('review-language')?.value || 'all';
  const entries = seenEntries().filter(entry => filter === 'all' || entry.code === filter);
  if (!entries.length) return [];
  const seed = dateSeed(localDateKey()) + Number(sessionStorage.getItem('language-review-offset') || 0);
  return [...entries]
    .sort((a, b) => ((a.id.charCodeAt(a.id.length - 1) + seed) % 17) - ((b.id.charCodeAt(b.id.length - 1) + seed) % 17))
    .slice(0, 5);
}

function renderReview() {
  const el = document.getElementById('review-list');
  if (!el) return;
  const entries = reviewPool();
  if (!entries.length) {
    el.innerHTML = '<p class="meta">סיים או פתח יחידה יומית, והמילים יופיעו כאן לחזרה.</p>';
    return;
  }
  el.innerHTML = entries.map(entry => {
    const course = LANGUAGE_COURSES[entry.code];
    return `<details class="review-item">
      <summary><span>${course.flag}</span> <b dir="${course.direction}">${entry.target}</b></summary>
      <div class="review-answer">
        ${entry.code === 'ar' && entry.transliteration ? `<span>${entry.transliteration}</span>` : ''}
        <strong>${entry.hebrew}</strong>
        <button class="btn small" type="button" data-review-id="${entry.id}">
          ${languageState.wordStatus[entry.id] === 'known' ? 'סמן לתרגול' : 'ידעתי ✓'}
        </button>
      </div>
    </details>`;
  }).join('');

  el.querySelectorAll('[data-review-id]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const id = button.dataset.reviewId;
      languageState.wordStatus[id] = languageState.wordStatus[id] === 'known' ? 'practice' : 'known';
      saveLanguageState();
      renderReview();
      renderArchive();
      renderStats();
    });
  });
}

function renderAll() {
  renderProgress();
  renderLanguagePicker();
  renderDailyUnit();
  renderStats();
  renderArchive();
  renderReview();
}

document.getElementById('review-language')?.addEventListener('change', renderReview);
document.getElementById('new-review')?.addEventListener('click', () => {
  const current = Number(sessionStorage.getItem('language-review-offset') || 0);
  sessionStorage.setItem('language-review-offset', String(current + 1));
  renderReview();
});
document.getElementById('archive-search')?.addEventListener('input', renderArchive);
document.getElementById('archive-language')?.addEventListener('change', renderArchive);

renderAll();
