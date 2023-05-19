import React, { useMemo, useState } from 'react';
import Playlist from '~/components/Playlist';
import { useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useContentState } from '~/helpers/hooks';

export default function Content() {
  const { contentId = 0 } = useParams();
  const { videos, loaded } = useContentState({
    contentType: 'playlist',
    contentId: Number(contentId)
  });
  const [title, setTitle] = useState('');
  const border = useMemo(
    () => (videos?.length && loaded ? `1px solid ${Color.borderGray()}` : ''),
    [videos, loaded]
  );
  const background = useMemo(
    () => (videos?.length && loaded ? '#fff' : 'none'),
    [videos, loaded]
  );
  return (
    <div
      style={{
        border,
        background,
        padding: '1rem'
      }}
      className={css`
        @media (max-width: ${mobileMaxWidth}) {
          border-top: none;
          border-left: none;
          border-right: none;
        }
      `}
    >
      {title && <p style={{ fontSize: '3rem', fontWeight: 'bold' }}>{title}</p>}
      <div style={{ marginTop: '1rem' }}>
        <Playlist
          playlistId={contentId}
          onLoad={({ title }) => {
            setTitle(title);
          }}
        />
      </div>
    </div>
  );
}
