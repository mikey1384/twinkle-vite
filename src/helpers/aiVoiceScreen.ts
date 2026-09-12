export function extractAiVoiceScreenHTML(element: Element) {
  const clone = element.cloneNode(true) as Element;
  const originals = [element, ...element.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  const styles = new Map<Element, CSSStyleDeclaration>();
  for (let index = 0; index < originals.length; index++) {
    const original = originals[index];
    const copy = copies[index];
    const style = window.getComputedStyle(original);
    const bounds = original.getBoundingClientRect();
    styles.set(copy, style);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      original.hasAttribute('hidden') ||
      (bounds.width > 0 &&
        bounds.height > 0 &&
        (bounds.bottom <= 0 ||
          bounds.top >= window.innerHeight ||
          bounds.right <= 0 ||
          bounds.left >= window.innerWidth))
    ) {
      if (copy === clone) return '';
      copy.remove();
      continue;
    }
    // Retain visible control labels and states, not hidden fields, credentials,
    // event handlers, or internal data attributes from the application's DOM.
    if (original instanceof HTMLInputElement && original.type === 'hidden') {
      copy.remove();
      continue;
    }
    if (isPreservedInteractiveElement(copy)) {
      const allowed = new Set([
        'type',
        'href',
        'title',
        'aria-label',
        'role',
        'placeholder',
        'disabled',
        'checked',
        'aria-pressed',
        'aria-expanded'
      ]);
      for (const attribute of [...copy.attributes]) {
        if (!allowed.has(attribute.name)) copy.removeAttribute(attribute.name);
      }
      if (
        original instanceof HTMLInputElement &&
        original.type !== 'password'
      ) {
        copy.setAttribute('value', original.value);
        if (original.type === 'checkbox' || original.type === 'radio')
          copy.toggleAttribute('checked', original.checked);
      }
      if (original instanceof HTMLTextAreaElement)
        copy.textContent = original.value;
      if (original instanceof HTMLSelectElement) {
        copy.setAttribute(
          'aria-label',
          `${original.getAttribute('aria-label') || 'Selection'}: ${original.selectedOptions[0]?.textContent || ''}`
        );
      }
    }
  }

  const cleanElement = (el: Element) => {
    const removeSelectors = [
      'script',
      'style',
      '.hidden',
      '[style*="display: none"]',
      '[style*="visibility: hidden"]'
    ];
    removeSelectors.forEach((selector) => {
      el.querySelectorAll(selector).forEach((elem) => elem.remove());
    });

    const allElements = el.getElementsByTagName('*');
    for (let i = allElements.length - 1; i >= 0; i--) {
      const elem = allElements[i];
      const computedStyle = styles.get(elem) || window.getComputedStyle(elem);

      let layoutInfo = '';
      if (computedStyle.display === 'flex') {
        layoutInfo = `[flex ${computedStyle.flexDirection} ${computedStyle.justifyContent}]`;
      } else if (computedStyle.display === 'grid') {
        layoutInfo = '[grid]';
      }

      if (
        elem.tagName.toLowerCase() === 'svg' &&
        (elem.hasAttribute('data-icon') || elem.hasAttribute('data-prefix'))
      ) {
        const prefix = elem.getAttribute('data-prefix') || 'fas';
        const iconName = elem.getAttribute('data-icon') || 'unknown';
        const placeholderText = `[icon ${prefix}-${iconName}]`;
        const textNode = document.createTextNode(placeholderText);

        elem.parentNode?.insertBefore(textNode, elem);
        elem.remove();
        continue;
      }

      if (elem.tagName.toLowerCase() === 'path') {
        elem.remove();
        continue;
      }

      if (
        !elem.textContent?.trim() &&
        !isPreservedInteractiveElement(elem) &&
        !hasInteractiveChild(elem)
      ) {
        elem.remove();
        continue;
      }

      if (!isPreservedInteractiveElement(elem)) {
        if (layoutInfo) {
          const layoutNode = document.createTextNode(layoutInfo);
          elem.parentNode?.insertBefore(layoutNode, elem);
        }

        while (elem.attributes.length > 0) {
          elem.removeAttribute(elem.attributes[0].name);
        }
      }
    }
  };

  cleanElement(clone);
  const finalHTML = clone.innerHTML
    .replace(/<(article|section|main|aside|header|footer|nav)>/g, '[section]')
    .replace(
      /<\/(article|section|main|aside|header|footer|nav)>/g,
      '[/section]'
    )
    .replace(/<(h[1-6])>/g, '[heading]')
    .replace(/<\/h[1-6]>/g, '[/heading]')
    .replace(/<(ul|ol)>/g, '[list]')
    .replace(/<\/(ul|ol)>/g, '[/list]')
    .replace(/<li>/g, '• ')
    .replace(/<\/li>/g, '\n')
    .replace(/<div>/g, '')
    .replace(/<\/div>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    .replace(/<\/?(?:span|strong|em|i|b|small|label)>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return finalHTML;
}

function isPreservedInteractiveElement(elem: Element) {
  const interactiveSelectors = [
    'button',
    'input',
    'textarea',
    'select',
    'a[href]'
  ];
  return interactiveSelectors.some((selector) => elem.matches(selector));
}

function hasInteractiveChild(elem: Element) {
  const interactiveSelectors = [
    'button',
    'input',
    'textarea',
    'select',
    'a[href]'
  ];
  return !!elem.querySelector(interactiveSelectors.join(','));
}
