(function () {
  const languageNames = {
    '🇸🇦': 'ערבית',
    '🇮🇹': 'איטלקית',
    '🇷🇺': 'רוסית',
    '🇪🇸': 'ספרדית'
  };

  function promptForReviewItem(details) {
    const summary = details.querySelector('summary');
    const originalWord = summary?.querySelector('b')?.textContent?.trim() || '';
    const flag = summary?.querySelector('span')?.textContent?.trim() || '';
    const transliteration = details.querySelector('.review-answer > span')?.textContent?.trim() || '';
    const isArabic = flag === '🇸🇦' || /[\u0600-\u06FF]/.test(originalWord);

    return {
      isArabic,
      languageName: languageNames[flag] || 'שפה',
      prompt: isArabic && transliteration ? transliteration : originalWord,
      originalWord
    };
  }

  function upgradeReviewCards() {
    const list = document.getElementById('review-list');
    if (!list) return;

    list.querySelectorAll('details.review-item').forEach(details => {
      const answer = details.querySelector('.review-answer');
      const statusButton = answer?.querySelector('[data-review-id]');
      if (!answer || !statusButton) return;

      const { isArabic, languageName, prompt, originalWord } = promptForReviewItem(details);
      const translation = answer.querySelector('strong')?.textContent?.trim() || '';

      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-card-head">
          <span class="review-language-chip">${languageName}</span>
          <strong class="review-prompt" dir="${isArabic ? 'rtl' : 'auto'}">${prompt}</strong>
        </div>
        <button class="btn small review-reveal" type="button" aria-expanded="false">הצג תשובה</button>
        <div class="review-card-answer hidden" aria-hidden="true">
          <strong class="review-translation">${translation}</strong>
          ${isArabic ? `<span class="review-original-arabic" dir="rtl">${originalWord}</span>` : ''}
        </div>`;

      const revealButton = card.querySelector('.review-reveal');
      const answerBox = card.querySelector('.review-card-answer');
      answerBox.appendChild(statusButton);

      revealButton.addEventListener('click', () => {
        const opening = answerBox.classList.contains('hidden');
        answerBox.classList.toggle('hidden', !opening);
        answerBox.setAttribute('aria-hidden', opening ? 'false' : 'true');
        revealButton.setAttribute('aria-expanded', opening ? 'true' : 'false');
        revealButton.textContent = opening ? 'הסתר תשובה' : 'הצג תשובה';
      });

      details.replaceWith(card);
    });
  }

  const reviewList = document.getElementById('review-list');
  if (reviewList) {
    const observer = new MutationObserver(() => upgradeReviewCards());
    observer.observe(reviewList, { childList: true, subtree: false });
    upgradeReviewCards();
  }

  window.upgradeLanguageReviewCards = upgradeReviewCards;
})();
