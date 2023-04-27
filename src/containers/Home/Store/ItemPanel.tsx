import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import ProgressBar from '~/components/ProgressBar';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const freeLabel = localize('free');

ItemPanel.propTypes = {
  children: PropTypes.node,
  currentLvl: PropTypes.number,
  itemName: PropTypes.string,
  itemDescription: PropTypes.node,
  isLeveled: PropTypes.bool,
  maxLvl: PropTypes.number,
  karmaPoints: PropTypes.number,
  locked: PropTypes.bool,
  requiredKarmaPoints: PropTypes.number,
  onUnlock: PropTypes.func,
  style: PropTypes.object,
  unlocking: PropTypes.bool,
  upgradeIcon: PropTypes.node
};

export default function ItemPanel({
  children,
  currentLvl,
  itemName,
  itemDescription,
  isLeveled,
  locked: notUnlocked,
  maxLvl,
  style,
  karmaPoints,
  onUnlock,
  requiredKarmaPoints,
  unlocking,
  upgradeIcon
}) {
  const [highlighted, setHighlighted] = useState(false);
  const { userId } = useKeyContext((v) => v.myState);
  const unlockProgress = useMemo(() => {
    return Math.floor(Math.min((karmaPoints * 100) / requiredKarmaPoints, 100));
  }, [karmaPoints, requiredKarmaPoints]);
  const locked = useMemo(() => {
    return notUnlocked || (isLeveled && currentLvl < maxLvl);
  }, [currentLvl, notUnlocked, isLeveled, maxLvl]);
  const notUpgraded = useMemo(() => {
    return !notUnlocked && isLeveled && currentLvl < maxLvl;
  }, [currentLvl, isLeveled, maxLvl, notUnlocked]);
  const requirementLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${addCommasToNumber(requiredKarmaPoints)}KP 필요`;
    }
    return `Requires ${addCommasToNumber(requiredKarmaPoints)} KP`;
  }, [requiredKarmaPoints]);
  const requirementDescriptionLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          본 아이템을 {notUpgraded ? '업그레이드' : '잠금 해제'}하시려면
          카마포인트 <b>{addCommasToNumber(requiredKarmaPoints)}점</b>이
          필요합니다. 회원님의 카마포인트는 현재{' '}
          <b>{addCommasToNumber(karmaPoints)}점</b>입니다
        </>
      );
    }
    return (
      <>
        You need <b>{addCommasToNumber(requiredKarmaPoints)} karma points</b> to{' '}
        {notUpgraded ? 'upgrade' : 'unlock'} this item. You have{' '}
        <b>
          {addCommasToNumber(karmaPoints)} karma point
          {karmaPoints === 1 ? '' : 's'}
        </b>
      </>
    );
  }, [karmaPoints, notUpgraded, requiredKarmaPoints]);

  return (
    <div
      className={css`
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
        }
      `}
      style={{
        ...(highlighted
          ? {
              boxShadow: `0 0 10px ${Color.gold(0.8)}`,
              border: `1px solid ${Color.gold(0.8)}`
            }
          : { border: `1px solid ${Color.borderGray()}` }),
        background: '#fff',
        transition: 'border 0.2s, box-shadow 0.2s',
        padding: '1rem',
        ...style
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '2rem' }}>{itemName}</div>
      {locked && (
        <>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {requirementLabel}
          </p>
          {itemDescription && (
            <div style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
              {itemDescription}
            </div>
          )}
        </>
      )}
      {!requiredKarmaPoints && !karmaPoints && (
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{freeLabel}</p>
      )}
      {!requiredKarmaPoints && !userId && itemDescription && (
        <div style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
          {itemDescription}
        </div>
      )}
      {userId &&
        (locked ? (
          <>
            {onUnlock ? (
              <div
                style={{
                  marginTop: '2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.7rem'
                }}
              >
                {upgradeIcon && notUpgraded ? (
                  upgradeIcon
                ) : (
                  <Icon size="3x" icon="lock" />
                )}
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Button
                    disabled={unlockProgress < 100}
                    loading={unlocking}
                    skeuomorphic
                    color="green"
                    onClick={async () => {
                      await onUnlock();
                      setHighlighted(true);
                      setTimeout(() => setHighlighted(false), 500);
                    }}
                  >
                    <Icon icon={notUpgraded ? 'level-up' : 'unlock'} />
                    <span style={{ marginLeft: '0.7rem' }}>
                      {notUpgraded ? 'Upgrade' : 'Unlock'}
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: '2rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.7rem'
                }}
              >
                <Icon size="3x" icon="question" />
              </div>
            )}
            <ProgressBar
              color={unlockProgress === 100 ? Color.green() : null}
              progress={unlockProgress}
            />
            <p
              style={{
                fontSize: '1.2rem',
                marginTop: '0.5rem',
                textAlign: 'center'
              }}
            >
              {requirementDescriptionLabel}
            </p>
          </>
        ) : (
          children
        ))}
    </div>
  );
}
