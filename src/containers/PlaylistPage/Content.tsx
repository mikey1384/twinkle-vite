import React, { useState } from 'react';
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
  const [background, setBackground] = useState('none');
  const [title, setTitle] = useState('');
  return (
    <div
      style={{
        background,
        padding: '1rem'
      }}
      className={css`
        border: ${videos?.length && loaded
          ? `1px solid ${Color.borderGray()}`
          : ''};
        background: ${videos?.length && loaded ? '#fff' : 'none'};
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
          playlistId={Number(contentId)}
          onLoad={({ exists, title }) => {
            setTitle(title);
            setBackground(exists ? '#fff' : 'none');
          }}
        />
      </div>
    </div>
  );
}
