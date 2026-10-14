const overflowProperties = ['overflow-x', 'overflow-y'] as const;

interface BodyScrollLock {
  owners: number;
  previous: { property: string; value: string; priority: string }[];
}

const locks = new WeakMap<HTMLElement, BodyScrollLock>();

// A page and a dialog can disappear in either order during navigation. Keep
// their locks together so the last cleanup restores the original inline CSS,
// never another surface's temporary "hidden" value (which strands iOS pages).
export function lockBodyScroll(body: HTMLElement) {
  let lock = locks.get(body);
  if (!lock) {
    lock = {
      owners: 0,
      previous: overflowProperties.map((property) => ({
        property,
        value: body.style.getPropertyValue(property),
        priority: body.style.getPropertyPriority(property)
      }))
    };
    locks.set(body, lock);
    for (const property of overflowProperties) {
      body.style.setProperty(property, 'hidden');
    }
  }
  lock.owners += 1;
  const ownedLock = lock;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    ownedLock.owners -= 1;
    if (ownedLock.owners > 0) return;
    locks.delete(body);
    for (const { property, value, priority } of ownedLock.previous) {
      if (value) body.style.setProperty(property, value, priority);
      else body.style.removeProperty(property);
    }
  };
}
