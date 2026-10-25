import React from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { chatPinPreview } from '~/helpers/chatPins';
import {
  chatTopicModalClass,
  chatTopicActionsClass,
  chatTopicActionStyle
} from '../Modals/topicStyles';
import { useChatPins } from './context';
import usePendingAction from '~/helpers/hooks/usePendingAction';

export default function PinsDialog() {
  const { pendingAction, runAction } = usePendingAction();
  const pins = useChatPins();
  if (!pins) return null;
  const { snapshot } = pins;
  return (
    <Modal
      isOpen
      onClose={pins.hideDialog}
      title="Pinned messages"
      size="md"
      className={chatTopicModalClass}
    >
      <p
        className={css`
          margin: 0 0 12px;
          color: #526176;
          font-size: calc(14 * var(--px));
          line-height: 1.5;
        `}
      >
        {snapshot?.topicId
          ? 'Pins in this topic.'
          : 'Shared with everyone in this conversation.'}
      </p>
      {pins.loading ? (
        <Loading />
      ) : pins.error ? (
        <div
          role="alert"
          className={css`
            font-size: calc(14 * var(--px));
            padding: 16px 0;
          `}
        >
          <p>{pins.error}</p>
          <Button variant="soft" onClick={pins.refresh}>
            Try again
          </Button>
        </div>
      ) : !snapshot?.pins.length ? (
        <div
          className={css`
            padding: 36px 12px;
            text-align: center;
            color: #526176;
            font-size: calc(15 * var(--px));
            line-height: 1.6;
          `}
        >
          <Icon icon="thumbtack" size="2x" />
          <p style={{ fontWeight: 650, color: '#273449', marginTop: 16 }}>
            No pinned messages yet
          </p>
          <p>
            {snapshot?.canManage
              ? 'Open a message’s ⋯ menu and choose “Pin message” to keep it handy.'
              : 'Important messages pinned here will be easy to find.'}
          </p>
        </div>
      ) : (
        <>
          {snapshot.pins.map((pin) => (
            <article
              key={pin.id}
              className={css`
                padding: 16px 0;
                border-bottom: 1px solid #e9edf2;
                min-width: 0;
              `}
            >
              <div
                className={css`
                  display: flex;
                  gap: 8px;
                  align-items: baseline;
                  flex-wrap: wrap;
                  color: #273449;
                  font-size: calc(14 * var(--px));
                `}
              >
                <strong>{pin.username}</strong>
                <time
                  dateTime={new Date(pin.timeStamp * 1000).toISOString()}
                  className={css`
                    font-size: calc(12 * var(--px));
                    color: #64748b;
                  `}
                >
                  {new Date(pin.timeStamp * 1000).toLocaleDateString(
                    undefined,
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  )}
                </time>
              </div>
              <p
                className={css`
                  margin: 8px 0;
                  font-size: calc(16 * var(--px));
                  line-height: 1.6;
                  color: #273449;
                  white-space: pre-wrap;
                  overflow-wrap: anywhere;
                  display: -webkit-box;
                  -webkit-box-orient: vertical;
                  -webkit-line-clamp: 4;
                  overflow: hidden;
                `}
              >
                {chatPinPreview(pin)}
              </p>
              <div
                className={css`
                  display: flex;
                  flex-wrap: wrap;
                  align-items: center;
                  justify-content: space-between;
                  gap: 4px 12px;
                `}
              >
                <span
                  className={css`
                    color: #64748b;
                    font-size: calc(12 * var(--px));
                  `}
                >
                  <Icon icon="thumbtack" /> Pinned by {pin.pinnedByUsername}
                </span>
                <div className={chatTopicActionsClass}>
                  {snapshot.canManage && (
                    <Button
                      loading={pins.savingId === pin.messageId}
                      variant="ghost"
                      style={chatTopicActionStyle}
                      disabled={pins.savingId !== null}
                      onClick={() => pins.setPin(pin.messageId, false)}
                    >
                      {pins.savingId === pin.messageId ? 'Unpinning…' : 'Unpin'}
                    </Button>
                  )}
                  <Button
                    loading={pendingAction === String(pin.messageId)}
                    variant="soft"
                    style={chatTopicActionStyle}
                    disabled={pins.historyLoading || pendingAction !== null}
                    onClick={() =>
                      runAction(String(pin.messageId), () => pins.jump(pin.messageId))
                    }
                  >
                    Jump to message <Icon icon="arrow-right" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {!!snapshot.nextCursor && (
            <LoadMoreButton
              style={{ marginTop: '1.5rem' }}
              loading={pins.loadingMore}
              onClick={pins.loadMore}
            />
          )}
        </>
      )}
    </Modal>
  );
}
