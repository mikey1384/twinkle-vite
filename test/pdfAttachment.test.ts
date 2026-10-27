import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPdfAttachmentName,
  loadPdfAttachment
} from '../src/helpers/pdfAttachment';

const name = 'Báo cáo #1 & 학습.pdf';
const src = `https://d3jvoamd2k4p0s.cloudfront.net/attachments/edited-image/chat/1/test/${encodeURIComponent(name)}`;

test('existing download-only PDF bytes become a correctly named shareable file', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_src, options) => {
    assert.equal(_src, src);
    assert.equal(options?.credentials, 'omit');
    return new Response('%PDF-1.7\nfixture', {
      headers: {
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment'
      }
    });
  });
  assert.equal(getPdfAttachmentName(src), name);
  const file = await loadPdfAttachment(src, name, new AbortController().signal);
  assert.equal(file.name, name);
  assert.equal(file.type, 'application/pdf');
  assert.equal(await file.text(), '%PDF-1.7\nfixture');
});

test('missing or HTML responses cannot be shared as PDFs', async (t) => {
  for (const response of [
    new Response('', { status: 403 }),
    new Response('<html>Not a PDF</html>')
  ]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => response);
    await assert.rejects(
      loadPdfAttachment(src, name, new AbortController().signal),
      /Could not load|not a readable PDF/
    );
    mock.mock.restore();
  }
});

test('declared and actual oversized streams stop before buffering a whole file', async (t) => {
  for (const declared of [true, false]) {
    let canceled = false;
    let chunks = 0;
    const chunk = new Uint8Array(1024 * 1024);
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunks++;
        controller.enqueue(chunk);
      },
      cancel() {
        canceled = true;
      }
    });
    const response = new Response(body, {
      headers: declared ? { 'content-length': String(51 * 1024 * 1024) } : {}
    });
    const mock = t.mock.method(globalThis, 'fetch', async () => response);
    await assert.rejects(
      loadPdfAttachment(src, name, new AbortController().signal),
      /too large/
    );
    assert.equal(canceled, true);
    assert.ok(chunks <= 52);
    mock.mock.restore();
  }
});

test('an aborted read cannot return a late file, and foreign URLs are not fetched', async (t) => {
  const controller = new AbortController();
  let requested = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    requested++;
    controller.abort();
    return new Response('%PDF-1.7\nfixture');
  });
  await assert.rejects(loadPdfAttachment(src, name, controller.signal), {
    name: 'AbortError'
  });
  await assert.rejects(
    loadPdfAttachment(
      'https://example.com/report.pdf',
      name,
      new AbortController().signal
    ),
    /cannot be previewed/
  );
  assert.equal(requested, 1);
});
