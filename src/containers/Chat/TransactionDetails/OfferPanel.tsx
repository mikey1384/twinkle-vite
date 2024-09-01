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

export default function OfferPanel({
  imOffering,
  isAICardModalShown,
  isOnModal,
  isTrade,
  offerCardIds,
  offerCoins,
  offerGroupIds,
  groupObjs,
  onSetAICardModalCardId,
  showCardDetailsOnThumbClick
}: {
  imOffering: boolean;
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  isTrade?: boolean;
  offerCardIds: number[];
  offerCoins: number;
  offerGroupIds: number[];
  groupObjs: Record<number, any>;
  onSetAICardModalCardId: (cardId: number) => void;
  showCardDetailsOnThumbClick: boolean;
}) {
  const [moreGroupsModalShown, setMoreGroupsModalShown] = useState(false);

  const selectedGroups = useMemo(
    () =>
      offerGroupIds.map((id) => ({
        ...groupObjs[id],
        id,
        channelName: groupObjs[id]?.channelName || `Group ${id}`,
        members: groupObjs[id]?.members || [],
        isPublic: groupObjs[id]?.isPublic,
        thumbPath: groupObjs[id]?.thumbPath
      })),
    [offerGroupIds, groupObjs]
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
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      {isTrade ? (
        <div
          className={css`
            font-size: 1.6rem;
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
          <span style={{ marginRight: '1rem' }}>Offered...</span>
          <Icon
            icon={`arrow-${imOffering ? 'up' : 'down'}`}
            color={imOffering ? Color.red() : Color.green()}
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
        {offerCardIds.length ? (
          <div style={{ textAlign: 'center' }}>
            <AICardsPreview
              isAICardModalShown={isAICardModalShown}
              isOnModal={isOnModal}
              cardIds={offerCardIds}
              onSetAICardModalCardId={
                showCardDetailsOnThumbClick ? onSetAICardModalCardId : undefined
              }
            />
            {(offerCoins > 0 || selectedGroups.length > 0) && (
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
        {offerCoins > 0 && (
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
              {addCommasToNumber(offerCoins)}
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
