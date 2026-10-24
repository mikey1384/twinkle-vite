import assert from 'node:assert/strict';
import test from 'node:test';

import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Loaded like test/buildPublicSharedDbBridge.test.cjs: transpiled with
// ~/constants/URL stubbed (it reads import.meta.env, which node lacks). The
// module reads fetch, document, window and URL from globalThis at call time.
function loadPreviewDownloads() {
  const source = fs.readFileSync('src/containers/Build/PreviewPanel/helpers/previewDownloads.ts', 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const exported: any = {};
  const sandbox: any = new Proxy(
    { exports: exported, require: (name: string) => (name === '~/constants/URL' ? { default: 'https://api.fixture.invalid', __esModule: true } : {}) },
    { get: (target, key) => (key in target ? target[key] : (globalThis as any)[key]), has: () => true }
  );
  vm.runInNewContext(`with (sandbox) { ${compiled} }`, { sandbox });
  return exported as { triggerPreviewLocalDownload: (payload: any) => Promise<any> };
}
const { triggerPreviewLocalDownload } = loadPreviewDownloads();

// 10-24: Twinkle.files.saveAs({ url }) fetched Twinkle-hosted files through
// /content/image/proxy, which only passes images, so a Groove Lab mp3 or a
// Book Maker PDF could not be saved. The CDN serves any origin (CORS *), so
// the file is fetched directly and the proxy is only a fallback.

const CDN_MP3 =
  'https://d3jvoamd2k4p0s.cloudfront.net/attachments/build-runtime/2206/5/1686/gm-kit.mp3';

function withDownloadStubs(
  fetchImpl: (url: string) => Promise<any>,
  run: (state: { fetched: string[]; saved: Array<{ name: string; size: number; type: string }> }) => Promise<void>
) {
  const descriptors = {
    fetch: Object.getOwnPropertyDescriptor(globalThis, 'fetch'),
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    window: Object.getOwnPropertyDescriptor(globalThis, 'window'),
    createObjectURL: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
    revokeObjectURL: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
  };
  const state = { fetched: [] as string[], saved: [] as Array<{ name: string; size: number; type: string }> };
  const blobs = new Map<string, Blob>();
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (url: string) => {
      state.fetched.push(String(url));
      return fetchImpl(String(url));
    }
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { href: 'https://www.twin-kle.com/app/2206', origin: 'https://www.twin-kle.com' }, setTimeout: () => 0 }
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => {
        const link: any = {
          style: {},
          click() {
            const blob = blobs.get(link.href);
            state.saved.push({ name: link.download, size: blob?.size ?? -1, type: blob?.type ?? '' });
          },
          remove() {}
        };
        return link;
      },
      body: { appendChild() {} }
    }
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => {
      const url = `blob:test/${blobs.size}`;
      blobs.set(url, blob);
      return url;
    }
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  return run(state).finally(() => {
    for (const [name, descriptor] of Object.entries(descriptors)) {
      const target: any = name.endsWith('ObjectURL') ? URL : globalThis;
      if (descriptor) Object.defineProperty(target, name, descriptor);
      else delete target[name];
    }
  });
}

const okBlob = (type: string, size: number) => ({
  ok: true,
  status: 200,
  blob: async () => new Blob([new Uint8Array(size)], { type })
});

test('a Twinkle-hosted mp3 is fetched directly and saved without the image proxy', async () => {
  await withDownloadStubs(
    async () => okBlob('audio/mpeg', 4096),
    async (state) => {
      const result = await triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'Night Drive.mp3' });
      assert.deepEqual(state.fetched, [CDN_MP3]);
      assert.deepEqual(state.saved, [{ name: 'Night Drive.mp3', size: 4096, type: 'audio/mpeg' }]);
      assert.equal(result.success, true);
    }
  );
});

test('when the direct fetch fails, a Twinkle-hosted file falls back to the proxy', async () => {
  await withDownloadStubs(
    async (url) => {
      if (url === CDN_MP3) throw new TypeError('Failed to fetch');
      return okBlob('image/png', 10);
    },
    async (state) => {
      await triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'x.png' });
      assert.equal(state.fetched.length, 2);
      assert.match(state.fetched[1], /\/content\/image\/proxy\?url=/);
      assert.equal(state.saved.length, 1);
    }
  );
});

test('an outside host is never sent through the proxy', async () => {
  await withDownloadStubs(
    async () => {
      throw new TypeError('Failed to fetch');
    },
    async (state) => {
      await assert.rejects(
        triggerPreviewLocalDownload({ url: 'https://example.com/a.pdf', fileName: 'a.pdf' }),
        /Could not fetch download URL/
      );
      assert.deepEqual(state.fetched, ['https://example.com/a.pdf']);
    }
  );
});

test('a missing file reports its own status instead of retrying through the proxy', async () => {
  await withDownloadStubs(
    async () => ({ ok: false, status: 404, blob: async () => new Blob([]) }),
    async (state) => {
      await assert.rejects(
        triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'gone.mp3' }),
        /\(404\)/
      );
      assert.deepEqual(state.fetched, [CDN_MP3]);
    }
  );
});

test('when both the direct fetch and the proxy fail, the proxy error is reported', async () => {
  await withDownloadStubs(
    async (url) => {
      if (url === CDN_MP3) throw new TypeError('Failed to fetch');
      return { ok: false, status: 502, blob: async () => new Blob([]) };
    },
    async (state) => {
      await assert.rejects(
        triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'x.mp3' }),
        /\(502\)/
      );
      assert.equal(state.fetched.length, 2);
      assert.equal(state.saved.length, 0);
    }
  );
});

test('data: and javascript: addresses are refused without fetching', async () => {
  await withDownloadStubs(
    async () => okBlob('text/plain', 1),
    async (state) => {
      for (const url of ['javascript:alert(1)', 'data:text/html,<b>x</b>']) {
        await assert.rejects(
          triggerPreviewLocalDownload({ url, fileName: 'x' }),
          /Invalid URL for download/
        );
      }
      assert.deepEqual(state.fetched, []);
    }
  );
});

test('downloads stop at 500 MB, by declared size or while reading', async () => {
  const MB = 1024 * 1024;
  // Declared too large: refused before any of the body is read.
  let bodyRead = false;
  let bodyCancelled = false;
  await withDownloadStubs(
    async () => ({
      ok: true,
      status: 200,
      headers: { get: (name: string) => (name === 'content-length' ? String(600 * MB) : null) },
      body: {
        cancel: async () => {
          bodyCancelled = true;
        },
        getReader: () => {
          bodyRead = true;
          throw new Error('should not stream');
        }
      },
      blob: async () => {
        bodyRead = true;
        return new Blob([]);
      }
    }),
    async (state) => {
      await assert.rejects(
        triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'huge.mp3' }),
        /too large to download here \(600 MB; the limit is 500 MB\)/
      );
      assert.equal(bodyRead, false);
      // The rest is not left downloading in the background.
      assert.equal(bodyCancelled, true);
      assert.equal(state.saved.length, 0);
    }
  );
  // No declared size: reading stops and cancels once past the limit.
  let cancelled = false;
  let reads = 0;
  await withDownloadStubs(
    async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      body: {
        getReader: () => ({
          read: async () => {
            reads += 1;
            return { done: false, value: { byteLength: 300 * MB } };
          },
          cancel: async () => {
            cancelled = true;
          }
        })
      }
    }),
    async (state) => {
      await assert.rejects(
        triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'stream.mp3' }),
        /too large to download here/
      );
      assert.equal(reads, 2);
      assert.equal(cancelled, true);
      assert.equal(state.saved.length, 0);
    }
  );
  // A streamed file under the limit is saved whole.
  await withDownloadStubs(
    async () => {
      const parts = [new Uint8Array(3), new Uint8Array(4)];
      return {
        ok: true,
        status: 200,
        headers: { get: (name: string) => (name === 'content-type' ? 'application/pdf' : null) },
        body: { getReader: () => ({ read: async () => (parts.length ? { done: false, value: parts.shift() } : { done: true }), cancel: async () => {} }) }
      };
    },
    async (state) => {
      await triggerPreviewLocalDownload({ url: CDN_MP3.replace('.mp3', '.pdf'), fileName: 'book.pdf' });
      assert.deepEqual(state.saved, [{ name: 'book.pdf', size: 7, type: 'application/pdf' }]);
    }
  );
});

const MB = 1024 * 1024;
const streamedResponse = (headers: Record<string, string>, parts: Array<Uint8Array | { byteLength: number }>, onCancel = () => {}) => ({
  ok: true,
  status: 200,
  headers: { get: (name: string) => headers[name] ?? null },
  body: {
    getReader: () => ({ read: async () => (parts.length ? { done: false, value: parts.shift() } : { done: true }), cancel: async () => onCancel() })
  },
  blob: async () => {
    throw new Error('should stream, not call blob()');
  }
});

test('a compressed file that declares a small size is still stopped at 500 MB while reading', async () => {
  // twinkle-1a review r9: a gzip response declares its compressed length, so
  // blob() would expand past the limit before the size was checked.
  let cancelled = false;
  const parts = Array.from({ length: 6 }, () => ({ byteLength: 100 * MB }));
  await withDownloadStubs(
    async () => streamedResponse({ 'content-length': String(5 * MB), 'content-type': 'audio/mpeg' }, parts, () => { cancelled = true; }),
    async (state) => {
      await assert.rejects(
        triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'bomb.mp3' }),
        /too large to download here \(600 MB/
      );
      assert.equal(cancelled, true);
      // Stopped at the sixth chunk, not read to the end.
      assert.equal(parts.length, 0);
      assert.equal(state.saved.length, 0);
    }
  );
});

test('a file past the 16 MB fold is saved whole, bytes in order', async () => {
  const first = new Uint8Array(12 * MB).fill(1);
  const second = new Uint8Array(8 * MB).fill(2);
  const third = new Uint8Array(3).fill(3);
  let saved: Blob | undefined;
  await withDownloadStubs(
    async () => streamedResponse({ 'content-length': String(20 * MB + 3), 'content-type': 'application/pdf' }, [first, second, third]),
    async (state) => {
      const createObjectURL = URL.createObjectURL;
      URL.createObjectURL = (blob: Blob) => {
        saved = blob;
        return createObjectURL(blob);
      };
      await triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'big.pdf' });
      assert.deepEqual(state.saved, [{ name: 'big.pdf', size: 20 * MB + 3, type: 'application/pdf' }]);
    }
  );
  const bytes = new Uint8Array(await saved!.arrayBuffer());
  assert.equal(bytes[0], 1);
  assert.equal(bytes[12 * MB - 1], 1);
  assert.equal(bytes[12 * MB], 2);
  assert.equal(bytes[20 * MB - 1], 2);
  assert.deepEqual([...bytes.slice(20 * MB)], [3, 3, 3]);
});

test('only a plain digit content-length counts as a declared size', async () => {
  for (const length of ['1e9', '600000000, 600000000', '-1', '']) {
    await withDownloadStubs(
      async () => streamedResponse({ 'content-length': length }, [new Uint8Array(4)]),
      async (state) => {
        await triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'a.mp3' });
        assert.equal(state.saved[0]?.size, 4, `content-length ${JSON.stringify(length)}`);
      }
    );
  }
  // A plain length over the limit is refused before reading.
  await withDownloadStubs(
    async () => streamedResponse({ 'content-length': ` ${600 * MB} ` }, [new Uint8Array(4)]),
    async () => {
      await assert.rejects(triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'a.mp3' }), /600 MB/);
    }
  );
});

test('a stream that breaks part-way reports an interrupted download', async () => {
  let cancelled = false;
  let reads = 0;
  await withDownloadStubs(
    async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      body: {
        getReader: () => ({
          read: async () => {
            reads += 1;
            if (reads === 2) throw new TypeError('network error');
            return { done: false, value: new Uint8Array(8) };
          },
          cancel: async () => {
            cancelled = true;
          }
        })
      }
    }),
    async (state) => {
      await assert.rejects(
        triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'x.mp3' }),
        /The download was interrupted/
      );
      assert.equal(cancelled, true);
      assert.equal(state.saved.length, 0);
      // A broken stream is not a network failure to retry through the proxy.
      assert.deepEqual(state.fetched, [CDN_MP3]);
    }
  );
});

test('the streamed path keeps the content type as blob() would, and the app can relabel it', async () => {
  const streamed = (type: string) => async () => {
    const parts = [new Uint8Array(5)];
    return {
      ok: true,
      status: 200,
      headers: { get: (name: string) => (name === 'content-type' ? type : null) },
      body: { getReader: () => ({ read: async () => (parts.length ? { done: false, value: parts.shift() } : { done: true }), cancel: async () => {} }) }
    };
  };
  await withDownloadStubs(streamed(' Application/PDF '), async (state) => {
    await triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'a.pdf' });
    assert.equal(state.saved[0].type, 'application/pdf');
  });
  await withDownloadStubs(streamed('application/octet-stream'), async (state) => {
    await triggerPreviewLocalDownload({ url: CDN_MP3, fileName: 'b.mp3', mimeType: 'audio/mpeg' });
    assert.equal(state.saved[0].type, 'audio/mpeg');
  });
});
