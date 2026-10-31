const REDUCED = '(prefers-reduced-motion: reduce)';

/** Adds lightweight, one-time reveals to page sections and a small row sample. */
export function mountEditorialMotion(root) {
  if (!root || window.matchMedia?.(REDUCED).matches || !('IntersectionObserver' in window)) return () => {};

  let disposed = false;
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

  const prepare = () => {
    if (disposed) return;
    const sections = root.querySelectorAll('.page-header, .page-body > *, .page > .card, .page > .dash-grid, .page > .stat-grid, .page > .list-page__workspace');
    sections.forEach((section, index) => {
      if (section.dataset.motionReady) return;
      section.dataset.motionReady = 'true';
      section.style.setProperty('--motion-order', String(Math.min(index, 7)));
      section.classList.add('editorial-reveal');
      revealObserver.observe(section);
    });

    root.querySelectorAll('.table tbody').forEach((body) => {
      [...body.rows].slice(0, 6).forEach((row, index) => {
        if (row.dataset.motionReady) return;
        row.dataset.motionReady = 'true';
        row.style.setProperty('--motion-order', String(index));
        row.classList.add('editorial-row-reveal');
        revealObserver.observe(row);
      });
    });
  };

  prepare();
  const mutationObserver = new MutationObserver(prepare);
  mutationObserver.observe(root, { childList: true, subtree: true });
  requestAnimationFrame(prepare);

  return () => {
    disposed = true;
    mutationObserver.disconnect();
    revealObserver.disconnect();
  };
}
