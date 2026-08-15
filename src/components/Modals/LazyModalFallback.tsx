import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import { reloadForLazyImportRecovery } from '~/helpers/lazyImportHelpers';

const SHOW_FALLBACK_AFTER_MS = 250;
const TAKING_LONG_MS = 8000;

// Normally the modal chunk is loaded before its shown flag is set. Keep this
// delayed shell for direct state changes and genuine chunk stalls, without
// flashing a second modal during an ordinary cached import.
export default function LazyModalFallback({
  loadingText,
  onHide,
  title
}: {
  loadingText: string;
  onHide: () => void;
  title: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    const visibilityTimer = setTimeout(
      () => setIsVisible(true),
      SHOW_FALLBACK_AFTER_MS
    );
    const takingLongTimer = setTimeout(
      () => setIsTakingLong(true),
      TAKING_LONG_MS
    );
    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(takingLongTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Modal
      modalKey="LazyModalFallback"
      isOpen
      onClose={onHide}
      size="lg"
      title={title}
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
          minHeight: '30vh',
          gap: '1.5rem'
        }}
      >
        <Loading text={loadingText} />
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
