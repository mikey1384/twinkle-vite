// Whether Zero or Ciel's floating chat window is up. Their acting on the
// page (taking the user somewhere, opening something, pointing) brings it up,
// so the user can keep talking to them on that screen; the user's close puts
// it away until they act again.
let dockAssistant: 'Zero' | 'Ciel' | null = null;
const listeners = new Set<() => void>();

function set(next: 'Zero' | 'Ciel' | null) {
  if (dockAssistant === next) return;
  dockAssistant = next;
  listeners.forEach((listener) => listener());
}

export function openAssistantDock(assistant: 'Zero' | 'Ciel') {
  set(assistant);
}

export function closeAssistantDock() {
  set(null);
}

export function subscribeAssistantDock(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAssistantDock() {
  return dockAssistant;
}
