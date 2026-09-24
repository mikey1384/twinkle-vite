import { markWebsiteAgentAction } from './websiteAgentAction';

// What Zero or Ciel "see" when they look at the user's page: its headings,
// text, and the things a person could tap or type into, each tagged with a
// ref the agent can point at. Nothing is changed on the page except the
// data-agent-ref tags, which are replaced on every look.

const ROOT_SELECTORS = ['#outer-layer', '#modal', '#react-view'];
const REF_ATTRIBUTE = 'data-agent-ref';
// Marks the XP and coin activities (games, the daily question, missions...):
// Zero and Ciel may show them but never tap or type inside them.
export const WEBSITE_AGENT_NO_PLAY_ATTRIBUTE = 'data-agent-no-play';
// Marks activities Zero and Ciel may guide through step by step (looking,
// pointing, opening things) where every answer is typed and submitted by the
// user (missions, Mikey 2026-09-23).
export const WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE = 'data-agent-guide-only';
// The agent's own spotlight never shows up in what it sees.
export const WEBSITE_AGENT_UI_ATTRIBUTE = 'data-website-agent-ui';
const MAX_ELEMENTS = 220;
const MAX_NAME_CHARS = 90;
const MAX_TEXT_CHARS = 3500;

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="option"]'
].join(',');

function collapse(text: string | null | undefined, max = MAX_NAME_CHARS) {
  const value = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function isRendered(element: Element) {
  if (element.closest(`[${WEBSITE_AGENT_UI_ATTRIBUTE}]`)) return false;
  if (element.closest('[aria-hidden="true"]')) return false;
  const rect = element.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity) > 0.05
  );
}

// Where on the screen a box sits, in words ("bottom right"), so Zero or
// Ciel can tell someone where to look.
export function describeScreenPosition(rect: DOMRect) {
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const vertical =
    y < window.innerHeight / 3
      ? 'top'
      : y > (window.innerHeight * 2) / 3
        ? 'bottom'
        : 'middle';
  const horizontal =
    x < window.innerWidth / 3
      ? 'left'
      : x > (window.innerWidth * 2) / 3
        ? 'right'
        : 'center';
  return vertical === 'middle' && horizontal === 'center'
    ? 'center'
    : `${vertical} ${horizontal}`;
}

// What Zero or Ciel themselves are showing on the page right now (a yes/no
// prompt or a spotlight), with where it is and its buttons.
export function describeWebsiteAgentOverlays() {
  const lines: string[] = [];
  for (const box of document.querySelectorAll(
    `[${WEBSITE_AGENT_UI_ATTRIBUTE}][role="alertdialog"], [${WEBSITE_AGENT_UI_ATTRIBUTE}] [role="dialog"]`
  )) {
    const rect = box.getBoundingClientRect();
    if (rect.width < 2) continue;
    const buttons = [...box.querySelectorAll('button')]
      .map((button) => `"${collapse(button.textContent, 40)}"`)
      .join(', ');
    const kind =
      box.getAttribute('role') === 'alertdialog'
        ? 'a yes/no question from you'
        : 'your spotlight caption';
    lines.push(
      `${kind} at the ${describeScreenPosition(rect)} of the screen: "${collapse(
        (box as HTMLElement).innerText,
        200
      )}" (buttons: ${buttons}; the main button is blue)`
    );
  }
  return lines.join('\n');
}

function isInViewport(element: Element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

// A window's text as a screen reader gives it: a labelled group (a Wordle
// row, a chart) reads as its label, which says what colours and icons only
// show; buttons and fields are left out since they are listed on their own.
const LABELLED_ROLES = new Set(['group', 'img', 'status', 'row', 'meter']);
function accessibleText(root: Element) {
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) parts.push(node.textContent);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (element.getAttribute('aria-hidden') === 'true') return;
    // Wrappers can have no size of their own, so only hidden ones are
    // skipped here.
    if (element.closest(`[${WEBSITE_AGENT_UI_ATTRIBUTE}]`)) return;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    if (element.matches(INTERACTIVE_SELECTOR)) return;
    const label = element.getAttribute('aria-label');
    if (label && LABELLED_ROLES.has(element.getAttribute('role') || '')) {
      parts.push(label);
      return;
    }
    element.childNodes.forEach(walk);
  };
  walk(root);
  return parts.join(' ');
}

// How many buttons, links and fields a box on screen would hide, not counting
// the element being pointed at or Zero and Ciel's own cards.
export function countControlsUnder(
  box: { top: number; left: number; width: number; height: number },
  except: Element
) {
  let count = 0;
  for (const control of document.querySelectorAll(INTERACTIVE_SELECTOR)) {
    if (control === except || except.contains(control)) continue;
    if (control.closest(`[${WEBSITE_AGENT_UI_ATTRIBUTE}]`)) continue;
    const rect = control.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    if (
      rect.left < box.left + box.width &&
      rect.left + rect.width > box.left &&
      rect.top < box.top + box.height &&
      rect.top + rect.height > box.top
    ) {
      count += 1;
    }
  }
  return count;
}

// On screen but under something else (an open menu, drawer or dialog): the
// user can't see or tap it until that closes. Zero and Ciel's own prompts
// and spotlights don't count.
export function isCoveredOnScreen(element: Element) {
  if (!isInViewport(element)) return false;
  const rect = element.getBoundingClientRect();
  const x = Math.min(
    Math.max(rect.left + rect.width / 2, 0),
    window.innerWidth - 1
  );
  const y = Math.min(
    Math.max(rect.top + rect.height / 2, 0),
    window.innerHeight - 1
  );
  const hits = document.elementsFromPoint(x, y);
  const top = hits.find(
    (hit) => !hit.closest(`[${WEBSITE_AGENT_UI_ATTRIBUTE}]`)
  );
  return !!top && !element.contains(top) && !top.contains(element);
}

// Many of the website's controls are styled divs with click handlers; a
// pointer cursor on the outermost such element marks them as tappable.
function isPointerTarget(element: Element) {
  if (window.getComputedStyle(element).cursor !== 'pointer') return false;
  const parent = element.parentElement;
  return !parent || window.getComputedStyle(parent).cursor !== 'pointer';
}

function describeKind(element: Element) {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute('role');
  if (role) return role;
  if (tag === 'a') return 'link';
  if (tag === 'button') return 'button';
  if (tag === 'select') return 'dropdown';
  if (tag === 'textarea' || element.getAttribute('contenteditable'))
    return 'text box';
  if (tag === 'input') {
    const type = (element as HTMLInputElement).type || 'text';
    return type === 'checkbox' || type === 'radio' ? type : `${type} field`;
  }
  return 'clickable';
}

function describeName(element: Element) {
  const input = element as HTMLInputElement;
  return collapse(
    element.getAttribute('aria-label') ||
      (element as HTMLElement).innerText ||
      element.getAttribute('title') ||
      input.placeholder ||
      element.querySelector('img')?.getAttribute('alt') ||
      iconName(element) ||
      ''
  );
}

// A button that is only an icon (the ✓ that saves a bio, a pencil, a trash
// can) is named by its icon, or the agent could never find it.
function iconName(element: Element) {
  const icon = element
    .querySelector('svg[data-icon]')
    ?.getAttribute('data-icon');
  return icon ? `${icon.replace(/-/g, ' ')} icon` : '';
}

function hasSameNamedControlInside(element: Element, name: string) {
  for (const inner of element.querySelectorAll(INTERACTIVE_SELECTOR)) {
    if (inner !== element && describeName(inner) === name) return true;
  }
  return false;
}

const NEAR_SLOT = '\u0000near\u0000';

// A short label ("Edit", "More") says little on its own: the text around it
// tells two of them apart (the Edit under a bio, the Edit beside an email).
const SHORT_NAME_CHARS = 14;
const NEARBY_TEXT_CHARS = 50;
const MAX_NEARBY_BLOCK_CHARS = 240;
function describeNearbyText(element: Element, name: string) {
  if (name.length > SHORT_NAME_CHARS) return '';
  let ancestor = element.parentElement;
  for (let depth = 0; ancestor && depth < 4; depth += 1) {
    const around = ((ancestor as HTMLElement).innerText || '')
      .split(name)
      .join(' ');
    // Past a small block the text is the whole page, not its neighbours.
    if (around.length > MAX_NEARBY_BLOCK_CHARS) return '';
    const text = collapse(around, NEARBY_TEXT_CHARS);
    if (text.length >= 3) return text;
    ancestor = ancestor.parentElement;
  }
  return '';
}

// What each ref pointed at, so the same element can be found again after
// the page redraws it (a new node with the same label in the same place).
interface RefFingerprint {
  tag: string;
  name: string;
  x: number;
  y: number;
}
const refFingerprints = new Map<string, RefFingerprint>();
const MAX_FINGERPRINTS = 2000;
// A ref stays with its element across readings and a number is never
// reused, so a ref from an earlier look either still means the same thing
// or is reported gone (never silently another button).
let lastRefNumber = 0;
// How far a redrawn element may have moved and still count as the same one.
const REDRAWN_MAX_DISTANCE = 160;

// The window the user sees on top: the last open dialog that is rendered.
function topOpenWindow() {
  const open = Array.from(
    document.querySelectorAll('#modal [aria-modal="true"]')
  ).filter((element) => isRendered(element));
  return open[open.length - 1] || null;
}

export function readWebsiteAgentPage() {
  const roots = ROOT_SELECTORS.map((selector) =>
    document.querySelector(selector)
  ).filter((root): root is Element => !!root);
  const lines: string[] = [];
  const listed: { line: number; element: Element; name: string }[] = [];
  let refCount = 0;
  let omitted = 0;
  for (const root of roots) {
    const candidates = root.querySelectorAll('*');
    for (const element of candidates) {
      const tag = element.tagName.toLowerCase();
      const heading = /^h[1-4]$/.test(tag);
      const interactive =
        element.matches(INTERACTIVE_SELECTOR) || isPointerTarget(element);
      if (!heading && !interactive) continue;
      if (!isRendered(element)) continue;
      const name = describeName(element);
      if (heading) {
        if (name) lines.push(`${'#'.repeat(Number(tag[1]))} ${name}`);
        continue;
      }
      // A nameless wrapper tells the agent nothing; fields stay even unlabeled.
      const isField = element.matches(
        'input, textarea, select, [contenteditable="true"]'
      );
      if (!name && !isField) continue;
      // A wrapper around one link or button of the same name is listed once,
      // as that link or button.
      if (!isField && hasSameNamedControlInside(element, name)) continue;
      if (refCount >= MAX_ELEMENTS) {
        // Enough to act on; the rest is only counted (reading more costs
        // the user's page on long feeds).
        omitted += 1;
        if (omitted > MAX_ELEMENTS) break;
        continue;
      }
      refCount += 1;
      const ref =
        element.getAttribute(REF_ATTRIBUTE) || `r${(lastRefNumber += 1)}`;
      element.setAttribute(REF_ATTRIBUTE, ref);
      const box = element.getBoundingClientRect();
      refFingerprints.delete(ref);
      if (refFingerprints.size >= MAX_FINGERPRINTS) {
        refFingerprints.delete(refFingerprints.keys().next().value!);
      }
      refFingerprints.set(ref, {
        tag,
        name,
        x: box.left + box.width / 2 + window.scrollX,
        y: box.top + box.height / 2 + window.scrollY
      });
      const href =
        tag === 'a' ? (element as HTMLAnchorElement).getAttribute('href') : '';
      const state = [
        isInViewport(element)
          ? `in view, ${describeScreenPosition(element.getBoundingClientRect())}`
          : 'scroll to see',
        isCoveredOnScreen(element) ? 'covered by something on top' : '',
        (element as HTMLButtonElement).disabled ? 'disabled' : '',
        (element as HTMLInputElement).checked ? 'checked' : ''
      ]
        .filter(Boolean)
        .join(', ');
      const noPlay = asksForCredentials(element)
        ? ', password or code: only the user'
        : element.closest(`[${WEBSITE_AGENT_NO_PLAY_ATTRIBUTE}]`)
          ? isTab(element)
            ? ', tab inside an XP activity: you may switch to it'
            : ', inside an XP activity: the user plays it'
          : element.closest(`[${WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE}]`)
            ? ', guide only: the user types and submits'
            : '';
      listed.push({ line: lines.length, element, name });
      lines.push(
        `[${ref}] ${describeKind(element)} "${name}"${NEAR_SLOT}${
          href ? ` -> ${href}` : ''
        } (${state}${noPlay})`
      );
    }
  }
  // Only a label that appears more than once needs its surroundings.
  const nameCounts = new Map<string, number>();
  for (const { name } of listed) {
    const key = name.toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  }
  for (const { line, element, name } of listed) {
    const near =
      (nameCounts.get(name.toLowerCase()) || 0) > 1
        ? describeNearbyText(element, name)
        : '';
    lines[line] = lines[line].replace(NEAR_SLOT, near ? ` near "${near}"` : '');
  }
  // An open window (a game, a dialog) sits on top of the page, so its text
  // (Wordle's letters, a question) comes first. Only the window on top is
  // read: other windows mounted there (hidden, closing, or underneath) could
  // otherwise use up the room before it, and Wordle's guesses went unseen.
  const windowText = collapse(
    accessibleText(topOpenWindow() || document.createElement('div')),
    MAX_TEXT_CHARS
  );
  const mainText = collapse(
    (document.querySelector('#react-view') as HTMLElement | null)?.innerText,
    Math.max(500, MAX_TEXT_CHARS - windowText.length)
  );
  return {
    path: `${window.location.pathname}${window.location.search}`,
    title: document.title,
    elements: lines.join('\n'),
    ...(omitted ? { moreElementsNotListed: omitted } : {}),
    ...(windowText ? { openWindowText: windowText } : {}),
    text: mainText
  };
}

export function findWebsiteAgentElement(ref: string) {
  if (!/^r\d+$/.test(ref)) return null;
  const fingerprint = refFingerprints.get(ref);
  const tagged = document.querySelector(`[${REF_ATTRIBUTE}="${ref}"]`);
  // React reuses nodes (a list slot now showing another post, Follow
  // turning into Unfollow): the tag only counts while the label matches.
  if (
    tagged &&
    !tagged.closest(`[${WEBSITE_AGENT_UI_ATTRIBUTE}]`) &&
    (!fingerprint || describeName(tagged) === fingerprint.name)
  ) {
    return tagged;
  }
  tagged?.removeAttribute(REF_ATTRIBUTE);
  if (!fingerprint || !fingerprint.name) return null;
  let best: Element | null = null;
  let bestDistance = REDRAWN_MAX_DISTANCE;
  for (const candidate of document.querySelectorAll(fingerprint.tag)) {
    // Another listed element is not this one redrawn.
    if (candidate.hasAttribute(REF_ATTRIBUTE)) continue;
    if (!isRendered(candidate) || describeName(candidate) !== fingerprint.name)
      continue;
    const box = candidate.getBoundingClientRect();
    const distance = Math.hypot(
      box.left + box.width / 2 + window.scrollX - fingerprint.x,
      box.top + box.height / 2 + window.scrollY - fingerprint.y
    );
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  best?.setAttribute(REF_ATTRIBUTE, ref);
  return best;
}

const CONSEQUENTIAL_LABEL =
  /\b(send|post|submit|publish|delete|remove|save|confirm|buy|purchase|pay|claim|reward|upload|apply|approve|reject|decline|accept|join|leave|follow|unfollow|like|unlike|block|report|sell|bid|share|merge|create|update|transfer|invite|kick|ban|donate|gift|give|offer|spend|spin|roll|summon|burn|generate|upgrade|unlock|collect|reveal|redeem|challenge|vote|rate|subscribe|mint|trade|yes|ok|okay|done|continue|agree|check icon|paper plane icon|trash alt icon|trash icon)\b/i;

function looksConsequential(element: Element) {
  const label = [
    describeName(element),
    element.getAttribute('aria-label'),
    element.getAttribute('title'),
    (element as HTMLInputElement).value
  ]
    .filter(Boolean)
    .join(' ');
  const submits =
    (element as HTMLButtonElement).type === 'submit' &&
    !!element.closest('form');
  return submits || CONSEQUENTIAL_LABEL.test(label);
}

const CREDENTIAL_FIELD_SELECTOR =
  'input[type="password"], input[autocomplete="current-password"], input[autocomplete="new-password"], input[autocomplete="one-time-code"]';

// Passwords and codes are the user's alone: nothing in a form or dialog that
// asks for one is touched by the agent.
function asksForCredentials(element: Element) {
  if (element.matches(CREDENTIAL_FIELD_SELECTOR)) return true;
  const container = element.closest(
    'form, [role="dialog"], [aria-modal="true"]'
  );
  return !!container?.querySelector(CREDENTIAL_FIELD_SELECTOR);
}

function refusedInsideXpActivity(element: Element) {
  if (asksForCredentials(element)) {
    return {
      ok: false,
      error:
        'This asks for their password or a code. Only the user can do this; tell them how and leave it to them.'
    };
  }
  return element.closest(`[${WEBSITE_AGENT_NO_PLAY_ATTRIBUTE}]`)
    ? {
        ok: false,
        error:
          'This is inside an XP activity. The user plays and answers it themselves; explain or point instead.'
      }
    : null;
}

const DISMISS_LABEL =
  /^(close|cancel|not now|no thanks|back|x|×|✕|xmark icon|times icon|circle xmark icon)$/i;

// Switching tabs (Game / Rankings / Review) moves around an activity without
// playing it.
function isTab(element: Element) {
  return !!element.closest('[data-agent-tabs], [role="tablist"], [role="tab"]');
}

function isDismissControl(element: Element) {
  return DISMISS_LABEL.test(describeName(element));
}

function settle(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A tap by Zero or Ciel, as the user would make it.
export async function performWebsiteAgentClick({
  ref,
  effect
}: {
  ref: string;
  effect: 'view' | 'change';
}) {
  const element = findWebsiteAgentElement(ref);
  if (!element) {
    return { ok: false, error: 'That element is gone. Read the page again.' };
  }
  // Closing a window is never the user's work to protect, and a window
  // opened by mistake must not trap the agent.
  const refused =
    isDismissControl(element) || (effect === 'view' && isTab(element))
      ? null
      : refusedInsideXpActivity(element);
  if (refused) return refused;
  // Guiding only: moving around (links, tabs, closing) is fine; any other
  // tap could choose or submit an answer.
  if (
    element.closest(`[${WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE}]`) &&
    (effect === 'change' ||
      !(
        element.matches('a[href]') ||
        isTab(element) ||
        isDismissControl(element)
      ))
  ) {
    return {
      ok: false,
      error:
        'Here you guide only: the user makes every answer and submission themselves. Point at it and explain instead.'
    };
  }
  if (effect === 'view' && looksConsequential(element)) {
    return {
      ok: false,
      error: `"${describeName(element)}" looks like it changes something. Tap it with effect "change", which needs the user's permission.`
    };
  }
  if ((element as HTMLButtonElement).disabled) {
    return { ok: false, error: 'That element is disabled right now.' };
  }
  markWebsiteAgentAction();
  element.scrollIntoView({ block: 'center' });
  const init = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new PointerEvent('pointerdown', init));
  element.dispatchEvent(new MouseEvent('mousedown', init));
  element.dispatchEvent(new PointerEvent('pointerup', init));
  element.dispatchEvent(new MouseEvent('mouseup', init));
  (element as HTMLElement).click();
  markWebsiteAgentAction();
  await settle(800);
  return {
    ok: true,
    path: `${window.location.pathname}${window.location.search}`,
    note: 'Read the page to see what changed.'
  };
}

// Typing by Zero or Ciel into a field, replacing what is there.
export async function performWebsiteAgentType({
  ref,
  text,
  pressEnter
}: {
  ref: string;
  text: string;
  pressEnter: boolean;
}) {
  const element = findWebsiteAgentElement(ref) as HTMLElement | null;
  if (!element) {
    return { ok: false, error: 'That field is gone. Read the page again.' };
  }
  const refused = refusedInsideXpActivity(element);
  if (refused) return refused;
  if (element.closest(`[${WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE}]`)) {
    return {
      ok: false,
      error:
        'Here the user types their own answers. Point at the field and explain what to write instead.'
    };
  }
  markWebsiteAgentAction();
  element.scrollIntoView({ block: 'center' });
  element.focus();
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    // React tracks the value itself; set it through the native setter so
    // the change registers as if typed.
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element),
      'value'
    )?.set;
    setter?.call(element, text);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.isContentEditable) {
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, text);
  } else {
    return { ok: false, error: 'That is not a field you can type into.' };
  }
  if (pressEnter) {
    for (const type of ['keydown', 'keypress', 'keyup']) {
      element.dispatchEvent(
        new KeyboardEvent(type, {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true
        })
      );
    }
  }
  markWebsiteAgentAction();
  await settle(pressEnter ? 800 : 150);
  return { ok: true };
}
