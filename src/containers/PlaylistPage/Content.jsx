import { useState } from 'react';
import Playlist from '~/components/Playlist';
import { useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useContentState } from '~/helpers/hooks';

export default function Content() {
  const { contentId } = useParams();
  const { videos, loaded } = useContentState({
    contentType: 'playlist',
    contentId: contentId
  });
  const [background, setBackground] = useState();
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
            setBackground(exists ? '#fff' : null);
          }}
        />
      </div>
    </div>
  );
}
