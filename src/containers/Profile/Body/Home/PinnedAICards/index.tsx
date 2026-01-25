import React, { useEffect, useMemo, useState } from 'react';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AICardsPreview from '~/components/AICardsPreview';
import AICardModal from '~/components/Modals/AICardModal';
import SelectAICardModal from '~/components/Modals/SelectAICardModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useProfileContext
} from '~/contexts';
import { useProfileState } from '~/helpers/hooks';

const pinnedLabel = 'AI Cards';
const pinCardsLabel = 'Pin Cards';
const emptyLabel = 'No AI Cards to show here yet';
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
  const { pinnedAICards: cachedPinnedAICards } = useProfileState(
    profile.username
  );
  const loadPinnedAICardsOnProfile = useAppContext(
    (v) => v.requestHelpers.loadPinnedAICardsOnProfile
  );
  const pinAICardsOnProfile = useAppContext(
    (v) => v.requestHelpers.pinAICardsOnProfile
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadPinnedAICards = useProfileContext(
    (v) => v.actions.onLoadPinnedAICards
  );
  const onSetPinnedAICards = useProfileContext(
    (v) => v.actions.onSetPinnedAICards
  );
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [displayedCardIds, setDisplayedCardIds] = useState<number[]>([]);
  const [isTopCards, setIsTopCards] = useState(false);
  const [loadedForProfileId, setLoadedForProfileId] = useState<number | null>(null);

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
  const selectedCardIdsForPinning = useMemo(
    () => (isTopCards ? [] : pinnedCardIds),
    [isTopCards, pinnedCardIds]
  );
  const cachedCardIds = useMemo(() => {
    const ids = cachedPinnedAICards?.cardIds;
    if (!Array.isArray(ids)) return [];
    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [cachedPinnedAICards?.cardIds]);
  const cachedCardIdsKey = useMemo(
    () => cachedCardIds.join(','),
    [cachedCardIds]
  );
  const hasCachedPinnedCards =
    cachedPinnedAICards?.loaded && cachedCardIdsKey === pinnedCardIdsKey;

  useEffect(() => {
    if (hasCachedPinnedCards) {
      setDisplayedCardIds(cachedCardIds);
      return;
    }
    // Reset state when profile changes - wait for API validation
    // This prevents showing previous profile's cards
    setDisplayedCardIds([]);
    setLoadedForProfileId(null);
  }, [cachedCardIds, hasCachedPinnedCards, pinnedCardIdsKey, profile?.id]);

  useEffect(() => {
    let isMounted = true;
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    // If pinned cards now exist but we're still showing top cards, switch to pinned cards
    if (pinnedCardIds.length > 0 && isTopCards) {
      setDisplayedCardIds(pinnedCardIds);
      setIsTopCards(false);
      return;
    }
    // Skip if already loaded for this profile AND we have content to show.
    // If pinned cards become empty and we're not showing top cards, re-fetch to get top cards.
    if (loadedForProfileId === profile.id && (pinnedCardIds.length > 0 || isTopCards)) {
      return;
    }
    // Only use cache if there are actual pinned cards cached.
    // If empty, we still need the API to fetch top cards as fallback.
    if (hasCachedPinnedCards && pinnedCardIds.length > 0) {
      setLoading(false);
      setIsTopCards(false);
      setLoadedForProfileId(profile.id);
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
        setIsTopCards(Boolean(data?.isTopCards));
        if (!data?.isTopCards) {
          onLoadPinnedAICards({
            username: profile.username,
            cardIds: nextCardIds
          });
          // Sync user state if backend returned different cards
          const nextCardIdsKey = nextCardIds
            .map((id: number) => Number(id))
            .filter((id: number) => Number.isFinite(id) && id > 0)
            .join(',');
          if (nextCardIdsKey !== pinnedCardIdsKey) {
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
          }
        }
        for (const card of data?.cards || []) {
          onUpdateAICard({ cardId: card.id, newState: card });
        }
        setLoadedForProfileId(profile.id);
      } catch (error) {
        console.error(error);
        // Fallback to unvalidated IDs on error to avoid blank UI
        if (isMounted && displayedCardIds.length === 0) {
          setDisplayedCardIds(pinnedCardIds);
        }
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
    hasCachedPinnedCards,
    pinnedCardIds,
    pinnedCardIdsKey,
    profile?.id,
    profile?.username
  ]);

  const hasCards = displayedCardIds.length > 0;
  const buttonLabel = isOwnProfile
    ? isTopCards
      ? `${pinCardsLabel} (0/${MAX_PINNED_AI_CARDS})`
      : `${pinCardsLabel} (${displayedCardIds.length}/${MAX_PINNED_AI_CARDS})`
    : '';

  // Hide section for visitors if no cards to display
  if (!isOwnProfile && !hasCards && !loading) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/PinnedAICards/index">
      <SectionPanel
        elevated
        loaded={!loading}
        customColorTheme={selectedTheme}
        title={pinnedLabel}
        isEmpty={!hasCards}
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
        {hasCards && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AICardsPreview
              isAICardModalShown={!!aiCardModalCardId}
              cardIds={displayedCardIds}
              exploreUrl={`/ai-cards/?search[owner]=${profile.username}`}
              moreAICardsModalTitle={`${profile.username}'s AI Cards`}
              onSetAICardModalCardId={setAICardModalCardId}
              themeColor={selectedTheme}
            />
          </div>
        )}
      </SectionPanel>
      {selectModalShown && (
        <SelectAICardModal
          aiCardModalType="offer"
          currentlySelectedCardIds={selectedCardIdsForPinning}
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
      onSetPinnedAICards({
        username: profile.username,
        cardIds: nextCardIds
      });
      setDisplayedCardIds(nextCardIds);
      setSelectModalShown(false);
    } catch (error) {
      console.error(error);
    }
  }
}
