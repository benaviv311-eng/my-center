(() => {
  'use strict';

  const root = document.querySelector('.game-app');
  const shot = document.getElementById('gameplayShot');
  const error = document.getElementById('loadError');

  if (!root || !shot || !error) return;

  const markReady = () => {
    root.dataset.state = 'ready';
    error.hidden = true;
  };

  const markError = () => {
    root.dataset.state = 'asset-error';
    error.hidden = false;
  };

  shot.addEventListener('load', markReady, { once: true });
  shot.addEventListener('error', markError, { once: true });

  if (shot.complete) {
    shot.naturalWidth > 0 ? markReady() : markError();
  }
})();
