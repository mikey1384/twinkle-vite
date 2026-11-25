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

export function closeSheet() {
  openSheet?.remove();
  openSheet = null;
}

function sheet(content: HTMLElement[], { onDismiss }: { onDismiss?: () => void } = {}) {
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

// "Made with Lumine on Twinkle": a small corner badge that opens a menu
// (who made it, open on Twinkle, sign in/out, report). It never covers the
// app's controls for long: it shrinks to a dot after a few seconds.
export function mountBadge({
  config,
  t,
  session,
  onReport
}: {
  config: LiteHostConfig;
  t: LiteHostText;
  session: SessionStore;
  onReport: () => void;
}) {
  const badge = el('button', { class: 'lh-badge', type: 'button', 'aria-haspopup': 'menu' }, [
    el('span', { class: 'lh-badge-mark', 'aria-hidden': 'true' }, ['✦']),
    el('span', { class: 'lh-badge-text' }, [
      el('strong', {}, [t.madeWith]),
      el('span', {}, [` ${t.onTwinkle}`])
    ])
  ]);
  document.body.append(badge);
  window.setTimeout(() => badge.classList.add('lh-badge-compact'), 4000);
  badge.addEventListener('click', () => {
    const current = session.get();
    const items: HTMLElement[] = [
      el('div', { class: 'lh-menu-head' }, [
        config.thumbnailUrl
          ? el('img', { class: 'lh-menu-thumb', src: config.thumbnailUrl, alt: '' })
          : el('div', { class: 'lh-menu-thumb lh-menu-thumb-empty' }, ['✦']),
        el('div', {}, [
          el('strong', {}, [config.title]),
          el('span', { class: 'lh-fine' }, [t.by(config.owner.username)])
        ])
      ]),
      el('a', {
        class: 'lh-menu-item',
        href: `${config.siteOrigin}/app/${config.buildId}`,
        target: '_blank',
        rel: 'noopener'
      }, [t.openOnTwinkle]),
      el('a', {
        class: 'lh-menu-item',
        href: `${config.siteOrigin}/build`,
        target: '_blank',
        rel: 'noopener'
      }, [t.makeYourOwn])
    ];
    const signButton = el('button', { class: 'lh-menu-item', type: 'button' }, [
      current ? `${t.signOut} (${current.user.username})` : t.signIn
    ]);
    signButton.addEventListener('click', async () => {
      closeSheet();
      if (session.get()) await session.signOut();
      else await askSignIn({ config, t, session });
    });
    const reportButton = el('button', { class: 'lh-menu-item lh-menu-quiet', type: 'button' }, [t.report]);
    reportButton.addEventListener('click', () => {
      closeSheet();
      onReport();
    });
    const panel = sheet([...items, signButton, reportButton]);
    panel.classList.add('lh-menu');
  });
  return badge;
}
