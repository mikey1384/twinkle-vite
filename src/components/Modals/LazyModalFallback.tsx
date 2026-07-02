import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { reloadForLazyImportRecovery } from '~/helpers/lazyImportHelpers';

const TAKING_LONG_MS = 8000;

// Suspense fallback for lazily-loaded modals. Rendering null while the chunk
// loads means a stalled import looks like the app silently ignored the click
// (and any "modal shown" flag that disables its trigger button stays latched
// with no way out), so this always shows a closable modal instead.
export default function LazyModalFallback({ onHide }: { onHide: () => void }) {
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsTakingLong(true), TAKING_LONG_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal
      modalKey="LazyModalFallback"
      isOpen
      onClose={onHide}
      size="md"
      footer={
        <Button variant="ghost" onClick={onHide}>
          Close
        </Button>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          gap: '1.5rem'
        }}
      >
        <div style={{ color: Color.gray(), fontSize: '1.5rem' }}>
          <Icon icon="spinner" pulse />
          <span style={{ marginLeft: '0.7rem' }}>Loading...</span>
        </div>
        {isTakingLong && (
          <>
            <p
              style={{
                fontSize: '1.3rem',
                color: Color.darkerGray(),
                textAlign: 'center'
              }}
            >
              This is taking longer than usual. Check your connection, or
              reload to get the latest version of Twinkle.
            </p>
            <Button
              color="logoBlue"
              variant="solid"
              onClick={reloadForLazyImportRecovery}
            >
              Reload
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
