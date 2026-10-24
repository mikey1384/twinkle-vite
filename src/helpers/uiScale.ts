// How much bigger than the 1512px Mac design the page is drawn: 1 up to
// 1512px wide, then the window width / 1512, at most 1.5 (styles.css --px).
// Lengths the code keeps in design pixels (such as resizable panel widths)
// are drawn as calc(N * var(--px)); divide pointer movement by this.
export function uiScale() {
  if (typeof window === 'undefined') return 1;
  return Math.min(1.5, Math.max(1, window.innerWidth / 1512));
}
