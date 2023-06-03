import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function LeftButtons({
  buttonColor,
  buttonHoverColor,
  hasWordleButton,
  isChessBanned,
  isRestrictedChannel,
  isZeroChannel,
  isTwoPeopleChannel,
  loading,
  onChessButtonClick,
  onWordleButtonClick
}: {
  buttonColor: string;
  buttonHoverColor: string;
  hasWordleButton: boolean;
  isChessBanned: boolean;
  isZeroChannel: boolean;
  isRestrictedChannel: boolean;
  isTwoPeopleChannel: number | boolean;
  loading: boolean;
  onChessButtonClick: () => void;
  onWordleButtonClick: () => void;
}) {
  return (
    <>
      {isTwoPeopleChannel ? (
        <Button
          disabled={
            loading || isChessBanned || isZeroChannel || isRestrictedChannel
          }
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
    </>
  );
}
