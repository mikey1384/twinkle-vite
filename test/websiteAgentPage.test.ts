import test from 'node:test';
import assert from 'node:assert/strict';

class FakeTextNode {
  readonly nodeType = 3;
  textContent: string;
  constructor(text: string) {
    this.textContent = text;
  }
}

class FakeElement {
  readonly nodeType = 1;
  readonly tagName: string;
  readonly attrs = new Map<string, string>();
  parentElement: FakeElement | null = null;
  childNodes: Array<FakeElement | FakeTextNode> = [];
  type = '';
  value = '';
  placeholder = '';
  disabled = false;
  checked = false;
  cursor = 'auto';

  constructor(
    tag: string,
    attrs: Record<string, string> = {},
    children: Array<FakeElement | string> = []
  ) {
    this.tagName = tag.toUpperCase();
    for (const [k, v] of Object.entries(attrs)) {
      this.attrs.set(k, v);
      if (k === 'type') this.type = v;
      if (k === 'placeholder') this.placeholder = v;
    }
    for (const child of children) {
      this.append(child);
    }
  }

  append(child: FakeElement | string) {
    if (typeof child === 'string') {
      this.childNodes.push(new FakeTextNode(child));
    } else {
      child.parentElement = this;
      this.childNodes.push(child);
    }
    return this;
  }

  setText(text: string) {
    this.childNodes = text ? [new FakeTextNode(text)] : [];
  }

  get innerText(): string {
    return this.childNodes
      .map((node) =>
        node instanceof FakeTextNode ? node.textContent : node.innerText
      )
      .join(' ');
  }

  getAttribute(name: string) {
    return this.attrs.has(name) ? this.attrs.get(name)! : null;
  }

  setAttribute(name: string, value: string) {
    this.attrs.set(name, String(value));
  }

  hasAttribute(name: string) {
    return this.attrs.has(name);
  }

  getBoundingClientRect() {
    return {
      top: 10,
      left: 10,
      bottom: 40,
      right: 110,
      width: 100,
      height: 30
    };
  }

  contains(other: FakeElement | null): boolean {
    let cur: FakeElement | null = other;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  private matchesSimple(selector: string): boolean {
    const s = selector.trim();
    if (!s) return false;
    if (s === '*') return true;
    const tag = this.tagName.toLowerCase();
    if (s === '[data-agent-tabs] > nav') {
      return tag === 'nav' && Boolean(this.parentElement?.hasAttribute('data-agent-tabs'));
    }
    if (s === '[data-agent-tabs] > nav > a') {
      return (
        tag === 'a' &&
        this.parentElement?.tagName.toLowerCase() === 'nav' &&
        Boolean(this.parentElement.parentElement?.hasAttribute('data-agent-tabs'))
      );
    }
    if (s === '[data-agent-tabs] > nav > button') {
      return (
        tag === 'button' &&
        this.parentElement?.tagName.toLowerCase() === 'nav' &&
        Boolean(this.parentElement.parentElement?.hasAttribute('data-agent-tabs'))
      );
    }
    if (s === 'input:not([type="hidden"])') {
      return tag === 'input' && this.getAttribute('type') !== 'hidden';
    }
    const tagAndAttr = /^([a-z0-9]+)\[([^=\]]+)(?:="([^"]*)")?\]$/i.exec(s);
    if (tagAndAttr) {
      const [, t, attr, val] = tagAndAttr;
      if (tag !== t.toLowerCase()) return false;
      if (val === undefined) return this.hasAttribute(attr);
      return this.getAttribute(attr) === val;
    }
    const attrOnly = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(s);
    if (attrOnly) {
      const [, attr, val] = attrOnly;
      if (val === undefined) return this.hasAttribute(attr);
      return this.getAttribute(attr) === val;
    }
    return tag === s.toLowerCase();
  }

  matches(selector: string): boolean {
    return selector
      .split(',')
      .some((part) => this.matchesSimple(part.trim()));
  }

  closest(selector: string): FakeElement | null {
    let cur: FakeElement | null = this;
    while (cur) {
      if (cur.matches(selector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const out: FakeElement[] = [];
    const visit = (node: FakeElement) => {
      for (const child of node.childNodes) {
        if (child instanceof FakeElement) {
          if (child.matches(selector)) out.push(child);
          visit(child);
        }
      }
    };
    visit(this);
    return out;
  }

  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }
}

function installFakeDom(root: FakeElement) {
  (globalThis as any).Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  (globalThis as any).window = {
    location: {
      origin: 'https://www.twin-kle.com',
      href: 'https://www.twin-kle.com/home',
      pathname: '/home',
      search: ''
    },
    innerWidth: 1280,
    innerHeight: 800,
    getComputedStyle: (el: FakeElement) => ({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      cursor: el.cursor || 'auto'
    }),
    addEventListener() {},
    removeEventListener() {}
  };
  (globalThis as any).document = {
    title: 'Home',
    querySelector(selector: string) {
      if (selector === '#react-view') return root;
      const refMatch = /^\[data-agent-ref="([^"]+)"\]$/.exec(selector);
      if (refMatch) {
        return root.querySelector(`[data-agent-ref="${refMatch[1]}"]`);
      }
      return null;
    },
    querySelectorAll() {
      return [];
    },
    elementsFromPoint() {
      return [];
    }
  };
}

test('looksConsequential exempts only plain same-site navigation links and actual tab controls', async () => {
  const root = new FakeElement('div', { id: 'react-view' });
  installFakeDom(root);
  const { looksConsequential } = await import('../src/helpers/websiteAgentPage');

  // Plain same-site links are view-only even with consequential words.
  assert.equal(
    looksConsequential(new FakeElement('a', { href: '/rewards' }, ['Rewards']) as any),
    false
  );
  assert.equal(
    looksConsequential(
      new FakeElement('a', { href: 'https://www.twin-kle.com/missions/1' }, ['Claim']) as any
    ),
    false
  );

  // Action/external/download/new-tab/role=button links still require confirmation.
  for (const link of [
    new FakeElement('a', { href: '#' }, ['Delete']),
    new FakeElement('a', { href: '#confirm' }, ['Confirm']),
    new FakeElement('a', { href: '/home#delete' }, ['Delete']),
    new FakeElement('a', { href: 'javascript:void(0)' }, ['Delete']),
    new FakeElement('a', { href: 'https://checkout.example.com/pay' }, ['Pay now']),
    new FakeElement('a', { href: 'mailto:abuse@example.com' }, ['Report']),
    new FakeElement('a', { href: '/files/out.pdf', download: '' }, ['Save']),
    new FakeElement('a', { href: '/rewards', target: '_blank' }, ['Claim reward']),
    new FakeElement('a', { href: '/rewards', role: 'button' }, ['Confirm'])
  ]) {
    assert.equal(looksConsequential(link as any), true, link.getAttribute('href') || '');
  }

  // FilterBar <nav> tabs (including accessible <nav><button type="button"> tabs)
  // and [role="tab"] elements are view-only, but non-tab buttons placed inside
  // FilterBar / tablist / tab or submit buttons are NOT exempt.
  const filterNav = new FakeElement('nav', {}, ['Rewards']);
  filterNav.cursor = 'pointer';
  const filterTabButton = new FakeElement(
    'button',
    { type: 'button', 'aria-pressed': 'false' },
    ['Rewards']
  );
  const filterButtonNav = new FakeElement('nav', {}, [filterTabButton]);
  filterButtonNav.cursor = 'pointer';
  const filterSubmitButton = new FakeElement('button', { type: 'submit' }, ['Delete']);
  const filterSubmitNav = new FakeElement('nav', {}, [filterSubmitButton]);
  const filterActionButton = new FakeElement('button', { type: 'button' }, ['Delete']);
  const filterBar = new FakeElement('div', { 'data-agent-tabs': '' }, [
    filterNav,
    filterButtonNav,
    filterSubmitNav,
    filterActionButton
  ]);
  const xpActivity = new FakeElement('div', { 'data-agent-no-play': '' }, [filterBar]);
  root.append(xpActivity);

  assert.equal(looksConsequential(filterNav as any), false);
  assert.equal(looksConsequential(filterTabButton as any), false);
  assert.equal(looksConsequential(filterSubmitButton as any), true);
  assert.equal(looksConsequential(filterActionButton as any), true);

  const { readWebsiteAgentPage } = await import('../src/helpers/websiteAgentPage');
  const xpPage = readWebsiteAgentPage();
  const tabButtonRef = filterTabButton.getAttribute('data-agent-ref')!;
  const submitButtonRef = filterSubmitButton.getAttribute('data-agent-ref')!;
  assert.ok(tabButtonRef, 'inner <button type="button"> receives the tab ref');
  assert.match(
    xpPage.elements,
    new RegExp(`\\[${tabButtonRef}\\][^\\n]*tab inside an XP activity: you may switch to it`)
  );
  assert.match(
    xpPage.elements,
    new RegExp(`\\[${submitButtonRef}\\][^\\n]*inside an XP activity: the user plays it`)
  );

  const tabCloseButton = new FakeElement('button', {}, ['Remove']);
  const roleTab = new FakeElement('div', { role: 'tab' }, ['Rewards', tabCloseButton]);
  const tablistDelete = new FakeElement('button', {}, ['Delete']);
  const tablist = new FakeElement('div', { role: 'tablist' }, [roleTab, tablistDelete]);
  root.append(tablist);

  assert.equal(looksConsequential(roleTab as any), false);
  assert.equal(looksConsequential(tabCloseButton as any), true);
  assert.equal(looksConsequential(tablistDelete as any), true);

  const formSubmitTab = new FakeElement('button', { role: 'tab', type: 'submit' }, ['View']);
  root.append(new FakeElement('form', {}, [formSubmitTab]));
  assert.equal(looksConsequential(formSubmitTab as any), true);
});

test('contenteditable nearby fingerprints ignore typed text and handle empty duplicate labels cleanly', async () => {
  const root = new FakeElement('div', { id: 'react-view' });
  const composerA = new FakeElement('div', { contenteditable: 'true' }, ['']);
  const composerB = new FakeElement('div', { contenteditable: 'true' }, ['']);
  root.append(new FakeElement('div', {}, ['Reply to Alice', composerA]));
  root.append(new FakeElement('div', {}, ['Reply to Bob', composerB]));
  installFakeDom(root);

  const { readWebsiteAgentPage, findWebsiteAgentElement } = await import(
    '../src/helpers/websiteAgentPage'
  );
  const page = readWebsiteAgentPage();
  assert.match(page.elements, /near "Reply to Alice"/);
  assert.match(page.elements, /near "Reply to Bob"/);
  assert.ok(!page.elements.includes('R e p l y'), 'empty name must not space out characters');

  const refA = composerA.getAttribute('data-agent-ref')!;
  assert.ok(refA);
  composerA.setText('Hello Alice, typing a long message here');
  assert.equal(
    findWebsiteAgentElement(refA),
    composerA as any,
    'typing into contenteditable must not invalidate its ref via nearby text'
  );
});

test('unique consequential buttons detect in-place target swaps while non-consequential controls tolerate live text', async () => {
  const root = new FakeElement('div', { id: 'react-view' });
  const targetLabel = new FakeElement('p', {}, ['Delete Draft 1?']);
  const deleteBtn = new FakeElement('button', {}, ['Delete']);
  root.append(new FakeElement('div', {}, [targetLabel, deleteBtn]));

  const timerLabel = new FakeElement('span', {}, ['00:10']);
  const filterBtn = new FakeElement('button', {}, ['Filters']);
  root.append(new FakeElement('div', {}, [timerLabel, filterBtn]));
  installFakeDom(root);

  const { readWebsiteAgentPage, findWebsiteAgentElement } = await import(
    '../src/helpers/websiteAgentPage'
  );
  readWebsiteAgentPage();
  const deleteRef = deleteBtn.getAttribute('data-agent-ref')!;
  const filterRef = filterBtn.getAttribute('data-agent-ref')!;

  // React updates the single-item confirmation dialog in place (same button node).
  targetLabel.setText('Delete Important Project?');
  assert.equal(
    findWebsiteAgentElement(deleteRef),
    null,
    'unique consequential button must go stale when its surrounding target changes'
  );

  // Live timer text updates next to a unique non-consequential control.
  timerLabel.setText('00:11');
  assert.equal(
    findWebsiteAgentElement(filterRef),
    filterBtn as any,
    'unique non-consequential button stays valid when adjacent live text changes'
  );
});
