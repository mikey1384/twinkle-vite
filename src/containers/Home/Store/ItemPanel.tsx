import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import ProgressBar from '~/components/ProgressBar';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { karmaPointTable, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';
import { homePanelClass } from '~/theme/homePanels';
import { useHomePanelVars } from '~/theme/useHomePanelVars';

const freeLabel = localize('free');

export default function ItemPanel({
  children,
  currentLvl,
  itemKey,
  itemName,
  itemDescription,
  isLeveled,
  locked: notUnlocked,
  loading,
  maxLvl,
  style,
  karmaPoints,
  onUnlock,
  unlocking,
  upgradeIcon
}: {
  children?: React.ReactNode;
  currentLvl?: number;
  itemKey: string;
  itemName: string;
  itemDescription?: React.ReactNode;
  isLeveled?: boolean;
  maxLvl?: number;
  karmaPoints?: number;
  locked?: boolean;
  loading?: boolean;
  onUnlock?: () => void;
  style?: React.CSSProperties;
  unlocking?: boolean;
  upgradeIcon?: React.ReactNode;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const { accentColor, accentTint, panelVars, themeStyles } = useHomePanelVars();
  const requiredKarmaPoints = useMemo(() => {
    if (!isLeveled) {
      return karmaPointTable[itemKey];
    }
    return karmaPointTable[itemKey][currentLvl || 0];
  }, [currentLvl, isLeveled, itemKey]);
  const previouslyRequiredKarmaPoints = useMemo(() => {
    if (!isLeveled || !currentLvl) {
      return 0;
    }
    return karmaPointTable[itemKey][currentLvl - 1];
  }, [currentLvl, isLeveled, itemKey]);
  const displayedPreviouslyRequiredKarmaPoints = useMemo(() => {
    if (!previouslyRequiredKarmaPoints) return null;
    return addCommasToNumber(previouslyRequiredKarmaPoints || 0);
  }, [previouslyRequiredKarmaPoints]);
  const displayedRequiredKarmaPoints = useMemo(() => {
    if (!requiredKarmaPoints) return null;
    return addCommasToNumber(requiredKarmaPoints || 0);
  }, [requiredKarmaPoints]);
  const unlockProgress = useMemo(() => {
    return Math.floor(
      Math.min(
        Math.max(
          ((karmaPoints || 0) - previouslyRequiredKarmaPoints) * 100,
          0
        ) /
          ((requiredKarmaPoints || 0) - previouslyRequiredKarmaPoints),
        100
      )
    );
  }, [karmaPoints, previouslyRequiredKarmaPoints, requiredKarmaPoints]);
  const locked = useMemo(() => {
    return notUnlocked || (isLeveled && (currentLvl || 0) < (maxLvl || 0));
  }, [currentLvl, notUnlocked, isLeveled, maxLvl]);
  const notUpgraded = useMemo(() => {
    return !notUnlocked && isLeveled && (currentLvl || 0) < (maxLvl || 0);
  }, [currentLvl, isLeveled, maxLvl, notUnlocked]);
  const requirementLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${displayedRequiredKarmaPoints}KP 필요`;
    }
    return `Requires ${displayedRequiredKarmaPoints} KP`;
  }, [displayedRequiredKarmaPoints]);
  const requirementDescriptionLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          본 아이템을 {notUpgraded ? '업그레이드' : '잠금 해제'}하시려면
          카마포인트 <b>{displayedRequiredKarmaPoints}점</b>이 필요합니다.
          회원님의 카마포인트는 현재{' '}
          <b>{addCommasToNumber(karmaPoints || 0)}점</b>입니다
        </>
      );
    }
    return (
      <>
        You need <b>{displayedRequiredKarmaPoints} karma points</b> to{' '}
        {notUpgraded ? 'upgrade' : 'unlock'} this item. You have{' '}
        <b>
          {addCommasToNumber(karmaPoints || 0)} karma point
          {karmaPoints === 1 ? '' : 's'}
        </b>
      </>
    );
  }, [karmaPoints, notUpgraded, displayedRequiredKarmaPoints]);
  const baseBorderColor = useMemo(() => {
    if (themeStyles.border) {
      return themeStyles.border;
    }
    if (locked) return Color.borderGray(0.75);
    return Color.borderGray(0.65);
  }, [locked, themeStyles.border]);

  const panelStyle = useMemo(
    () =>
      ({
        ...panelVars,
        ['--home-panel-border' as const]: baseBorderColor,
        ['--home-panel-color' as const]: Color.darkerGray(),
        ['--home-panel-gap' as const]: '1.4rem',
        ['--home-panel-padding' as const]: '2.2rem 2.4rem',
        ['--home-panel-mobile-padding' as const]: '1.8rem 1.6rem',
        ['--home-panel-card-border' as const]:
          themeStyles.border || Color.borderGray(0.65),
        ['--home-panel-tint' as const]:
          themeStyles.hoverBg || accentTint || Color.logoBlue(0.12),
        ...style
      }) as React.CSSProperties,
    [accentTint, baseBorderColor, panelVars, style, themeStyles.border, themeStyles.hoverBg]
  );

  return (
    <div
      className={homePanelClass}
      style={panelStyle}
    >
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          font-weight: 700;
          font-size: 2.1rem;
          color: ${Color.darkerGray()};
        `}
      >
        <span>{itemName}</span>
        {locked && requiredKarmaPoints ? (
          <span
            className={css`
              font-size: 1.4rem;
              padding: 0.35rem 1rem;
              border-radius: 9999px;
              border: 1px solid rgba(148, 163, 184, 0.4);
              background: rgba(255, 255, 255, 0.9);
              color: var(--home-panel-accent, ${accentColor});
              font-weight: 600;
            `}
          >
            {requirementLabel}
          </span>
        ) : null}
      </div>
      {locked && (
        <>
          {itemDescription && (
            <div style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
              {itemDescription}
            </div>
          )}
        </>
      )}
      {!requiredKarmaPoints && !karmaPoints && (
        <p
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: Color.darkGray()
          }}
        >
          {freeLabel}
        </p>
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
                    loading={unlocking || loading}
                    variant="soft"
                    tone="raised"
                    color="green"
                    onClick={async () => {
                      await onUnlock();
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
              color={unlockProgress === 100 ? Color.green() : ''}
              progress={unlockProgress}
              startLabel={
                displayedPreviouslyRequiredKarmaPoints
                  ? `level ${
                      currentLvl || 1
                    } (${displayedPreviouslyRequiredKarmaPoints} KP)`
                  : null
              }
              endLabel={
                displayedRequiredKarmaPoints
                  ? `level ${
                      (currentLvl || 1) + 1
                    } (${displayedRequiredKarmaPoints} KP)`
                  : null
              }
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
