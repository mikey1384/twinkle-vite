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
  loading,
  onChessButtonClick,
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
  loading: boolean;
  onChessButtonClick: () => void;
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
        <Button
          disabled={loading || isChessBanned || isRestrictedChannel}
          skeuomorphic
          onClick={onChessButtonClick}
          color={buttonColor}
          hoverColor={buttonHoverColor}
        >
          <Icon size="lg" icon={['fas', 'chess']} />
          <span className="desktop" style={{ marginLeft: '0.7rem' }}>
            Chess
          </span>
        </Button>
      ) : hasWordleButton ? (
        <Button
          disabled={loading}
          skeuomorphic
          onClick={onWordleButtonClick}
          color={buttonColor}
          hoverColor={buttonHoverColor}
        >
          W<span className="desktop">ordle</span>
        </Button>
      ) : null}
      {topicId && (
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
