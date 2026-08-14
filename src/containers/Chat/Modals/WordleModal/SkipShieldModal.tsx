import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import SkipShieldChecklist, {
  type SkipShieldChecklistState
} from './SkipShieldChecklist';

export default function SkipShieldModal({
  checklist,
  onKeepPlaying,
  onCloseAnyway
}: {
  checklist: SkipShieldChecklistState;
  onKeepPlaying: () => void;
  onCloseAnyway: () => void;
}) {
  return (
    <ErrorBoundary componentPath="Chat/Modals/WordleModal/SkipShieldModal">
      <Modal
        modalKey="WordleSkipShieldModal"
        isOpen={true}
        onClose={onKeepPlaying}
        modalLevel={1}
        size="sm"
        hasHeader
        title="Saving this word for another day? 🎯"
        footer={
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Button variant="ghost" onClick={onCloseAnyway}>
              Close anyway
            </Button>
            <Button color="blue" onClick={onKeepPlaying}>
              Keep playing
            </Button>
          </div>
        }
      >
        <main
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1.3rem;
            padding: 0.5rem 0.5rem 1rem 0.5rem;
          `}
        >
          <p
            className={css`
              font-size: 1.3rem;
              line-height: 1.5;
            `}
          >
            Totally fine — your streak can stay safe! Skipping just comes with a
            little side quest now: check out something else on Twinkle today. ✨
          </p>
          <SkipShieldChecklist checklist={checklist} />
          <p
            className={css`
              font-size: 1.2rem;
              line-height: 1.5;
              color: ${Color.darkerGray()};
            `}
          >
            Finish both and today won{`'`}t touch your streak. And hey — the
            word will still be here if you feel brave later. 💪
          </p>
        </main>
      </Modal>
    </ErrorBoundary>
  );
}
