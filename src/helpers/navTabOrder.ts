const STORAGE_KEY = 'twinkle-desktop-tab-order';

export const NAV_TAB_KEYS = [
  'profile',
  'home',
  'explore',
  'content',
  'missions',
  'chat',
  'build'
] as const;

export type NavTabKey = (typeof NAV_TAB_KEYS)[number];

export function loadNavTabOrder(): NavTabKey[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [...NAV_TAB_KEYS];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [...NAV_TAB_KEYS];
    const order: NavTabKey[] = [];
    for (const key of parsed) {
      if (
        (NAV_TAB_KEYS as readonly string[]).includes(key) &&
        !order.includes(key as NavTabKey)
      ) {
        order.push(key as NavTabKey);
      }
    }
    // tabs added in later releases appear even for users with a saved order
    for (const key of NAV_TAB_KEYS) {
      if (!order.includes(key)) {
        order.push(key);
      }
    }
    return order;
  } catch {
    return [...NAV_TAB_KEYS];
  }
}

export function saveNavTabOrder(order: NavTabKey[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // localStorage unavailable (privacy mode); order stays session-only
  }
}
