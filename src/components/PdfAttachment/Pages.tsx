import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import {
  getDocument,
  GlobalWorkerOptions,
  version
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import Button from '~/components/Button';
import { recordOwnerTrace } from '~/helpers/ownerTrace';

const workerAssetUrl = new URL(workerUrl, window.location.href);
// PDF.js creates an untracked blob wrapper for every cross-origin worker.
// Reuse one tiny bootstrap for this cached module's lifetime instead. Exporting
// the module also preserves PDF.js's fallback if a browser cannot start workers.
GlobalWorkerOptions.workerSrc =
  workerAssetUrl.origin === window.location.origin
    ? workerAssetUrl.href
    : URL.createObjectURL(
        new Blob([`export * from ${JSON.stringify(workerAssetUrl.href)};`], {
          type: 'text/javascript'
        })
      );

export default function PdfPages({ file }: { file: File }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState('');
  const [rendering, setRendering] = useState(true);
  const [pageText, setPageText] = useState('');
  const [width, setWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let task: ReturnType<typeof getDocument> | undefined;
    setDocument(null);
    setError('');
    setPageNumber(1);
    // Vercel gives the worker an immutable deployment URL. Keep its matching
    // fonts and decoders there too, so an older tab survives the next release.
    const assetBase = `${workerAssetUrl.origin}/assets/pdfjs/${version}/`;
    file
      .arrayBuffer()
      .then((data) => {
        if (disposed) return;
        task = getDocument({
          data,
          cMapUrl: `${assetBase}cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${assetBase}standard_fonts/`,
          wasmUrl: `${assetBase}wasm/`,
          iccUrl: `${assetBase}iccs/`
        });
        return task.promise;
      })
      .then((pdf) => {
        if (!disposed && pdf) setDocument(pdf);
      })
      .catch(() => {
        if (!disposed) {
          recordOwnerTrace('pdf-attachment', {
            phase: 'decode',
            result: 'failed'
          });
          setRendering(false);
          setError(
            'This PDF cannot be previewed here. You can still share it, download it, or open it in your browser.'
          );
        }
      });
    return () => {
      disposed = true;
      void task?.destroy().catch(() => {});
    };
  }, [file]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document || !width) return;
    let disposed = false;
    let renderTask: RenderTask | undefined;
    const host = pageRef.current;
    setRendering(true);
    setError('');
    setPageText('');
    host?.replaceChildren();
    async function render() {
      const started = performance.now();
      const page = await document!.getPage(pageNumber);
      if (disposed) return;
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: (Math.max(1, width - 24) / original.width) * zoom
      });
      // One page at a time; cap raster memory even on high-DPI phones and
      // unusual page dimensions. CSS keeps the requested visible size.
      const density = Math.min(
        window.devicePixelRatio || 1,
        2,
        Math.sqrt(4_000_000 / (viewport.width * viewport.height))
      );
      const canvas = window.document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width * density));
      canvas.height = Math.max(1, Math.floor(viewport.height * density));
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute('aria-hidden', 'true');
      renderTask = page.render({
        canvas,
        viewport,
        transform: density === 1 ? undefined : [density, 0, 0, density, 0, 0]
      });
      await renderTask.promise;
      const text = await page.getTextContent();
      if (disposed) return;
      host?.replaceChildren(canvas);
      setPageText(
        text.items.map((item) => ('str' in item ? item.str : '')).join(' ')
      );
      setRendering(false);
      recordOwnerTrace('pdf-attachment', {
        phase: 'render',
        result: 'ready',
        page: pageNumber,
        pages: document!.numPages,
        ms: Math.round(performance.now() - started)
      });
      page.cleanup();
    }
    void render().catch((reason) => {
      if (!disposed && reason?.name !== 'RenderingCancelledException') {
        recordOwnerTrace('pdf-attachment', {
          phase: 'render',
          result: 'failed',
          page: pageNumber
        });
        setRendering(false);
        setError(
          'This page could not be displayed. Try another page, or open the PDF in your browser.'
        );
      }
    });
    return () => {
      disposed = true;
      renderTask?.cancel();
    };
  }, [document, width, pageNumber, zoom]);

  return (
    <div className={pagesClass}>
      {document && (
        <div className="pdf-toolbar" aria-label="PDF pages">
          <Button
            size="sm"
            variant="soft"
            uppercase={false}
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((n) => n - 1)}
          >
            Previous
          </Button>
          <span aria-live="polite">
            Page {pageNumber} of {document.numPages}
          </span>
          <Button
            size="sm"
            variant="soft"
            uppercase={false}
            disabled={pageNumber >= document.numPages}
            onClick={() => setPageNumber((n) => n + 1)}
          >
            Next
          </Button>
          <label>
            Zoom{' '}
            <select
              aria-label="PDF zoom"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            >
              <option value={1}>Fit width</option>
              <option value={1.5}>150%</option>
              <option value={2}>200%</option>
            </select>
          </label>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {!error && rendering && <p role="status">Opening page…</p>}
      <div ref={viewportRef} className="pdf-viewport">
        <div ref={pageRef} aria-busy={rendering} data-pdf-page={pageNumber} />
      </div>
      <p className="pdf-accessible-text" aria-label={`Page ${pageNumber} text`}>
        {pageText}
      </p>
    </div>
  );
}

const pagesClass = css`
  width: 100%;
  min-width: 0;
  font-size: 1.3rem;
  .pdf-toolbar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.8rem;
    padding-bottom: 1rem;
    select {
      font: inherit;
      padding: 0.6rem;
    }
  }
  .pdf-viewport {
    width: 100%;
    overflow: auto;
    background: #e8ecf1;
  }
  [data-pdf-page] {
    padding: 12px;
    min-height: 4rem;
  }
  canvas {
    display: block;
    background: #fff;
    max-width: none;
  }
  .pdf-accessible-text {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;
