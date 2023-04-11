type EventType = keyof GlobalEventHandlersEventMap;
type EventListener = (event: Event) => void;

export function addEvent(
  elem: HTMLElement | null | undefined,
  type: EventType,
  eventHandle: EventListener
): void {
  if (elem === null || typeof elem === 'undefined') {
    return;
  }
  if (elem.addEventListener) {
    elem.addEventListener(type, eventHandle, false);
  } else if ((elem as any).attachEvent) {
    (elem as any).attachEvent('on' + type, eventHandle);
  } else {
    (elem as any)['on' + type] = eventHandle;
  }
}

export function removeEvent(
  elem: HTMLElement | null | undefined,
  type: EventType,
  eventHandle: EventListener
): void {
  if (elem === null || typeof elem === 'undefined') {
    return;
  }
  if (elem.removeEventListener) {
    elem.removeEventListener(type, eventHandle, false);
  } else if ((elem as any).detachEvent) {
    (elem as any).detachEvent('on' + type, eventHandle);
  } else {
    (elem as any)['on' + type] = null;
  }
}
