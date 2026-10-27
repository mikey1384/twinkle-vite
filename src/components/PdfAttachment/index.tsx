import React, { lazy, Suspense, useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { canSharePdf, loadPdfAttachment } from '~/helpers/pdfAttachment';
import { recordOwnerTrace } from '~/helpers/ownerTrace';

const PdfPages = lazy(() => import('./Pages'));

export default function PdfPreview({
  src,
  fileName,
  onClose,
  aboveAssistant = false,
  extraActions,
  onDownload,
  downloadBusy = false,
  downloadDisabled = false
}: {
  src: string;
  fileName: string;
  onClose: () => void;
  aboveAssistant?: boolean;
  extraActions?: React.ReactNode;
  onDownload?: () => void;
  downloadBusy?: boolean;
  downloadDisabled?: boolean;
}) {
  const [loaded, setLoaded] = useState<{
    src: string;
    file: File;
    url: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const current = loaded?.src === src ? loaded : null;
  const shareSupported = current ? canSharePdf(current.file) : false;

  useEffect(() => {
    const started = performance.now();
    const controller = new AbortController();
    let url = '';
    setLoaded(null);
    setError('');
    setShareError('');
    const timeout = window.setTimeout(() => {
      recordOwnerTrace('pdf-attachment', { phase: 'load', result: 'timeout' });
      setError('Loading this PDF took too long. Please try again.');
      controller.abort();
    }, 60_000);
    loadPdfAttachment(src, fileName, controller.signal)
      .then((file) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(file);
        setLoaded({ src, file, url });
        recordOwnerTrace('pdf-attachment', {
          phase: 'load',
          result: 'ready',
          ms: Math.round(performance.now() - started),
          bytes: file.size,
          fileShareSupported: canSharePdf(file)
        });
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          recordOwnerTrace('pdf-attachment', {
            phase: 'load',
            result: 'failed',
            ms: Math.round(performance.now() - started)
          });
          setError(
            reason instanceof Error
              ? reason.message
              : 'Could not load this PDF. Please try again.'
          );
        }
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, fileName, attempt]);

  return (
    <Modal
      isOpen
      aboveAssistant={aboveAssistant}
      title={fileName}
      header={<span className="pdf-title">{fileName}</span>}
      aria-label={`PDF preview: ${fileName}`}
      onClose={onClose}
      size="xl"
      modalKey="PdfAttachment"
      className={previewClass}
      footer={
        <>
          {(shareError || (current && !shareSupported)) && (
            <p
              className="pdf-share-note"
              role={shareError ? 'alert' : undefined}
            >
              {shareError ||
                'File sharing is not available in this browser. You can still download a copy.'}
            </p>
          )}
          {extraActions}
          {shareSupported && (
            <Button uppercase={false} loading={sharing} onClick={handleShare}>
              Share a copy
            </Button>
          )}
          {onDownload ? (
            <Button
              variant="soft"
              uppercase={false}
              loading={downloadBusy}
              disabled={downloadDisabled}
              onClick={onDownload}
            >
              Download
            </Button>
          ) : (
            <a
              className="pdf-action"
              href={current?.url || src}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          )}
          <a
            className="pdf-action"
            href={current?.url || src}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in browser
          </a>
        </>
      }
    >
      {error ? (
        <div className="pdf-status">
          <p role="alert">{error}</p>
          <Button
            uppercase={false}
            variant="soft"
            onClick={() => setAttempt((v) => v + 1)}
          >
            Try again
          </Button>
        </div>
      ) : current ? (
        <Suspense
          fallback={
            <p className="pdf-status" role="status">
              Opening preview…
            </p>
          }
        >
          <PdfPages file={current.file} />
        </Suspense>
      ) : (
        <p className="pdf-status" role="status">
          Opening PDF…
        </p>
      )}
    </Modal>
  );

  async function handleShare() {
    if (!current || sharing) return;
    setShareError('');
    setSharing(true);
    try {
      // The File is already ready: no fetch/await before the native share call,
      // so the click's transient activation is preserved on iOS.
      await navigator.share({ files: [current.file] });
      recordOwnerTrace('pdf-attachment', {
        phase: 'share',
        result: 'handed-off',
        bytes: current.file.size
      });
    } catch (reason) {
      recordOwnerTrace('pdf-attachment', {
        phase: 'share',
        result:
          reason instanceof Error && reason.name === 'AbortError'
            ? 'canceled'
            : 'failed'
      });
      if (!(reason instanceof Error && reason.name === 'AbortError')) {
        setShareError('Could not share this copy. Try again, or download it.');
      }
    } finally {
      setSharing(false);
    }
  }
}

const previewClass = css`
  .pdf-title {
    overflow-wrap: anywhere;
  }
  .pdf-status {
    padding: 2rem;
    text-align: center;
    font-size: 1.4rem;
  }
  .pdf-share-note {
    flex-basis: 100%;
    margin: 0;
    font-size: 1.2rem;
  }
  .pdf-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.8rem 1rem;
    border: 1px solid #ccd4df;
    border-radius: 8px;
    color: #20334d;
    background: #fff;
    font-size: 1.3rem;
    font-weight: 600;
    text-decoration: none;
  }
`;
