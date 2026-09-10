import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { formatBytes } from './helpers/utils';

export interface BuildReferenceDocumentSummary {
  id: number;
  buildId: number;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  extractionStatus: 'ready' | 'empty' | 'failed';
  extractionError: string;
  pageCount: number | null;
  wordCount: number;
  charCount: number;
  createdAt: number;
}

interface ReferenceDocumentsPanelProps {
  buildId: number;
  canEdit: boolean;
}

function describeDocument(document: BuildReferenceDocumentSummary) {
  const parts: string[] = [];
  if (document.pageCount) {
    parts.push(`${document.pageCount} page${document.pageCount === 1 ? '' : 's'}`);
  }
  if (document.wordCount > 0) {
    parts.push(`${document.wordCount.toLocaleString()} words`);
  }
  if (document.sizeBytes > 0) {
    parts.push(formatBytes(document.sizeBytes));
  }
  return parts.join(' · ');
}

export default function ReferenceDocumentsPanel({
  buildId,
  canEdit
}: ReferenceDocumentsPanelProps) {
  const loadBuildReferenceDocuments = useAppContext(
    (v) => v.requestHelpers.loadBuildReferenceDocuments
  );
  const deleteBuildReferenceDocument = useAppContext(
    (v) => v.requestHelpers.deleteBuildReferenceDocument
  );
  const [documents, setDocuments] = useState<BuildReferenceDocumentSummary[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const result = await loadBuildReferenceDocuments({ buildId });
        if (cancelled) return;
        if (!result || !Array.isArray(result.documents)) {
          setError(String(result?.error || 'Could not load documents.'));
          setDocuments([]);
        } else {
          setDocuments(result.documents);
        }
      } catch (loadError: any) {
        if (cancelled) return;
        setError(String(loadError?.message || 'Could not load documents.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buildId, loadBuildReferenceDocuments]);

  async function handleDelete(document: BuildReferenceDocumentSummary) {
    if (deletingId) return;
    setDeletingId(document.id);
    setError('');
    try {
      const result = await deleteBuildReferenceDocument({
        buildId,
        documentId: document.id
      });
      if (!result?.success) {
        setError(String(result?.error || 'Could not remove that document.'));
        return;
      }
      setDocuments((previous) =>
        previous.filter((entry) => entry.id !== document.id)
      );
    } catch (deleteError: any) {
      setError(String(deleteError?.message || 'Could not remove that document.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      className={css`
        display: flex;
        flex-direction: column;
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        background: #fff;
        overflow: clip;
      `}
    >
      <div
        className={css`
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--ui-border);
          background: rgba(248, 250, 252, 0.9);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        `}
      >
        <span
          className={css`
            font-size: 1.2rem;
            font-weight: 800;
            color: var(--chat-text);
          `}
        >
          Documents Lumine can read
        </span>
        <span
          className={css`
            font-size: 1.1rem;
            color: var(--chat-text);
            opacity: 0.68;
          `}
        >
          Books, worksheets, and word lists you attached in chat. Lumine reads
          their text and copies what the app needs.
        </span>
      </div>
      {error ? (
        <div
          className={css`
            padding: 0.75rem 1rem;
            color: #b91c1c;
            font-size: 1.1rem;
            font-weight: 700;
          `}
        >
          {error}
        </div>
      ) : null}
      {loading ? (
        <div
          className={css`
            padding: 0.9rem 1rem;
            font-size: 1.1rem;
            color: var(--chat-text);
            opacity: 0.7;
          `}
        >
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div
          className={css`
            padding: 0.9rem 1rem;
            font-size: 1.1rem;
            color: var(--chat-text);
            opacity: 0.7;
          `}
        >
          No documents yet. Attach a PDF, Word, or text file in the chat and
          Lumine will read it.
        </div>
      ) : (
        documents.map((document) => (
          <div
            key={document.id}
            className={css`
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 0.85rem;
              align-items: center;
              padding: 0.9rem 1rem;
              border-top: 1px solid rgba(226, 232, 240, 0.65);
              &:first-of-type {
                border-top: none;
              }
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: minmax(0, 1fr);
              }
            `}
          >
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.2rem;
                min-width: 0;
              `}
            >
              <span
                className={css`
                  font-size: 1.15rem;
                  font-weight: 700;
                  color: var(--chat-text);
                  overflow-wrap: anywhere;
                `}
              >
                {document.fileName}
              </span>
              <span
                className={css`
                  font-size: 1.05rem;
                  color: ${document.extractionStatus === 'ready'
                    ? 'var(--chat-text)'
                    : '#b45309'};
                  opacity: ${document.extractionStatus === 'ready' ? 0.68 : 1};
                `}
              >
                {document.extractionStatus === 'ready'
                  ? describeDocument(document) || 'Ready'
                  : document.extractionError ||
                    'No readable text was found in this file.'}
              </span>
            </div>
            {canEdit ? (
              <Button
                color="rose"
                variant="ghost"
                loading={deletingId === document.id}
                disabled={Boolean(deletingId) && deletingId !== document.id}
                onClick={() => handleDelete(document)}
                uppercase={false}
              >
                Remove
              </Button>
            ) : null}
          </div>
        ))
      )}
    </section>
  );
}
