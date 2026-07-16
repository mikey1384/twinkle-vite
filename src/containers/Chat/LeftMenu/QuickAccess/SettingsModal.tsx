import React, { useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import SortableListGroup from '~/components/SortableListGroup';
import SearchInput from '~/components/Texts/SearchInput';
import UserSearchResultRow from '~/components/UserSearchResultRow';
import { Color } from '~/constants/css';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import { css } from '@emotion/css';
import QuickAccessAvatar from './Avatar';
import {
  CHAT_QUICK_ACCESS_LIMIT,
  type ChatQuickAccessMode,
  type ChatQuickAccessPartner
} from './types';
import useQuickAccessPartnerIdentity from './usePartnerIdentity';

export default function QuickAccessSettingsModal({
  mode,
  initialPartners,
  onHide
}: {
  mode: ChatQuickAccessMode;
  initialPartners: ChatQuickAccessPartner[];
  onHide: () => void;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const userId = useKeyContext((v) => v.myState.userId);
  const searchChat = useAppContext((v) => v.requestHelpers.searchChat);
  const putFavoriteChannel = useAppContext(
    (v) => v.requestHelpers.putFavoriteChannel
  );
  const saveChatQuickAccess = useAppContext(
    (v) => v.requestHelpers.saveChatQuickAccess
  );
  const resetChatQuickAccess = useAppContext(
    (v) => v.requestHelpers.resetChatQuickAccess
  );
  const onApplyCanonicalChatSidebarState = useChatContext(
    (v) => v.actions.onApplyCanonicalChatSidebarState
  );
  const [partners, setPartners] = useState(initialPartners);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [favoritePartnerId, setFavoritePartnerId] = useState<number | null>(
    null
  );
  const searchSequenceRef = useRef(0);
  const partnerIds = partners.map((partner) => partner.id);
  const initialPartnerIds = initialPartners.map((partner) => partner.id);
  const partnerObj = useMemo(() => {
    const result: Record<number, ChatQuickAccessPartner> = {};
    for (const partner of partners) {
      result[partner.id] = partner;
    }
    return result;
  }, [partners]);
  const hasChanges =
    mode === 'automatic' ||
    JSON.stringify(partnerIds) !== JSON.stringify(initialPartnerIds);
  const { handleSearch, searching } = useSearch({
    onSearch: handlePartnerSearch,
    onClear: clearSearchResults,
    onSetSearchText: setSearchText
  });

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/QuickAccess/SettingsModal">
      <Modal
        modalKey="ChatQuickAccessSettings"
        isOpen
        onClose={handleClose}
        hasHeader={false}
        bodyPadding={0}
        allowOverflow
      >
        <LegacyModalLayout>
          <header>Chat quick access</header>
          <main>
            <p
              className={css`
                width: 100%;
                margin: 0 0 1.25rem;
                color: ${Color.darkGray()};
                font-size: 1.2rem;
                line-height: 1.5;
              `}
            >
              Use the stars to favorite or unfavorite existing human chats.
              Favorites appear before other recent one-to-one chats. Saving this
              list switches to your exact custom order.
            </p>
            {partners.length >= CHAT_QUICK_ACCESS_LIMIT ? (
              <p
                className={css`
                  width: 100%;
                  margin: 0 0 1.25rem;
                  padding: 1rem 1.2rem;
                  border: 1px solid var(--ui-border);
                  border-radius: 12px;
                  color: ${Color.darkGray()};
                  font-size: 1.2rem;
                  line-height: 1.5;
                `}
              >
                Quick access is full. Remove someone below to add another
                person.
              </p>
            ) : (
              <div
                className={css`
                  position: relative;
                  width: 100%;
                  margin-bottom: 1.25rem;
                `}
              >
                <SearchInput
                  inputFontSize="1.2rem"
                  inputHeight="4rem"
                  placeholder="Add a person..."
                  value={searchText}
                  searchResults={searchResults}
                  onChange={handleSearch}
                  onClickOutSide={clearSearch}
                  onSelect={handleAddPartner}
                  renderItemLabel={(item) => (
                    <UserSearchResultRow
                      userId={Number(item.id)}
                      username={item.label}
                      realName={item.subLabel}
                      profilePicUrl={item.profilePicUrl}
                    />
                  )}
                />
                {searching ? (
                  <Loading
                    style={{
                      position: 'absolute',
                      top: '4.1rem',
                      height: '4rem'
                    }}
                  />
                ) : null}
              </div>
            )}
            {partners.length ? (
              <SortableListGroup
                listItemObj={partnerObj}
                itemIds={partnerIds}
                onMove={handleMove}
                renderItemLabel={(partner) => (
                  <QuickAccessPartnerLabel partner={partner} />
                )}
                renderItemActions={(partner) => (
                  <QuickAccessPartnerActions
                    partner={partner}
                    favoritePartnerId={favoritePartnerId}
                    onFavorite={handleFavoriteToggle}
                    onRemove={handleRemovePartner}
                  />
                )}
              />
            ) : (
              <p
                className={css`
                  margin: 1rem 0;
                  color: ${Color.darkGray()};
                  font-size: 1.2rem;
                `}
              >
                Add someone to create your custom quick-access list.
              </p>
            )}
          </main>
          <footer>
            {mode === 'custom' ? (
              <Button
                variant="ghost"
                disabled={submitting || favoritePartnerId !== null}
                loading={resetting}
                style={{ marginRight: 'auto' }}
                onClick={handleReset}
              >
                Reset to recent
              </Button>
            ) : null}
            <Button
              variant="ghost"
              disabled={submitting || resetting || favoritePartnerId !== null}
              onClick={onHide}
            >
              Cancel
            </Button>
            <Button
              color={doneColor}
              disabled={!hasChanges || resetting || favoritePartnerId !== null}
              loading={submitting}
              onClick={handleSave}
            >
              Save
            </Button>
          </footer>
        </LegacyModalLayout>
      </Modal>
    </ErrorBoundary>
  );

  async function handlePartnerSearch(text: string) {
    const sequence = ++searchSequenceRef.current;
    const results = await searchChat(text, { peopleOnly: true });
    if (sequence !== searchSequenceRef.current) return;
    const selectedIds = new Set(partners.map((partner) => partner.id));
    const filteredResults: any[] = [];
    const seenIds = new Set<number>();
    for (const result of results || []) {
      const partnerId = Number(result?.id);
      const isPerson = !result?.primary || Boolean(result?.twoPeople);
      if (
        !isPerson ||
        !Number.isInteger(partnerId) ||
        partnerId <= 0 ||
        partnerId === userId ||
        selectedIds.has(partnerId) ||
        seenIds.has(partnerId)
      ) {
        continue;
      }
      seenIds.add(partnerId);
      filteredResults.push(result);
    }
    setSearchResults(filteredResults);
  }

  function partnerFromSearchResult(result: any): ChatQuickAccessPartner {
    const partnerId = Number(result.id);
    const channelId = Number(result.channelId) || null;
    const pathId = Number(result.pathId) || null;
    return {
      id: partnerId,
      username: result.label,
      profilePicUrl: result.profilePicUrl || null,
      channelId,
      pathId,
      favorited: channelId ? Number(result.favorited) === 1 : false,
      isAi: partnerId === CIEL_TWINKLE_ID || partnerId === ZERO_TWINKLE_ID
    };
  }

  function handleAddPartner(result: any) {
    if (partners.length >= CHAT_QUICK_ACCESS_LIMIT) return;
    const partner = partnerFromSearchResult(result);
    if (partners.some((item) => item.id === partner.id)) return;
    setPartners((currentPartners) => [partner, ...currentPartners]);
    clearSearch();
  }

  function handleRemovePartner(partnerId: number) {
    setPartners((currentPartners) =>
      currentPartners.filter((partner) => partner.id !== partnerId)
    );
  }

  async function handleFavoriteToggle(partner: ChatQuickAccessPartner) {
    if (partner.isAi || !partner.channelId || favoritePartnerId !== null) {
      return;
    }
    setFavoritePartnerId(partner.id);
    const requestUserId = userId;
    try {
      const favoriteState = await putFavoriteChannel(partner.channelId);
      const quickAccess = favoriteState.quickAccess;
      onApplyCanonicalChatSidebarState({
        quickAccess,
        favoriteState,
        userId: requestUserId
      });
      const canonicalPartner = quickAccess?.partners?.find(
        (currentPartner: ChatQuickAccessPartner) =>
          currentPartner.id === partner.id
      );
      setPartners((currentPartners) =>
        currentPartners.map((currentPartner) =>
          currentPartner.id === partner.id
            ? {
                ...currentPartner,
                ...(canonicalPartner || {}),
                // A draft-only partner is intentionally absent from the
                // persisted quick-access projection. The focused favorite
                // result is still canonical for this channel's star.
                favorited: Boolean(favoriteState.favorited)
              }
            : currentPartner
        )
      );
    } catch (error) {
      console.error('Failed to update chat favorite:', error);
    } finally {
      setFavoritePartnerId(null);
    }
  }

  function handleMove({
    sourceId,
    targetId
  }: {
    sourceId: number;
    targetId: number;
  }) {
    setPartners((currentPartners) => {
      const sourceIndex = currentPartners.findIndex(
        (partner) => partner.id === sourceId
      );
      const targetIndex = currentPartners.findIndex(
        (partner) => partner.id === targetId
      );
      if (sourceIndex < 0 || targetIndex < 0) return currentPartners;
      const nextPartners = [...currentPartners];
      const [sourcePartner] = nextPartners.splice(sourceIndex, 1);
      nextPartners.splice(targetIndex, 0, sourcePartner);
      return nextPartners;
    });
  }

  function clearSearchResults() {
    searchSequenceRef.current += 1;
    setSearchResults([]);
  }

  function clearSearch() {
    setSearchText('');
    clearSearchResults();
  }

  function handleClose() {
    if (submitting || resetting || favoritePartnerId !== null) return;
    onHide();
  }

  async function handleSave() {
    if (submitting || resetting) return;
    setSubmitting(true);
    const requestUserId = userId;
    try {
      const quickAccess = await saveChatQuickAccess(partnerIds);
      onApplyCanonicalChatSidebarState({ quickAccess, userId: requestUserId });
      onHide();
    } catch (error) {
      console.error('Failed to save chat quick access:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (submitting || resetting) return;
    setResetting(true);
    const requestUserId = userId;
    try {
      const quickAccess = await resetChatQuickAccess();
      onApplyCanonicalChatSidebarState({ quickAccess, userId: requestUserId });
      onHide();
    } catch (error) {
      console.error('Failed to reset chat quick access:', error);
    } finally {
      setResetting(false);
    }
  }
}

function QuickAccessPartnerLabel({
  partner
}: {
  partner: ChatQuickAccessPartner;
}) {
  const displayedPartner = useQuickAccessPartnerIdentity(partner);

  return (
    <span
      className={css`
        display: flex;
        align-items: center;
        gap: 0.9rem;
      `}
    >
      <QuickAccessAvatar partner={displayedPartner} size="3rem" />
      <span>{displayedPartner.username}</span>
    </span>
  );
}

function QuickAccessPartnerActions({
  favoritePartnerId,
  partner,
  onFavorite,
  onRemove
}: {
  favoritePartnerId: number | null;
  partner: ChatQuickAccessPartner;
  onFavorite: (partner: ChatQuickAccessPartner) => void;
  onRemove: (partnerId: number) => void;
}) {
  const displayedPartner = useQuickAccessPartnerIdentity(partner);
  const disabled = favoritePartnerId !== null;
  const favoriteLabel = displayedPartner.favorited
    ? `Unfavorite ${displayedPartner.username}`
    : `Favorite ${displayedPartner.username}`;

  return (
    <>
      {!displayedPartner.isAi && displayedPartner.channelId ? (
        <button
          type="button"
          draggable={false}
          disabled={disabled}
          aria-label={favoriteLabel}
          aria-pressed={displayedPartner.favorited}
          title={favoriteLabel}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite(displayedPartner);
          }}
          className={css`
            width: 2.5rem;
            height: 2.5rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid ${Color.borderGray()};
            border-radius: 50%;
            background: #fff;
            color: ${displayedPartner.favorited
              ? Color.brownOrange()
              : Color.darkGray()};
            cursor: ${disabled ? 'default' : 'pointer'};
            opacity: ${disabled && favoritePartnerId !== displayedPartner.id
              ? 0.55
              : 1};
          `}
        >
          <Icon
            icon={
              favoritePartnerId === displayedPartner.id
                ? 'spinner'
                : displayedPartner.favorited
                  ? 'star'
                  : ['far', 'star']
            }
            pulse={favoritePartnerId === displayedPartner.id}
          />
        </button>
      ) : null}
      <button
        type="button"
        draggable={false}
        disabled={disabled}
        aria-label={`Remove ${displayedPartner.username}`}
        title={`Remove ${displayedPartner.username}`}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(displayedPartner.id);
        }}
        className={css`
          width: 2.5rem;
          height: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid ${Color.borderGray()};
          border-radius: 50%;
          background: #fff;
          color: ${Color.darkGray()};
          cursor: ${disabled ? 'default' : 'pointer'};
        `}
      >
        <Icon icon="times" />
      </button>
    </>
  );
}
