import React, { useState } from 'react';

interface StepCard {
  method?: string;
  path?: string;
  body?: unknown;
  asyncTask?: {
    operation: string;
    payloadHash?: string;
    appName?: string;
    referenceCollections?: {
      id: number;
      name: string;
      note: string;
      pictures: { id: number; label: string; note: string; role: string }[];
    }[];
    collectionName?: string;
    pictures?: { id: number; path: string }[];
    workshop?: { jobId: number; versionId: number; versionNumber?: number };
  };
}

function title(card: StepCard) {
  if (card.method === 'POST') {
    if (card.path === '/content/image/ai') return 'Make this picture';
    if (card.path === '/chat/aiCard/image') return 'Reveal this card’s picture';
    if (card.path === '/content/image/ai/collections')
      return 'Make a picture collection';
    const publish = /^\/build\/(\d+)\/publish$/.exec(card.path || '');
    if (publish)
      return `Publish ${card.asyncTask?.appName || 'app'} #${publish[1]}`;
  }
  const collection = /^\/content\/image\/ai\/collections\/(\d+)$/.exec(
    card.path || ''
  );
  if (card.method === 'PUT' && collection)
    return `Change ${card.asyncTask?.collectionName || 'picture collection'} (#${collection[1]})`;
}

export function asyncActionTitle(card: StepCard) {
  if (
    card.asyncTask?.operation !== 'step' ||
    !card.asyncTask.payloadHash ||
    !card.body ||
    typeof card.body !== 'object' ||
    Array.isArray(card.body)
  )
    return;
  return title(card);
}

const labels: Record<string, string> = {
  prompt: 'What to draw',
  engine: 'Picture maker',
  model: 'Model',
  quality: 'Picture quality',
  referenceHistoryId: 'Reference picture from My Images',
  requestId: 'Request number',
  historySource: 'Save in history as',
  displayPrompt: 'Caption in My Images',
  cardId: 'Card number',
  name: 'Collection name',
  note: 'Note',
  role: 'Use as',
  label: 'Name',
  images: 'Pictures in order',
  imageIds: 'Pictures in order',
  id: 'Number',
  collections: 'Use these collections',
  revision: 'Version',
  expectedRevision: 'Collection version',
  thumbnailUrl: 'App cover',
  expectedFilesHash: 'File fingerprint',
  referenceImageB64: 'Reference picture'
};

function valueView(value: unknown): React.ReactNode {
  if (Array.isArray(value))
    return value.length ? (
      <ol>
        {value.map((item, i) => (
          <li key={i}>{valueView(item)}</li>
        ))}
      </ol>
    ) : (
      'None'
    );
  if (value && typeof value === 'object')
    return (
      <dl>{Object.entries(value).map(([key, item]) => field(key, item))}</dl>
    );
  if (value === '' || value === null) return 'None';
  return String(value);
}

function field(key: string, value: unknown) {
  return (
    <React.Fragment key={key}>
      <dt>{Object.hasOwn(labels, key) ? labels[key] : key}</dt>
      <dd style={{ marginInlineStart: '1rem', whiteSpace: 'pre-wrap' }}>
        {valueView(value)}
      </dd>
    </React.Fragment>
  );
}

function Picture({
  id,
  src,
  onLoad
}: {
  id: number;
  src: string;
  onLoad?: (id: number) => void;
}) {
  const label =
    id === -1 ? 'App cover'
    : id === 0 ? 'Reference picture'
    : `Picture #${id}`;
  const [failed, setFailed] = useState(false);
  return (
    <figure>
      {failed ? (
        <button type="button" onClick={() => setFailed(false)}>
          Load {label} again
        </button>
      ) : (
        <img
          src={src}
          alt={label}
          onLoad={() => onLoad?.(id)}
          onError={() => setFailed(true)}
          style={{ maxWidth: '100%', maxHeight: '12rem' }}
        />
      )}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export default function AsyncActionPreview({
  card,
  imageBase,
  onImageLoad
}: {
  card: StepCard;
  imageBase: string;
  onImageLoad?: (id: number) => void;
}) {
  const heading = asyncActionTitle(card);
  if (!heading) return null;
  const workshop = card.asyncTask?.workshop;
  const body = card.body as Record<string, unknown>;
  const replacing =
    card.method === 'PUT' && ('images' in body || 'imageIds' in body);
  return (
    <section style={{ overflowWrap: 'anywhere' }}>
      <strong>{heading}</strong>
      {workshop && (
        <div>
          Workshop job #{workshop.jobId}
          {workshop.versionId > 0 &&
            `, app version #${workshop.versionNumber || workshop.versionId}`}
        </div>
      )}
      {card.asyncTask?.referenceCollections?.map((collection) => (
        <div key={collection.id}>
          <strong>
            {collection.name} (collection #{collection.id})
          </strong>
          {collection.note && <p>{collection.note}</p>}
          {valueView(collection.pictures)}
        </div>
      ))}
      {replacing && (
        <div>These pictures will replace the pictures in this collection.</div>
      )}
      {typeof body.referenceImageB64 === 'string' && body.referenceImageB64 && (
        <Picture
          id={0}
          src={body.referenceImageB64}
          onLoad={onImageLoad}
        />
      )}
      {typeof body.thumbnailUrl === 'string' && body.thumbnailUrl && (
        <Picture id={-1} src={body.thumbnailUrl} onLoad={onImageLoad} />
      )}
      {card.asyncTask?.pictures?.map(({ id, path }) => (
        <Picture
          key={id}
          id={id}
          src={`${imageBase}/${path}`}
          onLoad={onImageLoad}
        />
      ))}
      <dl>
        {Object.entries(body)
          .filter(
            ([key]) =>
              key !== 'expectedCollectionKey' &&
              key !== 'expectedReferenceObjectKey' &&
              key !== 'thumbnailUrl' &&
              key !== 'requestId' &&
              key !== 'referenceImageB64'
          )
          .map(([key, value]) => field(key, value))}
      </dl>
    </section>
  );
}
