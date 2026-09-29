// Endless CSS animations (colour shifts, shimmers, AI card holo effects,
// glows) repaint every frame for as long as their element exists, even when
// it is scrolled far out of view. On phones that is steady work and heat
// (Mikey, 2026-09-29). This pauses every infinite CSS animation whose element
// is off-screen and resumes it when it comes back. Finite animations are left
// alone, and an animation only resumes if this module paused it, so a
// component's own `animation-play-state: paused` is never overridden.

const SCAN_INTERVAL_MS = 3000;
const ROOT_MARGIN = '200px 0px';

export function startPausingOffscreenAnimations() {
  if (
    typeof document === 'undefined' ||
    typeof document.getAnimations !== 'function' ||
    typeof IntersectionObserver === 'undefined'
  ) {
    return () => {};
  }

  // Observed elements are held until unobserved; each scan drops the ones
  // that left the page (feed cards unmount constantly).
  const observed = new Set<Element>();
  const pausedByUs = new WeakSet<Animation>();
  const offscreen = new WeakSet<Element>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          offscreen.delete(entry.target);
        } else {
          offscreen.add(entry.target);
        }
      }
      const byTarget = infiniteAnimationsByTarget();
      for (const entry of entries) {
        applyState(entry.target, byTarget.get(entry.target) || []);
      }
    },
    { rootMargin: ROOT_MARGIN }
  );

  function infiniteAnimationsByTarget() {
    const byTarget = new Map<Element, Animation[]>();
    for (const animation of document.getAnimations()) {
      const effect = animation.effect as KeyframeEffect | null;
      const target = effect?.target;
      if (!target || effect.getTiming().iterations !== Infinity) continue;
      const list = byTarget.get(target);
      if (list) list.push(animation);
      else byTarget.set(target, [animation]);
    }
    return byTarget;
  }

  function applyState(element: Element, animations: Animation[]) {
    const isOffscreen = offscreen.has(element);
    for (const animation of animations) {
      if (isOffscreen) {
        if (animation.playState === 'running') {
          animation.pause();
          pausedByUs.add(animation);
        }
      } else if (pausedByUs.has(animation)) {
        pausedByUs.delete(animation);
        animation.play();
      }
    }
  }

  function scan() {
    if (document.visibilityState !== 'visible') return;
    for (const element of observed) {
      if (!element.isConnected) {
        observer.unobserve(element);
        observed.delete(element);
        offscreen.delete(element);
      }
    }
    for (const animation of document.getAnimations()) {
      const effect = animation.effect as KeyframeEffect | null;
      const target = effect?.target;
      if (!target || effect.getTiming().iterations !== Infinity) continue;
      if (!observed.has(target)) {
        observed.add(target);
        observer.observe(target);
      } else if (
        offscreen.has(target) &&
        animation.playState === 'running'
      ) {
        // A re-render restarted it while off-screen.
        animation.pause();
        pausedByUs.add(animation);
      }
    }
  }

  scan();
  const timer = window.setInterval(scan, SCAN_INTERVAL_MS);
  return () => {
    window.clearInterval(timer);
    observer.disconnect();
    observed.clear();
  };
}
