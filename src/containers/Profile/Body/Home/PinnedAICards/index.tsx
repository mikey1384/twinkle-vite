import React, { useEffect, useMemo, useState } from 'react';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AICardsPreview from '~/components/AICardsPreview';
import AICardModal from '~/components/Modals/AICardModal';
import SelectAICardModal from '~/components/Modals/SelectAICardModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

const pinnedLabel = 'Pinned AI Cards';
const editPinsLabel = 'Edit Pins';
const pinCardsLabel = 'Pin AI Cards';
const emptyLabel = 'No pinned AI cards yet';
const emptyOwnLabel = 'Pin your favorite AI cards to show them here';
const MAX_PINNED_AI_CARDS = 10;

export default function PinnedAICards({
  profile,
  selectedTheme
}: {
  profile: any;
  selectedTheme: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const isOwnProfile = userId === profile.id;
  const loadPinnedAICardsOnProfile = useAppContext(
    (v) => v.requestHelpers.loadPinnedAICardsOnProfile
  );
  const pinAICardsOnProfile = useAppContext(
    (v) => v.requestHelpers.pinAICardsOnProfile
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [displayedCardIds, setDisplayedCardIds] = useState<number[]>([]);

  const pinnedCardIds = useMemo(() => {
    const ids = profile?.state?.profile?.pinnedAICardIds;
    if (!Array.isArray(ids)) return [];
    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [profile?.state?.profile?.pinnedAICardIds]);
  const pinnedCardIdsKey = useMemo(
    () => pinnedCardIds.join(','),
    [pinnedCardIds]
  );

  useEffect(() => {
    setDisplayedCardIds(pinnedCardIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedCardIdsKey]);

  useEffect(() => {
    let isMounted = true;
    if (!profile?.id || pinnedCardIds.length === 0) {
      setLoading(false);
      return;
    }
    loadPinnedCards();
    async function loadPinnedCards() {
      setLoading(true);
      try {
        const data = await loadPinnedAICardsOnProfile(profile.id);
        if (!isMounted) return;
        const nextCardIds = Array.isArray(data?.cardIds)
          ? data.cardIds
          : pinnedCardIds;
        setDisplayedCardIds(nextCardIds);
        for (const card of data?.cards || []) {
          onUpdateAICard({ cardId: card.id, newState: card });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loadPinnedAICardsOnProfile,
    onUpdateAICard,
    pinnedCardIdsKey,
    profile.id
  ]);

  const hasPinnedCards = displayedCardIds.length > 0;
  const buttonLabel = isOwnProfile
    ? `${hasPinnedCards ? editPinsLabel : pinCardsLabel} (${
        displayedCardIds.length
      }/${MAX_PINNED_AI_CARDS})`
    : '';

  if (!isOwnProfile && !hasPinnedCards && !loading) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/PinnedAICards/index">
      <SectionPanel
        elevated
        loaded={!loading}
        customColorTheme={selectedTheme}
        title={pinnedLabel}
        isEmpty={!hasPinnedCards}
        emptyMessage={isOwnProfile ? emptyOwnLabel : emptyLabel}
        button={
          isOwnProfile ? (
            <Button
              color="darkerGray"
              variant="solid"
              tone="raised"
              onClick={() => setSelectModalShown(true)}
            >
              <Icon icon={['fas', 'thumbtack']} />
              <span style={{ marginLeft: '0.7rem' }}>{buttonLabel}</span>
            </Button>
          ) : null
        }
      >
        {hasPinnedCards && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AICardsPreview
              isAICardModalShown={!!aiCardModalCardId}
              cardIds={displayedCardIds}
              moreAICardsModalTitle={`${profile.username}'s Pinned AI Cards`}
              onSetAICardModalCardId={setAICardModalCardId}
            />
          </div>
        )}
      </SectionPanel>
      {selectModalShown && (
        <SelectAICardModal
          aiCardModalType="offer"
          currentlySelectedCardIds={displayedCardIds}
          onHide={() => setSelectModalShown(false)}
          onSetAICardModalCardId={setAICardModalCardId}
          onSelectDone={handlePinAICards}
          onDropdownShown={() => {}}
          partner={{ id: profile.id, username: profile.username }}
          maxSelectedCards={MAX_PINNED_AI_CARDS}
          allowEmptySelection
        />
      )}
      {aiCardModalCardId && (
        <AICardModal
          modalOverModal={selectModalShown}
          cardId={aiCardModalCardId}
          onHide={() => setAICardModalCardId(null)}
        />
      )}
    </ErrorBoundary>
  );

  async function handlePinAICards(cardIds: number[]) {
    try {
      const data = await pinAICardsOnProfile({ cardIds });
      const nextCardIds = Array.isArray(data?.cardIds) ? data.cardIds : cardIds;
      const nextState = {
        ...(profile.state || {}),
        profile: {
          ...(profile.state?.profile || {}),
          pinnedAICardIds: nextCardIds
        }
      };
      onSetUserState({
        userId: profile.id,
        newState: { state: nextState }
      });
      setSelectModalShown(false);
    } catch (error) {
      console.error(error);
    }
  }
}
