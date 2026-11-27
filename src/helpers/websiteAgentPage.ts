import { markWebsiteAgentAction } from './websiteAgentAction';
import { releaseScrollAnchorTopPin } from './scrollAnchorRestorationCoordinator';

// What Zero or Ciel "see" when they look at the user's page: its headings,
// text, and the things a person could tap or type into, each tagged with a
// ref the agent can point at. Nothing is changed on the page except the
// data-agent-ref tags, which are replaced on every look.

import { readAgentScreenState } from './websiteAgentScreenState';
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
// Marks the part of the screen a component already reports exactly in its
// screenState (a Wordle's board and keyboard): the page read skips it, so
// Zero and Ciel get that state once, clean, not the tiles' letters too.
export const WEBSITE_AGENT_STATE_SHOWN_ATTRIBUTE = 'data-agent-state-shown';
// Marks what Zero and Ciel must not help with (an AI Story's text and its
// questions, which the user reads and answers alone; a live solo Arena
// mastery paper): never read at all, never tapped or typed into. Its value names
// what it is, and read_page says which are on screen (offLimits), so the
// agent can tell the user why.
export const WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE = 'data-agent-off-limits';
const SKIPPED_SELECTOR = `[${WEBSITE_AGENT_STATE_SHOWN_ATTRIBUTE}], [${WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE}]`;
const MAX_ELEMENTS = 220;
const MAX_NAME_CHARS = 90;
const MAX_TEXT_CHARS = 3500;
const TYPED_VALUE_MAX_CHARS = 400;

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
function accessibleText(root: Element, maxChars = Infinity) {
  const parts: string[] = [];
  let length = 0;
  const walk = (node: Node) => {
    // Enough read: a long feed stops here instead of styling every post.
    if (length > maxChars) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) {
        parts.push(node.textContent);
        length += node.textContent.length;
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (element.getAttribute('aria-hidden') === 'true') return;
    // Wrappers can have no size of their own, so only hidden ones are
    // skipped here.
    if (element.closest(`[${WEBSITE_AGENT_UI_ATTRIBUTE}]`)) return;
    if (element.matches(SKIPPED_SELECTOR)) return;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    if (element.matches(INTERACTIVE_SELECTOR)) return;
    // A clickable's short text is already its name in the elements list.
    if (
      style.cursor === 'pointer' &&
      isPointerTarget(element) &&
      ((element as HTMLElement).innerText || '').length <= MAX_NAME_CHARS
    ) {
      return;
    }
    // Pictures that carry meaning (a chess piece, an icon with a name).
    if (element.tagName === 'IMG') {
      const alt = element.getAttribute('alt')?.trim();
      if (alt) parts.push(alt);
      return;
    }
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

function isContentEditableElement(element: Element) {
  const attr = element.getAttribute('contenteditable');
  return attr === 'true' || attr === '';
}

function describeName(element: Element) {
  const input = element as HTMLInputElement;
  const isContentEditable = isContentEditableElement(element);
  return collapse(
    element.getAttribute('aria-label') ||
      (isContentEditable ? '' : (element as HTMLElement).innerText) ||
      element.getAttribute('title') ||
      input.placeholder ||
      element.getAttribute('data-placeholder') ||
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

function readNearbyAncestorText(ancestor: Element) {
  // Unlike <input>/<textarea>, a contenteditable element's typed text sits
  // inside ancestor.innerText. Skip contenteditable subtrees when present so
  // typing never mutates nearby fingerprints.
  if (
    !isContentEditableElement(ancestor) &&
    !ancestor.querySelector('[contenteditable="true"], [contenteditable=""]')
  ) {
    return (ancestor as HTMLElement).innerText || '';
  }
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) parts.push(node.textContent);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (isContentEditableElement(el)) return;
    if (el.getAttribute('aria-hidden') === 'true') return;
    if (el.hasAttribute(WEBSITE_AGENT_UI_ATTRIBUTE)) return;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    el.childNodes.forEach(walk);
  };
  walk(ancestor);
  return parts.join(' ');
}

function describeNearbyText(element: Element, name: string) {
  if (name.length > SHORT_NAME_CHARS) return '';
  let ancestor = element.parentElement;
  for (let depth = 0; ancestor && depth < 4; depth += 1) {
    const raw = readNearbyAncestorText(ancestor);
    const around = name ? raw.split(name).join(' ') : raw;
    // Past a small block the text is the whole page, not its neighbours.
    if (around.length > MAX_NEARBY_BLOCK_CHARS) return '';
    const text = collapse(around, NEARBY_TEXT_CHARS);
    if (text.length >= 3) return text;
    ancestor = ancestor.parentElement;
  }
  return '';
}

// Identity at the last read. Replaced nodes receive new refs; stale actions
// return a fresh page instead of guessing by label or screen position.
// `nearby` is recorded for duplicate short labels and consequential controls
// so live text updates (timers, chat messages, badge counts) in ancestor
// containers do not falsely invalidate unique non-consequential controls while
// reused consequential buttons still detect in-place target swaps.
interface RefFingerprint {
  element: Element;
  tag: string;
  name: string;
  path: string;
  nearby: string | null;
  href: string | null;
}
const refFingerprints = new Map<string, RefFingerprint>();
const MAX_FINGERPRINTS = 2000;
// A ref stays with its element across readings and a number is never
// reused, so a ref from an earlier look either still means the same thing
// or is reported gone (never silently another button).
let lastRefNumber = 0;
export const WEBSITE_AGENT_PAGE_ID = createPageId();
let pageGeneration = 0;

// Evaluated when the app loads (AssistantDock imports this file), so it must
// not throw: randomUUID exists only in secure contexts and from Safari 15.4,
// while the build still targets Safari 14. getRandomValues has neither limit.
function createPageId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
let lastPageIdentity = '';

// The window the user sees on top: the last open dialog that is rendered.
function topOpenWindow() {
  const open = Array.from(
    document.querySelectorAll('#modal [aria-modal="true"]')
  ).filter((element) => isRendered(element));
  return open[open.length - 1] || null;
}

export function readWebsiteAgentPage() {
  // An open window (a game, a dialog) is all the user can use until it
  // closes, so only it is read; the page behind it is left out.
  const openWindow = topOpenWindow();
  const roots = openWindow
    ? [openWindow]
    : ROOT_SELECTORS.map((selector) => document.querySelector(selector)).filter(
        (root): root is Element => !!root
      );
  const lines: string[] = [];
  const listed: { line: number; ref: string; element: Element; name: string }[] = [];
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
      if (element.closest(SKIPPED_SELECTOR)) continue;
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
      const previousRef = element.getAttribute(REF_ATTRIBUTE);
      const old = previousRef ? refFingerprints.get(previousRef) : null;
      const same =
        old &&
        old.element === element &&
        old.tag === tag &&
        old.name === name &&
        old.path === window.location.pathname + window.location.search &&
        (old.nearby === null || old.nearby === describeNearbyText(element, name)) &&
        old.href === element.getAttribute('href');
      const ref =
        (same ? previousRef : null) ||
        `r${WEBSITE_AGENT_PAGE_ID}_${(lastRefNumber += 1)}`;
      element.setAttribute(REF_ATTRIBUTE, ref);
      refFingerprints.delete(ref);
      if (refFingerprints.size >= MAX_FINGERPRINTS) {
        refFingerprints.delete(refFingerprints.keys().next().value!);
      }
      refFingerprints.set(ref, {
        element,
        tag,
        name,
        path: window.location.pathname + window.location.search,
        nearby: null,
        href: element.getAttribute('href')
      });
      const href =
        tag === 'a' ? (element as HTMLAnchorElement).getAttribute('href') : '';
      const state = [
        isInViewport(element)
          ? describeScreenPosition(element.getBoundingClientRect())
          : 'offscreen',
        isCoveredOnScreen(element) ? 'covered by something on top' : '',
        (element as HTMLButtonElement).disabled ? 'disabled' : '',
        (element as HTMLInputElement).checked ? 'checked' : '',
        // a toggle or radio that is on (a marked answer, a chosen mode)
        ['aria-pressed', 'aria-checked', 'aria-selected'].some(
          (name) => element.getAttribute(name) === 'true'
        )
          ? 'selected'
          : ''
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
      // What the user has typed so far (a draft, a guess, a prompt), never
      // a password or code.
      const typed =
        isField && !element.matches(CREDENTIAL_FIELD_SELECTOR)
          ? collapse(
              (element as HTMLInputElement).value ??
                (element as HTMLElement).innerText,
              TYPED_VALUE_MAX_CHARS
            )
          : '';
      listed.push({ line: lines.length, ref, element, name });
      lines.push(
        `[${ref}] ${describeKind(element)} "${name}"${NEAR_SLOT}${
          href ? ` -> ${href}` : ''
        }${typed ? ` typed "${typed}"` : ''} (${state}${noPlay})`
      );
    }
  }
  // Only a label that appears more than once needs its surroundings.
  const nameCounts = new Map<string, number>();
  for (const { name } of listed) {
    const key = name.toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  }
  for (const { line, ref, element, name } of listed) {
    const duplicate = (nameCounts.get(name.toLowerCase()) || 0) > 1;
    const trackNearby = duplicate || looksConsequential(element);
    const near = trackNearby ? describeNearbyText(element, name) : '';
    if (trackNearby) {
      const fingerprint = refFingerprints.get(ref);
      if (fingerprint) fingerprint.nearby = near;
    }
    lines[line] = lines[line].replace(
      NEAR_SLOT,
      duplicate && near ? ` near "${near}"` : ''
    );
  }
  // With a window open, its text is the page's text (only the window on
  // top: others mounted there are hidden, closing, or underneath).
  // Text only: buttons, links and fields are already listed above.
  const windowText = openWindow
    ? collapse(accessibleText(openWindow, MAX_TEXT_CHARS), MAX_TEXT_CHARS)
    : '';
  const mainView = document.querySelector('#react-view');
  const mainText =
    openWindow || !mainView
      ? ''
      : collapse(accessibleText(mainView, MAX_TEXT_CHARS), MAX_TEXT_CHARS);
  const screenState = readAgentScreenState({ windowOpen: !!openWindow });
  const offLimits = [
    ...new Set(
      Array.from(
        document.querySelectorAll(`[${WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE}]`)
      )
        .filter((element) => isRendered(element))
        .map((element) =>
          String(element.getAttribute(WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE) || '')
        )
        .filter(Boolean)
    )
  ];
  const pageIdentity = JSON.stringify([
    window.location.pathname,
    window.location.search,
    lines
  ]);
  if (pageIdentity !== lastPageIdentity) {
    pageGeneration++;
    lastPageIdentity = pageIdentity;
  }
  return {
    pageId: WEBSITE_AGENT_PAGE_ID,
    pageGeneration,
    // Exact state components on screen report (a Wordle's guesses and
    // colours), first: trust it over reading the page text.
    ...(screenState ? { screenState } : {}),
    path: `${window.location.pathname}${window.location.search}`,
    title: document.title,
    elements: lines.join('\n'),
    ...(omitted ? { moreElementsNotListed: omitted } : {}),
    ...(windowText ? { openWindowText: windowText } : {}),
    ...(openWindow ? { pageBehindWindow: 'left out' } : {}),
    // what is left out because it is the user's alone (aiStory, arenaBattle)
    ...(offLimits.length ? { offLimits } : {}),
    // Counts only, for Zero/Ciel's telemetry: which kind of screen answered
    // and how much of an open window it read.
    diagnostics: {
      phone: /Mobi|iPhone|Android/i.test(navigator.userAgent),
      openWindows: document.querySelectorAll('#modal [aria-modal="true"]')
        .length,
      windowTextChars: windowText.length
    },
    ...(mainText ? { text: mainText } : {})
  };
}

export function findWebsiteAgentElement(ref: string) {
  if (!new RegExp(`^r${WEBSITE_AGENT_PAGE_ID}_\\d+$`).test(ref)) return null;
  const fingerprint = refFingerprints.get(ref);
  const tagged = document.querySelector(`[${REF_ATTRIBUTE}="${ref}"]`);
  // Never guess by label/distance: repeated Save/Edit buttons can belong to
  // different posts. Re-read a replacement page and resolve its new refs.
  if (
    !fingerprint ||
    !tagged ||
    fingerprint.element !== tagged ||
    tagged.closest(`[${WEBSITE_AGENT_UI_ATTRIBUTE}]`) ||
    !isRendered(tagged)
  )
    return null;
  if (
    fingerprint.path !== window.location.pathname + window.location.search ||
    fingerprint.tag !== tagged.tagName.toLowerCase() ||
    fingerprint.name !== describeName(tagged) ||
    (fingerprint.nearby !== null &&
      fingerprint.nearby !== describeNearbyText(tagged, fingerprint.name)) ||
    fingerprint.href !== tagged.getAttribute('href')
  )
    return null;
  return tagged;
}

const CONSEQUENTIAL_LABEL =
  /\b(send|post|submit|publish|delete|remove|save|confirm|buy|purchase|pay|claim|reward|upload|apply|approve|reject|decline|accept|join|leave|follow|unfollow|like|unlike|block|report|sell|bid|share|merge|create|update|transfer|invite|kick|ban|donate|gift|give|offer|spend|spin|roll|summon|burn|generate|upgrade|unlock|collect|reveal|redeem|challenge|vote|rate|subscribe|mint|trade|yes|ok|okay|done|continue|agree|check icon|paper plane icon|trash alt icon|trash icon)\b/i;

// Only plain same-site path navigation links are view-only without label
// checks: `#` fragments, `javascript:`, `mailto:`, `download`, external
// origins, `target="_blank"`, and `role="button"` links can trigger actions
// or leave the site and still go through consequential checks.
function isPlainSameSiteNavigationLink(element: Element) {
  if (
    element.tagName.toLowerCase() !== 'a' ||
    element.getAttribute('role') === 'button' ||
    element.hasAttribute('download')
  ) {
    return false;
  }
  const target = (element.getAttribute('target') || '').trim().toLowerCase();
  if (target && target !== '_self') return false;
  const href = (element.getAttribute('href') || '').trim();
  if (!href || href.startsWith('#')) return false;
  let resolved: URL;
  try {
    resolved = new URL(href, window.location.href);
  } catch {
    return false;
  }
  if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
    return false;
  }
  if (resolved.origin !== window.location.origin) return false;
  if (
    resolved.pathname === window.location.pathname &&
    resolved.search === window.location.search &&
    Boolean(resolved.hash)
  ) {
    return false;
  }
  return true;
}

export function looksConsequential(element: Element) {
  const submits =
    (element as HTMLButtonElement).type === 'submit' &&
    !!element.closest('form');
  if (submits) return true;
  // Switching tabs or following a plain same-site navigation link only changes
  // the view.
  if (isTab(element) || isPlainSameSiteNavigationLink(element)) return false;
  const label = [
    describeName(element),
    element.getAttribute('aria-label'),
    element.getAttribute('title'),
    (element as HTMLInputElement).value
  ]
    .filter(Boolean)
    .join(' ');
  return CONSEQUENTIAL_LABEL.test(label);
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

const OFF_LIMITS_REFUSAL: Record<string, string> = {
  arenaToday:
    'Today’s Challenge earns a personal daily learning reward. The user answers the question, lesson interactions and understanding check themselves. You can review it together once completed.',
  arenaBattle:
    'This is a solo Arena mastery run. Offer to go through this paper together after the member submits it. Ordinary exams allow your help.',
  // a timed rematch in Train (Mikey 11-01): the member's own race against
  // their first attempt on this paper
  arenaRematch:
    'This is a timed rematch: the member is racing their own first attempt on the clock. Offer to go through it together after they submit it. Re-sits and untimed rematches allow your help.'
};

function refusedInsideXpActivity(element: Element) {
  const offLimits = element.closest(`[${WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE}]`);
  if (offLimits) {
    return {
      ok: false,
      error:
        OFF_LIMITS_REFUSAL[
          offLimits.getAttribute(WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE) || ''
        ] || 'This part is the user’s alone; explain instead.'
    };
  }
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
// playing it. Only the tab control itself counts: non-tab buttons or dropdowns
// placed inside a FilterBar or tablist, or action buttons nested inside a tab,
// are never treated as tabs.
function isTab(element: Element) {
  if (element.getAttribute('role') === 'tab') return true;
  if (element.matches('[data-agent-tabs] > nav')) return true;
  if (
    element.matches('[data-agent-tabs] > nav > a') &&
    isPlainSameSiteNavigationLink(element)
  ) {
    return true;
  }
  return false;
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
    return {
      ok: false,
      code: 'stale_page',
      error: 'Page changed; select a current ref from pageNow.',
      pageNow: readWebsiteAgentPage()
    };
  }
  // Closing a window is never the user's work to protect, and a window
  // opened by mistake must not trap the agent.
  // an off-limits part is never tapped, not even its close or tab buttons
  const refused =
    !element.closest(`[${WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE}]`) &&
    (isDismissControl(element) || (effect === 'view' && isTab(element)))
      ? null
      : refusedInsideXpActivity(element);
  if (refused) return refused;
  // Guiding only: moving around (links, tabs, closing) is fine; any other
  // tap could choose or submit an answer.
  if (
    element.closest(`[${WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE}]`) &&
    (effect === 'change' ||
      !(
        isPlainSameSiteNavigationLink(element) ||
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
  // A deliberate scroll: the post-navigation top pin must not undo it.
  releaseScrollAnchorTopPin();
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
    note: 'Interaction delivered. Only server receipts confirm saved changes; page text is not save evidence.'
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
    return {
      ok: false,
      code: 'stale_page',
      error: 'Page changed; select a current ref from pageNow.',
      pageNow: readWebsiteAgentPage()
    };
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
  releaseScrollAnchorTopPin();
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
