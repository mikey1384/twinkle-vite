import React from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Playlist from '~/components/Playlist';
import Link from '~/components/Link';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function PlaylistModal({
  onHide,
  onLinkClick,
  playlistId,
  title
}: {
  onHide: () => void;
  onLinkClick?: () => void;
  playlistId: number;
  title: string;
}) {
  return (
    <Modal isOpen onClose={onHide} hasHeader={false} bodyPadding={0}>
      <LegacyModalLayout>
        <ErrorBoundary componentPath="PlaylistModal">
          <header>
            <Link
              style={{ fontSize: '2.5rem' }}
              to={`/playlists/${playlistId}`}
            >
              {title}
            </Link>
          </header>
          <main>
            <Playlist onLinkClick={onLinkClick} playlistId={playlistId} />
          </main>
          <footer>
            <Button variant="ghost" onClick={onHide}>
              Close
            </Button>
          </footer>
        </ErrorBoundary>
      </LegacyModalLayout>
    </Modal>
  );
}
