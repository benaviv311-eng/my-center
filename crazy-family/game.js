export async function createCrazyFamilyGame({ root, legacyAdapter }) {
  const doc = root.ownerDocument || document;
  const canvas = doc.createElement('canvas');
  canvas.className = 'movie-set-canvas';
  canvas.setAttribute('aria-label', 'המשפחה המשגעת — סלון תלת־ממדי');
  canvas.width = 960;
  canvas.height = 600;
  root.replaceChildren(canvas);

  let running = false;
  let raf = 0;
  let last = 0;
  const frame = (now) => {
    if (!running) return;
    const dt = last ? Math.min(0.033, (now - last) / 1000) : 0;
    last = now;
    legacyAdapter?.tickRetainedSystems?.(dt);
    raf = requestAnimationFrame(frame);
  };

  return {
    canvas,
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    dispose() {
      this.stop();
      canvas.remove();
    },
  };
}
