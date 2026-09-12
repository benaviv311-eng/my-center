(function (root) {
  const russianMap = {
    А:'A', а:'a', Б:'B', б:'b', В:'V', в:'v', Г:'G', г:'g', Д:'D', д:'d',
    Е:'E', е:'e', Ё:'Yo', ё:'yo', Ж:'Zh', ж:'zh', З:'Z', з:'z', И:'I', и:'i',
    Й:'Y', й:'y', К:'K', к:'k', Л:'L', л:'l', М:'M', м:'m', Н:'N', н:'n',
    О:'O', о:'o', П:'P', п:'p', Р:'R', р:'r', С:'S', с:'s', Т:'T', т:'t',
    У:'U', у:'u', Ф:'F', ф:'f', Х:'Kh', х:'kh', Ц:'Ts', ц:'ts', Ч:'Ch', ч:'ch',
    Ш:'Sh', ш:'sh', Щ:'Shch', щ:'shch', Ъ:'', ъ:'', Ы:'Y', ы:'y', Ь:'', ь:'',
    Э:'E', э:'e', Ю:'Yu', ю:'yu', Я:'Ya', я:'ya'
  };

  function transliterateRussian(text) {
    return [...String(text || '')].map(char => Object.prototype.hasOwnProperty.call(russianMap, char) ? russianMap[char] : char).join('');
  }

  function hasCyrillic(text) {
    return /[А-Яа-яЁё]/.test(text || '');
  }

  function enhanceDailyRussian() {
    if (typeof document === 'undefined') return;
    const card = document.querySelector('#daily-language-unit .daily-language-card');
    if (!card) return;
    const label = card.querySelector('.label.lang')?.textContent || '';
    if (!label.includes('רוסית')) return;

    card.querySelectorAll('.language-word .target-text, .sentence-content .target-text').forEach(target => {
      if (target.dataset.ruTransliterated === 'true') return;
      const original = target.textContent.trim();
      if (!hasCyrillic(original)) return;
      target.textContent = transliterateRussian(original);
      target.dir = 'ltr';
      target.dataset.ruTransliterated = 'true';

      const originalLine = document.createElement('span');
      originalLine.className = 'russian-original';
      originalLine.dir = 'ltr';
      originalLine.textContent = original;
      target.insertAdjacentElement('afterend', originalLine);
    });

    card.querySelectorAll('.exercise-box .target-text').forEach(target => {
      if (target.dataset.ruTransliterated === 'true') return;
      const original = target.textContent.trim();
      if (!hasCyrillic(original)) return;
      target.textContent = transliterateRussian(original);
      target.dir = 'ltr';
      target.dataset.ruTransliterated = 'true';
      const originalInline = document.createElement('small');
      originalInline.className = 'russian-original-inline';
      originalInline.dir = 'ltr';
      originalInline.textContent = ` (${original})`;
      target.insertAdjacentElement('afterend', originalInline);
    });
  }

  function enhanceReviewRussian() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('#review-list .review-card').forEach(card => {
      const language = card.querySelector('.review-language-chip')?.textContent?.trim();
      if (language !== 'רוסית' || card.dataset.ruTransliterated === 'true') return;
      const prompt = card.querySelector('.review-prompt');
      if (!prompt) return;
      const original = prompt.textContent.trim();
      if (!hasCyrillic(original)) return;

      prompt.textContent = transliterateRussian(original);
      prompt.dir = 'ltr';
      card.dataset.ruTransliterated = 'true';

      const answer = card.querySelector('.review-card-answer');
      if (answer && !answer.querySelector('.review-original-russian')) {
        const originalLine = document.createElement('span');
        originalLine.className = 'review-original-russian';
        originalLine.dir = 'ltr';
        originalLine.textContent = original;
        const translation = answer.querySelector('.review-translation');
        if (translation) translation.insertAdjacentElement('afterend', originalLine);
        else answer.prepend(originalLine);
      }
    });
  }

  function enhanceArchiveRussian() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('#archive-list .archive-row').forEach(row => {
      const target = row.querySelector('.archive-word b');
      if (!target || target.dataset.ruTransliterated === 'true') return;
      const original = target.textContent.trim();
      if (!hasCyrillic(original)) return;

      target.textContent = transliterateRussian(original);
      target.dir = 'ltr';
      target.dataset.ruTransliterated = 'true';

      const originalLine = document.createElement('small');
      originalLine.className = 'russian-original';
      originalLine.dir = 'ltr';
      originalLine.textContent = original;
      target.insertAdjacentElement('afterend', originalLine);
    });
  }

  function enhanceAllRussian() {
    enhanceDailyRussian();
    enhanceReviewRussian();
    enhanceArchiveRussian();
  }

  if (typeof document !== 'undefined') {
    const daily = document.getElementById('daily-language-unit');
    const review = document.getElementById('review-list');
    const archive = document.getElementById('archive-list');
    const observer = new MutationObserver(enhanceAllRussian);
    [daily, review, archive].filter(Boolean).forEach(node => observer.observe(node, { childList: true, subtree: true }));
    enhanceAllRussian();
  }

  root.transliterateRussian = transliterateRussian;
  if (typeof module !== 'undefined' && module.exports) module.exports = { transliterateRussian };
})(typeof window !== 'undefined' ? window : globalThis);
