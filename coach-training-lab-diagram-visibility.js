(() => {
  'use strict';

  const data = window.CoachTrainingLabData;
  const diagramsApi = window.CoachTrainingLabDiagrams;
  const lab = window.CoachTrainingLab;
  if (!data || !diagramsApi || !lab) return;

  const diagrams = diagramsApi.DIAGRAMS || {};
  const itemsById = new Map((data.LAB_ITEMS || []).map(item => [item.id, item]));
  const results = document.getElementById('training-lab-results');
  const filters = document.getElementById('training-lab-filters');
  if (!results || !filters) return;

  let diagramOnly = false;

  function decorateCard(card) {
    const id = card?.dataset?.labId;
    const diagram = diagrams[id];
    if (!id || !diagram) return;

    card.classList.add('has-diagram');

    const top = card.querySelector('.training-lab-card-top');
    if (top && !top.querySelector('.training-lab-diagram-badge')) {
      const badge = document.createElement('span');
      badge.className = 'training-lab-diagram-badge';
      badge.textContent = '🗺️ יש תרשים';
      top.appendChild(badge);
    }

    if (!card.querySelector('.training-lab-card-diagram-preview')) {
      const item = itemsById.get(id);
      const preview = document.createElement('div');
      preview.className = 'training-lab-card-diagram-preview';
      preview.setAttribute('aria-label', `תצוגה מקדימה של התרשים — ${item?.title || ''}`);
      preview.innerHTML = lab.renderDiagram(diagram, item?.title || '');
      preview.querySelector('[data-lab-action="expand-diagram"]')?.remove();
      preview.querySelector('.training-lab-diagram')?.classList.add('is-card-preview');
      const actions = card.querySelector('.training-lab-card-actions');
      if (actions) card.insertBefore(preview, actions);
      else card.appendChild(preview);
    }
  }

  function applyDiagramOnly() {
    results.querySelectorAll('[data-lab-id]').forEach(card => {
      card.hidden = diagramOnly && !card.classList.contains('has-diagram');
    });
  }

  function decorateAll() {
    results.querySelectorAll('[data-lab-id]').forEach(decorateCard);
    applyDiagramOnly();
  }

  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'training-lab-diagram-only';
  control.dataset.diagramOnly = 'false';
  control.setAttribute('aria-pressed', 'false');
  control.textContent = `🗺️ רק עם תרשים (${Object.keys(diagrams).length})`;
  filters.insertAdjacentElement('afterend', control);

  control.addEventListener('click', () => {
    diagramOnly = !diagramOnly;
    control.dataset.diagramOnly = String(diagramOnly);
    control.setAttribute('aria-pressed', String(diagramOnly));
    control.classList.toggle('active', diagramOnly);
    applyDiagramOnly();
  });

  const observer = new MutationObserver(decorateAll);
  observer.observe(results, { childList: true });
  decorateAll();
})();
