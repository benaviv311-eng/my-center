export function shouldUseLegacy(search = '') {
  const params = new URLSearchParams(search || '');
  return params.get('legacy') === '1';
}

export function renderUnsupported(root, error) {
  if (!root) return;
  const detail = error?.message ? ` — ${error.message}` : '';
  root.innerHTML = `<div class="movie-set-unsupported" role="alert"><strong>WebGL לא זמין בדפדפן הזה</strong><br>המשחק התלת־ממדי לא יכול להיפתח${detail}</div>`;
}

function webGLAvailable(root) {
  const doc = root?.ownerDocument || globalThis.document;
  if (!doc?.createElement) return false;
  const canvas = doc.createElement('canvas');
  try {
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export async function bootCrazyFamily({ root, legacyAdapter }) {
  if (!root) throw new Error('movie-set root is required');
  if (!webGLAvailable(root)) {
    const error = new Error('WebGL unavailable');
    renderUnsupported(root, error);
    throw error;
  }
  const { createCrazyFamilyGame } = await import('./game.js');
  const game = await createCrazyFamilyGame({ root, legacyAdapter });
  game.start?.();
  return game;
}
