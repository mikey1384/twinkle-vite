// The lite host's own UI, drawn on the trusted top-level page above the
// app's frame (the app can never draw over it): the "Made with Lumine"
// corner badge and its menu, the sign-in sheet, the link sheet, the report
// sheet and a toast. Plain DOM, no framework, so the host stays tiny.
import type { LiteHostConfig, SessionStore } from './session';
import type { LiteHostText } from './text';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = []
) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

let openSheet: HTMLElement | null = null;
// The badge menu registers its closer here, so a sheet (sign-in, link,
// report) always takes over from it: one overlay owns keys and focus.
let dismissMenu: (() => void) | null = null;

export function closeSheet() {
  openSheet?.remove();
  openSheet = null;
}

function sheet(content: HTMLElement[], { onDismiss }: { onDismiss?: () => void } = {}) {
  dismissMenu?.();
  closeSheet();
  const backdrop = el('div', { class: 'lh-backdrop', role: 'presentation' });
  const panel = el('div', { class: 'lh-sheet', role: 'dialog', 'aria-modal': 'true' }, content);
  backdrop.append(panel);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      closeSheet();
      onDismiss?.();
    }
  });
  document.body.append(backdrop);
  openSheet = backdrop;
  (panel.querySelector('button') as HTMLButtonElement | null)?.focus();
  return panel;
}

export function showToast(text: string, ms = 3500) {
  const toast = el('div', { class: 'lh-toast', role: 'status' }, [text]);
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), ms);
}

export function askSignIn({
  config,
  t,
  session
}: {
  config: LiteHostConfig;
  t: LiteHostText;
  session: SessionStore;
}): Promise<boolean> {
  return new Promise((resolve) => {
    const cta = el('button', { class: 'lh-primary', type: 'button' }, [t.signInCta]);
    const later = el('button', { class: 'lh-secondary', type: 'button' }, [t.notNow]);
    const panel = sheet(
      [
        el('div', { class: 'lh-sheet-mark', 'aria-hidden': 'true' }, ['✦']),
        el('h2', {}, [t.signInTitle]),
        el('p', {}, [t.signInBody(config.title)]),
        el('div', { class: 'lh-actions' }, [cta, later]),
        el('p', { class: 'lh-fine' }, [t.neverPassword])
      ],
      { onDismiss: () => resolve(false) }
    );
    panel.classList.add('lh-signin');
    cta.addEventListener('click', async () => {
      cta.setAttribute('disabled', 'true');
      const result = await session.signIn();
      closeSheet();
      resolve(Boolean(result));
    });
    later.addEventListener('click', () => {
      closeSheet();
      resolve(false);
    });
  });
}

export function confirmOutsideLink({
  t,
  host,
  blocked
}: {
  t: LiteHostText;
  host: string;
  blocked: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    const open = el('button', { class: 'lh-primary', type: 'button' }, [t.linkOpen]);
    const cancel = el('button', { class: 'lh-secondary', type: 'button' }, [t.linkCancel]);
    if (blocked) open.setAttribute('disabled', 'true');
    sheet(
      [
        el('h2', {}, [t.linkTitle(host)]),
        el('p', {}, [blocked ? t.linkBlocked : t.linkBody]),
        el('div', { class: 'lh-actions' }, blocked ? [cancel] : [open, cancel])
      ],
      { onDismiss: () => resolve(false) }
    );
    open.addEventListener('click', () => {
      closeSheet();
      resolve(true);
    });
    cancel.addEventListener('click', () => {
      closeSheet();
      resolve(false);
    });
  });
}

export function showReport({
  config,
  t,
  send
}: {
  config: LiteHostConfig;
  t: LiteHostText;
  send: (reason: string, details: string) => Promise<void>;
}) {
  const reasons = Object.entries(t.reportReasons).map(([value, label]) =>
    el('label', { class: 'lh-choice' }, [
      el('input', { type: 'radio', name: 'lh-report', value }),
      el('span', {}, [label])
    ])
  );
  const details = el('textarea', { class: 'lh-textarea', maxlength: '1000', placeholder: t.reportDetails });
  const submit = el('button', { class: 'lh-primary', type: 'button' }, [t.reportSend]);
  const cancel = el('button', { class: 'lh-secondary', type: 'button' }, [t.close]);
  sheet([
    el('h2', {}, [t.reportTitle]),
    el('p', { class: 'lh-fine' }, [config.title]),
    el('div', { class: 'lh-choices' }, reasons),
    details,
    el('div', { class: 'lh-actions' }, [submit, cancel])
  ]);
  cancel.addEventListener('click', closeSheet);
  submit.addEventListener('click', async () => {
    const chosen = document.querySelector<HTMLInputElement>('input[name="lh-report"]:checked');
    if (!chosen) return;
    submit.setAttribute('disabled', 'true');
    await send(chosen.value, (details as HTMLTextAreaElement).value).catch(() => {});
    closeSheet();
    showToast(t.reportThanks);
  });
}

// Small line icons for the menu (24px grid, drawn with currentColor).
const ICONS: Record<string, string[]> = {
  open: ['M14 4h6v6', 'M20 4l-8.5 8.5', 'M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10'],
  make: [
    'M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z',
    'M18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z'
  ],
  signOut: ['M15.5 17l5-5-5-5', 'M20.5 12H9', 'M10 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H10'],
  flag: ['M5.5 21V4.5', 'M5.5 4.5h11l-2.2 4 2.2 4h-11'],
  arrow: ['M8 16L16 8', 'M9.5 8H16v6.5'],
  // Twinkle's ✦, drawn so it looks the same in every browser's fonts.
  star: ['M12 2.5c.7 5.2 3.2 7.8 9.5 9.5-6.3 1.7-8.8 4.3-9.5 9.5-.7-5.2-3.2-7.8-9.5-9.5 6.3-1.7 8.8-4.3 9.5-9.5z']
};

function icon(name: keyof typeof ICONS, className = 'lh-icon') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ICONS[name]) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// A picture, or the name's first letter on a solid disc when there is none
// (or it fails to load).
function avatar(name: string, pictureUrl: string | null | undefined, className: string) {
  const letter = el('span', { class: `${className} lh-avatar-letter`, 'aria-hidden': 'true' }, [
    (Array.from(name.trim())[0] || '✦').toUpperCase()
  ]);
  if (!pictureUrl || !/^https:\/\/[^/\s]+\/\S*$/i.test(pictureUrl)) return letter;
  const img = el('img', { class: className, src: pictureUrl, alt: '' });
  img.addEventListener('error', () => img.replaceWith(letter), { once: true });
  return img;
}

// "Made with Lumine on Twinkle": a small corner badge that opens a menu
// (who made it, open on Twinkle, sign in/out, report). It never covers the
// app's controls for long: it shrinks to a dot after a few seconds. The menu
// is a card that grows out of the badge, drawn on this trusted page.
export function mountBadge({
  config,
  t,
  session,
  onReport,
  viewerPicture
}: {
  config: LiteHostConfig;
  t: LiteHostText;
  session: SessionStore;
  onReport: () => void;
  // The signed-in member's picture, once the host has it (else a letter).
  viewerPicture?: () => string | null;
}) {
  const badge = el('button', {
    class: 'lh-badge',
    type: 'button',
    'aria-haspopup': 'menu',
    'aria-expanded': 'false'
  }, [
    el('span', { class: 'lh-badge-mark', 'aria-hidden': 'true' }, [icon('star', 'lh-star')]),
    el('span', { class: 'lh-badge-text' }, [
      el('strong', {}, [t.madeWith]),
      el('span', {}, [` ${t.onTwinkle}`])
    ])
  ]);
  document.body.append(badge);
  let menu: { layer: HTMLElement; card: HTMLElement } | null = null;
  let closingLayer: HTMLElement | null = null;
  // The badge tucks into the edge after a few seconds, but never moves away
  // from its open menu: then it waits until the menu closes.
  let compactWaiting = false;
  window.setTimeout(() => {
    if (menu) compactWaiting = true;
    else badge.classList.add('lh-badge-compact');
  }, 4000);

  function closeMenu({ restoreFocus = true } = {}) {
    const current = menu;
    if (!current) return;
    menu = null;
    if (dismissMenu === dismiss) dismissMenu = null;
    badge.setAttribute('aria-expanded', 'false');
    badge.classList.remove('lh-badge-open');
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onViewportChange);
    window.visualViewport?.removeEventListener('resize', onViewportChange);
    window.visualViewport?.removeEventListener('scroll', onViewportChange);
    if (compactWaiting) {
      compactWaiting = false;
      badge.classList.add('lh-badge-compact');
    }
    // Out of reach at once (keys, taps, screen readers) while it fades.
    current.layer.setAttribute('inert', '');
    current.layer.setAttribute('aria-hidden', 'true');
    current.card.removeAttribute('id');
    current.card.querySelector('#lh-pop-title')?.removeAttribute('id');
    closingLayer = current.layer;
    const remove = () => {
      current.layer.remove();
      if (closingLayer === current.layer) closingLayer = null;
    };
    if (reducedMotion() || !current.card.animate) {
      remove();
    } else {
      current.layer.classList.add('lh-pop-layer-out');
      current.card
        .animate(
          [
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.86)' }
          ],
          { duration: 150, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
        )
        .finished.then(remove, remove);
    }
    if (restoreFocus) badge.focus({ preventScroll: true });
  }
  // A sheet taking over: the menu goes; the sheet owns focus from here.
  const dismiss = () => closeMenu({ restoreFocus: false });

  // After a sheet opened from the menu (sign-in, report) goes away, focus
  // comes back to the ✦ instead of being lost on the page.
  function returnFocusAfterSheet() {
    const observer = new MutationObserver(() => {
      if (document.querySelector('.lh-backdrop')) return;
      observer.disconnect();
      if (!menu && (!document.activeElement || document.activeElement === document.body)) {
        badge.focus({ preventScroll: true });
      }
    });
    observer.observe(document.body, { childList: true });
  }

  function onViewportChange() {
    if (menu) placeCard(menu.card);
  }

  function items() {
    return menu
      ? Array.from(menu.card.querySelectorAll<HTMLElement>('[role="menuitem"]'))
      : [];
  }

  function onKey(event: KeyboardEvent) {
    if (!menu) return;
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const move = (next: number) => {
      event.preventDefault();
      list[(next + list.length) % list.length]?.focus();
    };
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index < 0 ? list.length - 1 : index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(list.length - 1);
    else if (event.key === 'Tab') move(index + (event.shiftKey ? -1 : 1));
  }

  // One action row: icon tile, label and a short line under it.
  function row({
    iconName,
    label,
    sub,
    href,
    onClick
  }: {
    iconName: keyof typeof ICONS;
    label: string;
    sub: string;
    href?: string;
    onClick?: () => void;
  }) {
    const content = [
      el('span', { class: 'lh-row-icon' }, [icon(iconName)]),
      el('span', { class: 'lh-row-text' }, [
        el('span', { class: 'lh-row-label' }, [label]),
        el('span', { class: 'lh-row-sub' }, [sub])
      ]),
      ...(href ? [icon('arrow', 'lh-icon lh-row-go')] : [])
    ];
    const node = href
      ? el('a', { class: 'lh-row', role: 'menuitem', href, target: '_blank', rel: 'noopener' }, content)
      : el('button', { class: 'lh-row', role: 'menuitem', type: 'button' }, content);
    if (onClick) {
      node.addEventListener('click', () => {
        closeMenu({ restoreFocus: false });
        onClick();
      });
    }
    // Links open in a new tab and leave the menu, and its focus, as it was.
    return node;
  }

  function openMenu() {
    closeSheet();
    closingLayer?.remove();
    closingLayer = null;
    const current = session.get();
    const head = el('div', { class: 'lh-pop-head' }, [
      config.thumbnailUrl
        ? el('img', { class: 'lh-pop-thumb', src: config.thumbnailUrl, alt: '' })
        : el('span', { class: 'lh-pop-thumb lh-pop-thumb-empty', 'aria-hidden': 'true' }, [icon('star', 'lh-star')]),
      el('div', { class: 'lh-pop-head-text' }, [
        el('strong', { class: 'lh-pop-title', id: 'lh-pop-title' }, [config.title]),
        el('span', { class: 'lh-pop-owner' }, [t.by(config.owner.username)])
      ])
    ]);
    const rows = el('div', { class: 'lh-pop-rows' }, [
      row({
        iconName: 'open',
        label: t.openOnTwinkle,
        sub: t.openOnTwinkleSub,
        href: `${config.siteOrigin}/app/${config.buildId}`
      }),
      row({
        iconName: 'make',
        label: t.makeYourOwn,
        sub: t.makeYourOwnSub,
        href: `${config.siteOrigin}/build`
      })
    ]);

    let account: HTMLElement;
    if (current) {
      const signOut = el('button', { class: 'lh-pop-signout', role: 'menuitem', type: 'button' }, [
        icon('signOut'),
        el('span', {}, [t.signOut])
      ]);
      signOut.addEventListener('click', async () => {
        closeMenu();
        if (session.get()) await session.signOut();
      });
      account = el('div', { class: 'lh-pop-account' }, [
        avatar(current.user.username, viewerPicture?.(), 'lh-pop-avatar'),
        el('span', { class: 'lh-pop-account-text' }, [
          el('span', { class: 'lh-pop-account-caption' }, [t.signedInCaption]),
          el('strong', { class: 'lh-pop-account-name' }, [current.user.username])
        ]),
        signOut
      ]);
    } else {
      const signIn = el('button', { class: 'lh-pop-signin', role: 'menuitem', type: 'button' }, [
        el('span', { class: 'lh-pop-signin-mark', 'aria-hidden': 'true' }, [icon('star', 'lh-star')]),
        el('span', { class: 'lh-row-text' }, [
          el('span', { class: 'lh-pop-signin-label' }, [t.signIn]),
          el('span', { class: 'lh-pop-signin-sub' }, [t.signInSub])
        ])
      ]);
      signIn.addEventListener('click', async () => {
        closeMenu({ restoreFocus: false });
        if (session.get()) return;
        const signedIn = askSignIn({ config, t, session });
        returnFocusAfterSheet();
        await signedIn;
      });
      account = el('div', { class: 'lh-pop-account lh-pop-account-out' }, [signIn]);
    }

    const report = el('button', { class: 'lh-pop-report', role: 'menuitem', type: 'button' }, [
      icon('flag'),
      el('span', {}, [t.report])
    ]);
    report.addEventListener('click', () => {
      closeMenu({ restoreFocus: false });
      onReport();
      returnFocusAfterSheet();
    });

    const parts = [head, rows, account, el('div', { class: 'lh-pop-foot' }, [report])];
    parts.forEach((part, index) => part.style.setProperty('--i', String(index)));
    const card = el('div', {
      class: 'lh-pop',
      role: 'menu',
      'aria-labelledby': 'lh-pop-title'
    }, parts);
    const layer = el('div', { class: 'lh-pop-layer', role: 'presentation' }, [card]);
    layer.addEventListener('click', (event) => {
      if (event.target === layer) closeMenu();
    });
    document.body.append(layer);
    menu = { layer, card };
    dismissMenu = dismiss;
    placeCard(card);
    badge.setAttribute('aria-expanded', 'true');
    badge.classList.add('lh-badge-open');
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('scroll', onViewportChange);
    if (!reducedMotion() && card.animate) {
      card.classList.add('lh-pop-enter');
      card.animate(
        [
          { opacity: 0, transform: 'scale(0.6)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        { duration: 300, easing: 'cubic-bezier(0.2, 1.2, 0.35, 1)' }
      );
    }
    card.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }

  // The card sits beside the badge: left of the edge tab, or above the
  // corner pill; it grows out of the badge's ✦. It is sized and kept inside
  // the visible part of the page (the visual viewport: pinch zoom and an
  // on-screen keyboard shrink it), in the page's fixed coordinates.
  function placeCard(card: HTMLElement) {
    const gap = 10;
    const margin = 12;
    const viewport = window.visualViewport;
    const vx = viewport ? viewport.offsetLeft : 0;
    const vy = viewport ? viewport.offsetTop : 0;
    const vw = viewport ? viewport.width : window.innerWidth;
    const vh = viewport ? viewport.height : window.innerHeight;
    // Room for the edge tab beside it when the screen allows.
    const room = vw - 64 >= 240 ? vw - 64 : vw - 2 * margin;
    card.style.width = `${Math.max(0, Math.min(360, room))}px`;
    card.style.maxHeight = `${Math.max(0, vh - 2 * margin)}px`;
    const mark = (badge.querySelector('.lh-badge-mark') || badge).getBoundingClientRect();
    const box = badge.getBoundingClientRect();
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const compact = badge.classList.contains('lh-badge-compact');
    const minLeft = vx + margin;
    const maxLeft = vx + vw - margin - width;
    const minTop = vy + margin;
    const maxTop = vy + vh - margin - height;
    let left: number;
    let top: number;
    if (compact && box.left - gap - width >= minLeft) {
      left = box.left - gap - width;
      top = mark.top + mark.height / 2 - height * 0.38;
    } else {
      left = Math.min(box.right, vx + vw - margin) - width;
      top = compact ? box.bottom + gap : box.top - gap - height;
    }
    left = Math.max(minLeft, Math.min(left, maxLeft));
    top = Math.max(minTop, Math.min(top, maxTop));
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
    const originX = mark.left + mark.width / 2 - left;
    const originY = mark.top + mark.height / 2 - top;
    card.style.transformOrigin = `${Math.round(originX)}px ${Math.round(originY)}px`;
  }

  badge.addEventListener('click', () => {
    if (menu) closeMenu();
    else openMenu();
  });
  return badge;
}
