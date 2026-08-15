import assert from 'node:assert/strict';
import test from 'node:test';

import {
  downloadImage,
  getImageDownloadFileName
} from '../src/helpers/imageHelpers';

test('image downloads use a fetched same-origin blob instead of opening the asset URL', async () => {
  const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const documentDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'document'
  );
  const createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
    URL,
    'createObjectURL'
  );
  const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
    URL,
    'revokeObjectURL'
  );
  const appended: any[] = [];
  const removed: any[] = [];
  const revoked: string[] = [];
  let clickCount = 0;
  const link = {
    href: '',
    download: '',
    click() {
      clickCount += 1;
    }
  };

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (src: string, init: RequestInit) => {
      assert.equal(src, 'https://assets.example/card-proof.png');
      assert.equal(init.mode, 'cors');
      return {
        ok: true,
        status: 200,
        blob: async () => new Blob(['image'], { type: 'image/png' })
      };
    }
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: (tagName: string) => {
        assert.equal(tagName, 'a');
        return link;
      },
      body: {
        appendChild: (node: any) => appended.push(node),
        removeChild: (node: any) => removed.push(node)
      }
    }
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: () => 'blob:download'
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: (url: string) => revoked.push(url)
  });

  try {
    await downloadImage(
      'https://assets.example/card-proof.png',
      'proof.png'
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(link.href, 'blob:download');
    assert.equal(link.download, 'proof.png');
    assert.equal(clickCount, 1);
    assert.deepEqual(appended, [link]);
    assert.deepEqual(removed, [link]);
    assert.deepEqual(revoked, ['blob:download']);
  } finally {
    restoreProperty(globalThis, 'fetch', fetchDescriptor);
    restoreProperty(globalThis, 'document', documentDescriptor);
    restoreProperty(URL, 'createObjectURL', createObjectUrlDescriptor);
    restoreProperty(URL, 'revokeObjectURL', revokeObjectUrlDescriptor);
  }
});

test('image download names fall back to the source path and MIME type', () => {
  assert.equal(
    getImageDownloadFileName({
      src: 'https://assets.example/path/card%20proof.png?size=large'
    }),
    'card proof.png'
  );
  assert.equal(
    getImageDownloadFileName({
      src: 'data:image/jpeg;base64,AAAA',
      mimeType: 'image/jpeg'
    }),
    'twinkle-image.jpg'
  );
});

test('cross-origin images retain the safe open-image fallback when CORS blocks download', async () => {
  const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const documentDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'document'
  );
  const windowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'window'
  );
  let clickCount = 0;
  const link = {
    href: '',
    target: '',
    rel: '',
    click() {
      clickCount += 1;
    }
  };

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async () => {
      throw new TypeError('Failed to fetch');
    }
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { href: 'https://www.twin-kle.com/chat' } }
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => link,
      body: {
        appendChild: () => undefined,
        removeChild: () => undefined
      }
    }
  });

  try {
    await downloadImage('https://legacy.example/card.png');
    assert.equal(link.href, 'https://legacy.example/card.png');
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(clickCount, 1);
  } finally {
    restoreProperty(globalThis, 'fetch', fetchDescriptor);
    restoreProperty(globalThis, 'document', documentDescriptor);
    restoreProperty(globalThis, 'window', windowDescriptor);
  }
});

function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined
) {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
  } else {
    delete (target as Record<PropertyKey, unknown>)[property];
  }
}
