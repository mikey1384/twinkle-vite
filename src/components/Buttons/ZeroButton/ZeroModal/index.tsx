import React, { useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import ZeroMessage from './ZeroMessage';
import Rewrite from './Rewrite';
import Upgrade from './Upgrade';
import Main from './Main';

const workshopLabel = 'AI Card Workshop';

export default function ZeroModal({
  contentId,
  contentType,
  onHide,
  modalOverModal,
  content
}: {
  contentId?: number;
  contentType?: string;
  onHide: () => void;
  modalOverModal?: boolean;
  content?: string;
}) {
  const [selectedSection, setSelectedSection] = useState('rewrite');
  return (
    <Modal
      isOpen
      size="xl"
      onClose={onHide}
      closeOnBackdropClick={false}
      modalLevel={modalOverModal ? 2 : undefined}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header>
          <div
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <ZeroMessage />
          </div>
        </header>
        <main style={{ padding: 0 }}>
          {selectedSection === 'main' && (
            <Main
              content={content}
              contentId={contentId}
              contentType={contentType}
              onSetSelectedSection={setSelectedSection}
              workshopLabel={workshopLabel}
            />
          )}
          {selectedSection === 'upgrade' && (
            <Upgrade
              contentId={contentId}
              contentType={contentType}
              onSetSelectedSection={setSelectedSection}
              workshopLabel={workshopLabel}
            />
          )}
          {selectedSection === 'rewrite' && (
            <Rewrite
              contentId={contentId}
              contentType={contentType}
              content={content}
              onSetSelectedSection={setSelectedSection}
              workshopLabel={workshopLabel}
            />
          )}
        </main>
        <footer>
          <Button variant="ghost" onClick={onHide}>
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );
}
