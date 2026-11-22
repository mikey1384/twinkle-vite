import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';

export interface AssetHandoffDestination {
  kind:
    | 'avatar'
    | 'cover'
    | 'profile_gallery'
    | 'subject'
    | 'comment'
    | 'content_thumbnail'
    | 'chat_thumbnail'
    | 'slide_thumbnail'
    | 'build_thumbnail'
    | 'chat_message';
  id?: number;
  contentType?: 'subject' | 'url';
  topicId?: number;
  caption?: string;
  position?: string;
}

export default function AssetHandoffPreview({
  proposalId,
  destination,
  onReady
}: {
  proposalId: string;
  destination?: AssetHandoffDestination;
  onReady: (proposalId: string) => void;
}) {
  const loadPreview = useAppContext(
    (v) => v.requestHelpers.loadAssetHandoffPreview
  );
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setUrl('');
    setFailed(false);
    onReady('');
    loadPreview(proposalId)
      .then((blob: Blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // Request helpers are stable context actions, not render dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, attempt, onReady]);

  return (
    <div className={previewClass} {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}>
      {url && !failed ? (
        <img
          src={url}
          alt="The image to use"
          style={
            destination?.kind === 'avatar' ||
            destination?.kind === 'chat_thumbnail'
              ? { width: '16rem', height: '16rem', objectFit: 'cover', borderRadius: '50%' }
              : destination?.kind === 'cover'
                ? { width: '100%', height: '13rem', objectFit: 'cover', objectPosition: (destination.position || '50,50').split(',').map((n) => `${n}%`).join(' ') }
                : undefined
          }
          onLoad={() => onReady(proposalId)}
          onError={() => {
            setFailed(true);
            onReady('');
          }}
        />
      ) : failed ? (
        <div role="status">
          <p>Couldn’t load the image preview.</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <p role="status">Loading image preview…</p>
      )}
      {(destination?.kind === 'avatar' ||
        destination?.kind === 'profile_gallery' ||
        destination?.kind === 'chat_message') &&
        destination.caption && (
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Caption: {destination.caption}</p>
        )}
    </div>
  );
}
const previewClass = css`
  width: 100%;
  min-width: 0;
  font-size: 1.1rem;
  img {
    display: block;
    max-width: 100%;
    max-height: 28rem;
    width: auto;
    height: auto;
    border-radius: 1rem;
  }
  p {
    margin: 0.5rem 0;
  }
  button {
    font: inherit;
    padding: 0.6rem 1rem;
    border-radius: 0.6rem;
    border: 1px solid #94a3b8;
    background: white;
    color: #2f3747;
    cursor: pointer;
  }
`;
