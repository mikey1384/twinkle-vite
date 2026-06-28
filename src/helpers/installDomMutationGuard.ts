import reportDomMutationEvent from '~/helpers/reportDomMutationEvent';

// Defensive compatibility guard for third-party DOM corruption.
//
// External DOM mutators — browser/in-app translators (Google Translate, NAVER
// Whale in-app webview, etc.), extensions, and webview reader modes — reparent
// or remove DOM nodes out from under React. When React's commit phase then runs
// removeChild/insertBefore against its recorded parent, the live DOM no longer
// matches the fiber tree and the browser throws:
//   "Failed to execute 'removeChild' on 'Node': The node to be removed is not a
//    child of this node"
// (and the analogous insertBefore message). This crashes the whole React subtree
// to the ErrorBoundary on a surface the user did nothing wrong on.
//
// This is NOT a magic permanent fix: by the time the guard fires, the external
// tool has ALREADY corrupted the DOM. The guard only declines to throw on top of
// that corruption — it trades a white error screen for a possible transient
// visual misorder, which is strictly the better failure mode. React's next
// reconciliation generally re-establishes a consistent tree.
//
// This is the well-precedented community/React-team fix for this crash class. It
// is browser- and tool-agnostic: it checks only the one invariant React relies
// on ("is this node actually my child right now?"), so it covers every surface
// and every mutator at once, replacing per-surface `notranslate` whack-a-mole.

const INSTALL_FLAG = '__twinkleDomMutationGuardInstalled';

// A flooding translator can trip the guard many times per second. Keep noise and
// telemetry bounded so the guard itself never becomes a performance problem.
const MAX_WARNINGS = 5;
const TELEMETRY_SAMPLE_RATE = 0.05;
const MAX_TELEMETRY_EVENTS_PER_SESSION = 20;

let warningCount = 0;
let telemetryCount = 0;

function isDisabledForTesting() {
  // Dev-only escape hatch so a single Playwright build can prove BOTH directions
  // (crash with the guard off, no-crash with it on) deterministically.
  try {
    return (
      import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      (window as any).__TWINKLE_DISABLE_DOM_GUARD__ === true
    );
  } catch {
    return false;
  }
}

function noteGuardFire(method: 'removeChild' | 'insertBefore') {
  if (warningCount < MAX_WARNINGS) {
    warningCount += 1;
    console.warn(
      `[domMutationGuard] Skipped ${method} on a node whose parent changed ` +
        `(likely a translator/extension/in-app webview). This is handled.`
    );
  }
  try {
    if (
      telemetryCount < MAX_TELEMETRY_EVENTS_PER_SESSION &&
      Math.random() < TELEMETRY_SAMPLE_RATE
    ) {
      telemetryCount += 1;
      const pathname =
        typeof window !== 'undefined' ? window.location?.pathname || '' : '';
      reportDomMutationEvent({ method, surface: pathname, pathname });
    }
  } catch {
    // Never let telemetry affect the guard.
  }
}

export default function installDomMutationGuard() {
  if (typeof Node === 'undefined' || !Node.prototype) return;
  const proto = Node.prototype as any;
  if (proto[INSTALL_FLAG]) return; // idempotent — HMR re-runs modules
  if (isDisabledForTesting()) return;
  proto[INSTALL_FLAG] = true;

  const originalRemoveChild = proto.removeChild;
  const originalInsertBefore = proto.insertBefore;

  proto.removeChild = function (child: Node) {
    // Only intercept the exact failure case: an external mutator already moved
    // or removed this node, so it is no longer our child. No-op instead of
    // throwing. Anything else (including a non-Node arg) hits the native method
    // so real bugs and the real TypeError still surface.
    if (child instanceof Node && child.parentNode !== this) {
      noteGuardFire('removeChild');
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  proto.insertBefore = function (newNode: Node, referenceNode: Node | null) {
    // If the reference node was reparented away, inserting "before" it here is
    // impossible. Fall back to appendChild so React's node still lands in the
    // tree (keeping it parented under `this`), which lets a later removeChild
    // succeed. A no-op here would instead cascade into the removeChild failure.
    //
    // Require referenceNode to be an actual Node: a truthy non-Node arg
    // (`insertBefore(node, {})`) is a genuine call bug whose native TypeError we
    // must NOT swallow — its `.parentNode` would be `undefined !== this` and
    // wrongly trip the fallback. A null/undefined reference is a valid append
    // and falls through to the native method.
    if (
      newNode instanceof Node &&
      referenceNode instanceof Node &&
      referenceNode.parentNode !== this
    ) {
      noteGuardFire('insertBefore');
      try {
        return this.appendChild(newNode);
      } catch {
        return newNode;
      }
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}
