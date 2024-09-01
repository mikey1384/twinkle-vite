import React, { useState, useMemo } from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import SelectedGroupItem from '~/containers/Chat/SelectedGroupItem';
import ShowMoreGroupsButton from './ShowMoreGroupsButton';
import MoreGroupsModal from './MoreGroupsModal';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function WantPanel({
  imOffering,
  isAICardModalShown,
  isOnModal,
  isTrade,
  onSetAICardModalCardId,
  wantCardIds,
  wantCoins,
  wantGroupIds,
  groupObjs,
  showCardDetailsOnThumbClick,
  style
}: {
  imOffering: boolean;
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  isTrade: boolean;
  onSetAICardModalCardId: (cardId: number) => void;
  wantCardIds: number[];
  wantCoins: number;
  wantGroupIds: number[];
  groupObjs: Record<number, any>;
  showCardDetailsOnThumbClick: boolean;
  style: React.CSSProperties;
}) {
  const [moreGroupsModalShown, setMoreGroupsModalShown] = useState(false);

  const selectedGroups = useMemo(
    () =>
      wantGroupIds.map((id) => ({
        ...groupObjs[id],
        id,
        channelName: groupObjs[id]?.channelName || `Group ${id}`,
        members: groupObjs[id]?.members || [],
        isPublic: groupObjs[id]?.isPublic,
        thumbPath: groupObjs[id]?.thumbPath
      })),
    [wantGroupIds, groupObjs]
  );

  const { displayedGroups, numMore } = useMemo(() => {
    const numShown = deviceIsMobile ? 3 : 5;
    const displayed = selectedGroups.slice(0, numShown);
    return {
      displayedGroups: displayed,
      numMore: selectedGroups.length - displayed.length
    };
  }, [selectedGroups]);

  return (
    <div
      className="panel"
      style={{
        width: '100%',
        borderRadius,
        fontFamily: 'Roboto, monospace',
        border: `1px solid ${Color.borderGray()}`,
        ...style
      }}
    >
      {isTrade ? (
        <div
          className={css`
            font-size: 1.7rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
          style={{
            padding: '1rem',
            fontWeight: 'bold',
            fontFamily: 'Roboto, monospace',
            textAlign: 'center',
            borderBottom: `1px solid ${Color.borderGray()}`
          }}
        >
          <span style={{ marginRight: '1rem' }}>in exchange for...</span>
          <Icon
            icon={`arrow-${imOffering ? 'down' : 'up'}`}
            color={imOffering ? Color.green() : Color.red()}
          />
        </div>
      ) : null}
      <div
        style={{
          padding: '1rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        {wantCardIds.length ? (
          <div style={{ textAlign: 'center' }}>
            <AICardsPreview
              isAICardModalShown={isAICardModalShown}
              isOnModal={isOnModal}
              cardIds={wantCardIds}
              onSetAICardModalCardId={
                showCardDetailsOnThumbClick ? onSetAICardModalCardId : undefined
              }
            />
            {(wantCoins > 0 || selectedGroups.length > 0) && (
              <div
                style={{
                  padding: '0.5rem',
                  fontFamily: 'Roboto, Helvetica, monospace',
                  fontSize: '1.5rem'
                }}
              >
                and
              </div>
            )}
          </div>
        ) : null}
        {wantCoins > 0 && (
          <div>
            <Icon
              style={{ color: Color.brownOrange() }}
              icon={['far', 'badge-dollar']}
            />
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: Color.darkerGray(),
                marginLeft: '0.3rem'
              }}
            >
              {addCommasToNumber(wantCoins)}
            </span>
          </div>
        )}
        {selectedGroups.length > 0 && (
          <div style={{ marginTop: '1rem', width: '100%' }}>
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                justify-content: ${selectedGroups.length === 1
                  ? 'center'
                  : 'space-between'};
                width: 100%;
              `}
            >
              {displayedGroups.map((group) => (
                <SelectedGroupItem
                  key={group.id}
                  group={group}
                  isConfirmationView={true}
                  style={
                    selectedGroups.length === 1 ? { width: '50%' } : undefined
                  }
                />
              ))}
              {numMore > 0 && (
                <ShowMoreGroupsButton
                  onClick={() => setMoreGroupsModalShown(true)}
                  numMore={numMore}
                />
              )}
            </div>
          </div>
        )}
      </div>
      {moreGroupsModalShown && (
        <MoreGroupsModal
          groups={selectedGroups}
          onHide={() => setMoreGroupsModalShown(false)}
        />
      )}
    </div>
  );
}
