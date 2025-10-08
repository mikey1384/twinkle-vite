import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function LeftButtons({
  buttonColor,
  buttonHoverColor,
  hasWordleButton,
  isChessBanned,
  isRestrictedChannel,
  isTwoPeopleChannel,
  legacyTopicButtonShown,
  loading,
  nextDayTimeStamp,
  onChessButtonClick,
  onOmokButtonClick,
  onTopicButtonClick,
  onWordleButtonClick,
  topicId
}: {
  buttonColor: string;
  buttonHoverColor: string;
  hasWordleButton: boolean;
  isChessBanned: boolean;
  isRestrictedChannel: boolean;
  isTwoPeopleChannel: number | boolean;
  legacyTopicButtonShown: boolean;
  loading: boolean;
  nextDayTimeStamp: number;
  onChessButtonClick: () => void;
  onOmokButtonClick: () => void;
  onTopicButtonClick: () => void;
  onWordleButtonClick: () => void;
  topicId: number;
}) {
  return (
    <div
      style={{
        margin: '0.2rem 1rem 0.2rem 0',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {isTwoPeopleChannel ? (
        <>
          <Button
            disabled={loading || isChessBanned || isRestrictedChannel}
            skeuomorphic
            onClick={onChessButtonClick}
            color={buttonColor}
            hoverColor={buttonHoverColor}
          >
            <Icon size="lg" icon={['fas', 'chess']} />
          </Button>
          <Button
            disabled={loading || isChessBanned || isRestrictedChannel}
            style={{ marginLeft: '0.5rem' }}
            skeuomorphic
            onClick={onOmokButtonClick}
            color={buttonColor}
            hoverColor={buttonHoverColor}
          >
            O<span className="desktop">mok</span>
          </Button>
        </>
      ) : hasWordleButton ? (
        <Button
          loading={loading || !nextDayTimeStamp}
          skeuomorphic
          onClick={onWordleButtonClick}
          color={buttonColor}
          hoverColor={buttonHoverColor}
        >
          W<span className="desktop">ordle</span>
        </Button>
      ) : null}
      {topicId && legacyTopicButtonShown && (
        <Button
          disabled={loading}
          style={{
            marginLeft: isTwoPeopleChannel || hasWordleButton ? '0.5rem' : 0
          }}
          skeuomorphic
          onClick={onTopicButtonClick}
          color={buttonColor}
          hoverColor={buttonHoverColor}
        >
          <Icon
            size={isTwoPeopleChannel || hasWordleButton ? null : 'lg'}
            icon="comment"
          />
        </Button>
      )}
    </div>
  );
}
