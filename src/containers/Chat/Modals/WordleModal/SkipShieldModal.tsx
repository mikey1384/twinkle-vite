import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';

export default function SkipShieldModal({
  checklist,
  onKeepPlaying,
  onCloseAnyway
}: {
  checklist: {
    metLumine: boolean;
    hasWorkingBuild: boolean;
    triedPeerBuildToday: boolean;
  };
  onKeepPlaying: () => void;
  onCloseAnyway: () => void;
}) {
  const navigate = useNavigate();

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
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.8rem;
            `}
          >
            <ChecklistRow
              done={checklist.metLumine && checklist.hasWorkingBuild}
              label="Make something with Lumine 🤖"
              detail={
                checklist.metLumine && !checklist.hasWorkingBuild
                  ? 'almost there — get your app working and this checks off'
                  : 'say hi and Lumine builds it with you — your first exchange works even with an empty battery'
              }
              actionLabel="Open Build"
              onAction={() => navigate('/build?sayHi=lumine')}
            />
            <ChecklistRow
              done={checklist.triedPeerBuildToday}
              label="Try an app another member built today 🎮"
              detail="any app on the Build page counts"
              actionLabel="Explore apps"
              onAction={() => navigate('/build')}
            />
          </div>
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

  function ChecklistRow({
    done,
    label,
    detail,
    actionLabel,
    onAction
  }: {
    done: boolean;
    label: string;
    detail: string;
    actionLabel: string;
    onAction: () => void;
  }) {
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid ${done ? Color.limeGreen() : Color.borderGray()};
          border-radius: ${borderRadius};
          background: ${done ? Color.limeGreen(0.08) : Color.whiteGray()};
        `}
      >
        <Icon
          icon={done ? 'check-circle' : ['far', 'circle']}
          style={{
            fontSize: '1.7rem',
            color: done ? Color.limeGreen() : Color.gray()
          }}
        />
        <div
          className={css`
            flex: 1;
            min-width: 0;
          `}
        >
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: bold;
            `}
          >
            {label}
          </div>
          <div
            className={css`
              font-size: 1.1rem;
              color: ${Color.gray()};
            `}
          >
            {detail}
          </div>
        </div>
        {!done && (
          <Button variant="soft" color="logoBlue" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }
}
