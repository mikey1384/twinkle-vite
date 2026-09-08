import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import SelectNewOwnerModal, { OwnerSelection } from '../SelectNewOwnerModal';
import Icon from '~/components/Icon';
import ColorSelector from './ColorSelector';
import NameChanger from './NameChanger';
import GroupThumbnail from './GroupThumbnail';
import PurchaseModal from './PurchaseModal';
import useDeletedTopicsList from './useDeletedTopicsList';
import useDeletedTopicAction from './useDeletedTopicAction';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import { buildCanonicalChannelMessagesState } from '../helpers';
import { cloudFrontURL, priceTable } from '~/constants/defaultValues';
import { returnImageFileFromUrl } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';
import { exceedsCharLimit, stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import useChatDialogRequest from '../useChatDialogRequest';
import { chatFormActionStyle, chatFormClass, chatFormModalClass } from '../chatFormStyles';
import { css } from '@emotion/css';

export default function SettingsModal({
  channelId,
  channelName,
  canChangeSubject,
  description,
  isClass,
  isPublic,
  isClosed,
  thumbPath,
  members,
  onDone,
  onHide,
  onlyOwnerCanPost,
  onSelectNewOwner,
  onScrollToBottom,
  selectingNewOwner,
  theme,
  unlockedThemes,
  userIsChannelOwner
}: {
  channelId: number;
  channelName?: string;
  canChangeSubject: string;
  description?: string;
  isClass: boolean;
  isPublic: boolean;
  isClosed: boolean;
  thumbPath: string;
  members: any[];
  onDone: (v: any) => void | Promise<void>;
  onHide: () => void;
  onlyOwnerCanPost: boolean;
  onSelectNewOwner: (v: OwnerSelection) => void | Promise<void>;
  onScrollToBottom: () => void;
  selectingNewOwner: boolean;
  theme: string;
  unlockedThemes: string[];
  userIsChannelOwner: boolean;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const buyChatSubject = useAppContext((v) => v.requestHelpers.buyChatSubject);
  const buyChatTheme = useAppContext((v) => v.requestHelpers.buyChatTheme);
  const createThumbnailUpload = useAppContext(
    (v) => v.requestHelpers.createThumbnailUpload
  );
  const customChannelNames = useChatContext((v) => v.state.customChannelNames);
  const onEnableChatSubject = useChatContext(
    (v) => v.actions.onEnableChatSubject
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const currentMessagesObj = useChatContext(
    (v) => v.state.channelsObj[channelId]?.messagesObj
  );
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const loadDeletedTopics = useAppContext(
    (v) => v.requestHelpers.loadDeletedTopics
  );
  const restoreDeletedTopic = useAppContext(
    (v) => v.requestHelpers.restoreDeletedTopic
  );
  const permanentlyDeleteTopic = useAppContext(
    (v) => v.requestHelpers.permanentlyDeleteTopic
  );
  const [selectNewOwnerModalShown, setSelectNewOwnerModalShown] =
    useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [editedChannelName, setEditedChannelName] = useState(
    customChannelNames[channelId] || channelName || ''
  );
  const [editedIsPublic, setEditedIsPublic] = useState(isPublic);
  const [editedDescription, setEditedDescription] = useState(description || '');
  const [editedIsClosed, setEditedIsClosed] = useState(isClosed);
  const [editedCanChangeSubject, setEditedCanChangeSubject] =
    useState(canChangeSubject);
  const [editedOnlyOwnerCanPost, setEditedOnlyOwnerCanPost] =
    useState(onlyOwnerCanPost);
  const currentTheme = theme || 'logoBlue';
  const saveRequest = useChatDialogRequest(userId + ':' + channelId);
  const isSubmitting = saveRequest.busy;
  const descriptionId = useId();
  const thumbnailId = useId();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const uploadedThumbnailRef = useRef<{ uri: string; path: string } | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [themeToPurchase, setThemeToPurchase] = useState('');
  const [currentThumbUrl, setCurrentThumbUrl] = useState<string | null>(
    thumbPath ? `${cloudFrontURL}/thumbs/${thumbPath}/thumb.png` : null
  );
  const [newThumbUri, setNewThumbUri] = useState<string | null>(null);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const deletedTopicsList = useDeletedTopicsList(`${userId}:${channelId}:${userIsChannelOwner}`, () => loadDeletedTopics({ channelId }));
  const { topics: deletedTopics, loading: deletedTopicsLoading } = deletedTopicsList;
  const [deletedTopicsModalShown, setDeletedTopicsModalShown] = useState(false);
  const [topicActionLoadingId, setTopicActionLoadingId] = useState(0);
  const topicAction = useDeletedTopicAction(`${userId}:${channelId}:${userIsChannelOwner}:${deletedTopicsModalShown}`);
  const messagesRef = useRef(currentMessagesObj);
  messagesRef.current = currentMessagesObj;
  const [permanentDeleteTopic, setPermanentDeleteTopic] = useState<any>(null);
  const imageUrlRef = useRef<string | null>(null);
  const deletedTopicsHeadingRef = useRef<HTMLHeadingElement>(null);
  const topicWasBusy = useRef(false);
  useEffect(() => {
    const busy = topicAction.busy || deletedTopicsLoading;
    const finished = topicWasBusy.current && !busy;
    topicWasBusy.current = busy;
    const heading = deletedTopicsHeadingRef.current;
    if (!finished || !deletedTopicsModalShown || permanentDeleteTopic || !heading) return;
    const doc = heading.ownerDocument;
    // Native disabled/removed action buttons can send focus to the document.
    // Repair only lost focus; never interrupt someone who moved to a control.
    if (doc.activeElement === doc.body || doc.activeElement === doc.documentElement) {
      heading.focus({ preventScroll: true });
    }
  }, [topicAction.busy, deletedTopicsLoading, deletedTopicsModalShown, permanentDeleteTopic]);

  const descriptionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'group',
        inputType: 'description',
        text: editedDescription
      }),
    [editedDescription]
  );

  const insufficientFunds = useMemo(
    () => twinkleCoins < priceTable.chatSubject,
    [twinkleCoins]
  );

  const disabled = useMemo(() => {
    const channelNameDidNotChange = editedChannelName === (customChannelNames[channelId] || channelName || '');
    return (
      (channelNameDidNotChange &&
        (description || '') === editedDescription &&
        isPublic === editedIsPublic &&
        isClosed === editedIsClosed &&
        editedCanChangeSubject === canChangeSubject &&
        editedOnlyOwnerCanPost === onlyOwnerCanPost &&
        currentTheme === selectedTheme &&
        (!thumbPath || currentThumbUrl) &&
        !newThumbUri) ||
      (userIsChannelOwner && stringIsEmpty(editedChannelName)) ||
      Boolean(exceedsCharLimit({ contentType: 'group', inputType: 'name', text: editedChannelName })) ||
      (userIsChannelOwner && Boolean(descriptionExceedsCharLimit))
    );
  }, [
    customChannelNames,
    descriptionExceedsCharLimit,
    channelId,
    editedChannelName,
    channelName,
    description,
    editedDescription,
    isPublic,
    editedIsPublic,
    isClosed,
    editedIsClosed,
    editedCanChangeSubject,
    canChangeSubject,
    editedOnlyOwnerCanPost,
    onlyOwnerCanPost,
    currentTheme,
    selectedTheme,
    thumbPath,
    currentThumbUrl,
    newThumbUri,
    userIsChannelOwner
  ]);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  return (
    <Modal
      modalKey="SettingsModal"
      isOpen
      aria-label="Channel settings"
      onClose={() => { if (!saveRequest.pending.current) onHide(); }}
      hasHeader={false}
      bodyPadding={0}
      className={chatFormModalClass}
      size="lg"
      closeOnBackdropClick={false}
      closeOnEscape={!isSubmitting}
      showCloseButton={!isSubmitting}
      modalLevel={0}
    >
      <section className={`${chatFormClass} ${settingsClass}`}>
        <header>
          <h2>Channel settings</h2>
          <p className="description">{userIsChannelOwner
            ? 'Make this space yours, and choose how the group works.'
            : 'Give this conversation a name that makes sense to you.'}</p>
        </header>
        <main>
          <div className="identity">
            <NameChanger
              editedChannelName={editedChannelName}
              onSetEditedChannelName={setEditedChannelName}
              userIsChannelOwner={userIsChannelOwner}
              actualChannelName={channelName}
              usingCustomName={Boolean(customChannelNames[channelId])}
              disabled={isSubmitting}
            />
            {userIsChannelOwner && <div>
              <GroupThumbnail thumbUrl={newThumbUri || currentThumbUrl} disabled={isSubmitting}
                onClick={() => thumbnailInputRef.current?.click()} />
              <input ref={thumbnailInputRef} id={thumbnailId} type="file" accept="image/*"
                disabled={isSubmitting} onChange={handleThumbnailChange} style={{ display: 'none' }} />
              {(currentThumbUrl || newThumbUri) && <Button variant="ghost" uppercase={false}
                style={{ ...chatFormActionStyle, marginTop: 4, padding: '8px 4px' }}
                aria-label="Remove group picture" disabled={isSubmitting}
                onClick={() => {
                  if (newThumbUri) setNewThumbUri(null);
                  else setCurrentThumbUrl(null);
                }}><Icon icon="times" /> Remove</Button>}
            </div>}
          </div>
          {userIsChannelOwner && <>
            <div>
              <label htmlFor={descriptionId}>Group description</label>
              <textarea id={descriptionId} rows={3} value={editedDescription} disabled={isSubmitting}
                placeholder="What’s this group about?" aria-invalid={Boolean(descriptionExceedsCharLimit)}
                aria-describedby={descriptionId + '-hint'}
                onChange={event => setEditedDescription(event.target.value)} />
              <p id={descriptionId + '-hint'} className={descriptionExceedsCharLimit ? 'error' : 'field-hint'}
                role={descriptionExceedsCharLimit ? 'alert' : undefined}>
                {descriptionExceedsCharLimit ? 'Description exceeds the character limit.' : 'Help members understand the purpose of the group.'}
              </p>
            </div>
            <section aria-label="Group permissions" className="permission-settings">
              <h3>How the group works</h3>
              <div className="setting">
                <label><input type="checkbox" role="switch" checked={Boolean(editedIsPublic)} disabled={isSubmitting}
                  onChange={event => setEditedIsPublic(event.target.checked)} />Public group</label>
              </div>
              <div className="setting">
                <label><input type="checkbox" role="switch" checked={!editedIsClosed || editedIsPublic}
                  disabled={isSubmitting || editedIsPublic}
                  onChange={event => setEditedIsClosed(!event.target.checked)} />Anyone can invite members</label>
                {editedIsPublic && <p className="field-hint">Public groups always allow new members to join.</p>}
              </div>
              <div className="setting">
                <label><input type="checkbox" role="switch" checked={Boolean(editedOnlyOwnerCanPost)} disabled={isSubmitting}
                  onChange={event => setEditedOnlyOwnerCanPost(event.target.checked)} />Only the owner can post on Main</label>
              </div>
              <div className="setting">
                <label><input type="checkbox" role="switch" checked={editedCanChangeSubject === 'all'} disabled={isSubmitting || !canChangeSubject}
                  onChange={event => setEditedCanChangeSubject(event.target.checked ? 'all' : 'owner')} />Anyone can add topics</label>
                {!canChangeSubject && <>
                  <Button onClick={() => setConfirmModalShown(true)} variant="soft" uppercase={false}
                    style={chatFormActionStyle} color="logoBlue" disabled={isSubmitting || insufficientFunds}>
                    <Icon icon="coins" /> Enable topics · {priceTable.chatSubject} coins
                  </Button>
                  {insufficientFunds && <p className="field-hint">You need {priceTable.chatSubject - twinkleCoins} more Twinkle Coins.</p>}
                </>}
              </div>
            </section>
            <section aria-label="Channel appearance">
              <h3>Channel color</h3>
              <ColorSelector colors={['green', 'orange', 'red', 'rose', 'pink', 'purple', 'darkBlue', 'logoBlue']}
                unlocked={unlockedThemes || []} onSetColor={handleSetColor} selectedColor={selectedTheme} disabled={isSubmitting} />
            </section>
            <section aria-label="Channel management" className="management-actions">
              <Button onClick={() => setSelectNewOwnerModalShown(true)} variant="soft" uppercase={false}
                style={chatFormActionStyle} disabled={isSubmitting}>Change owner</Button>
              <Button variant="ghost" uppercase={false} style={chatFormActionStyle}
                disabled={deletedTopicsLoading || isSubmitting} loading={deletedTopicsLoading}
                onClick={handleOpenDeletedTopics}><Icon icon="undo" /> Deleted topics</Button>
            </section>
          </>}
          {saveRequest.error && <p ref={saveRequest.errorRef} id={saveRequest.errorId} role="alert" className="error">{saveRequest.error}</p>}
        </main>
        <footer>
          <Button variant="ghost" uppercase={false} style={chatFormActionStyle} disabled={isSubmitting} onClick={onHide}>Cancel</Button>
          <Button variant="soft" tone="raised" uppercase={false} style={chatFormActionStyle} color={doneColor}
            disabled={disabled} aria-busy={isSubmitting} aria-label={isSubmitting ? 'Saving channel settings' : 'Save channel settings'}
            aria-describedby={saveRequest.error ? saveRequest.errorId : undefined}
            onClick={handleSubmit}>{isSubmitting ? 'Saving…' : 'Save changes'}</Button>
        </footer>
      </section>
      {selectNewOwnerModalShown && (
        <SelectNewOwnerModal
          loading={selectingNewOwner}
          modalOverModal
          onHide={() => setSelectNewOwnerModalShown(false)}
          members={members}
          onSubmit={async (selection) => {
            await onSelectNewOwner(selection);
            if (selection.canApply?.() !== false) onHide();
          }}
          isClass={isClass}
          channelId={channelId}
        />
      )}
      {userIsChannelOwner && deletedTopicsModalShown && (
        <Modal
          modalKey="DeletedTopicsModal"
          isOpen
          onClose={handleCloseDeletedTopics}
          aria-label="Deleted topics"
          closeOnEscape={!topicAction.busy}
          showCloseButton={!topicAction.busy}
          closeOnBackdropClick={false}
          title="Deleted Topics"
          header={<h2 ref={deletedTopicsHeadingRef} tabIndex={-1} style={{ margin: 0, fontSize: 20, lineHeight: 1.3 }}>Deleted topics</h2>}
          size="md"
          modalLevel={1}
          footer={
            <Button
              variant="ghost"
              uppercase={false}
              disabled={topicAction.busy}
              style={chatFormActionStyle}
              onClick={handleCloseDeletedTopics}
            >
              Close
            </Button>
          }
        >
          <div
            className={css`
              width: 100%;
            `}
          >
            {!permanentDeleteTopic && topicAction.error && <div style={{ fontSize: 16 }}>
              <p role="alert">{topicAction.confirmed ? 'Topic restored, but the view couldn’t update. Retry updating without restoring again.' : topicAction.error}</p>
              <Button variant="soft" color="logoBlue" style={chatFormActionStyle} uppercase={false} disabled={topicAction.busy}
                onClick={() => handleRestoreTopic(topicActionLoadingId)}>{topicAction.confirmed ? 'Retry updating' : 'Retry restore'}</Button>
            </div>}
            {deletedTopicsLoading ? (
              <Loading style={{ height: '12rem' }} />
            ) : deletedTopicsList.error ? (
              <div style={{ padding: '20px 0', fontSize: 16 }}>
                <p role="alert">{deletedTopicsList.error}</p>
                <Button variant="soft" uppercase={false} style={chatFormActionStyle}
                  onClick={handleLoadDeletedTopics}>Retry loading topics</Button>
              </div>
            ) : deletedTopics.length > 0 ? (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: 0.8rem;
                `}
              >
                {deletedTopics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className={css`
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      gap: 1rem;
                      padding: 0.9rem 0;
                      @media (max-width: 480px) {
                        flex-direction: column;
                        align-items: stretch;
                      }
                      ${index < deletedTopics.length - 1
                        ? `border-bottom: 1px solid ${Color.borderGray()};`
                        : ''}
                    `}
                  >
                    <div
                      className={css`
                        min-width: 0;
                        flex: 1;
                      `}
                    >
                      <div
                        className={css`
                          font-size: 16px;
                          font-weight: bold;
                          overflow-wrap: anywhere;
                        `}
                      >
                        {topic.content}
                      </div>
                      <div
                        className={css`
                          font-size: 14px;
                          color: ${Color.darkerGray()};
                          margin-top: 0.2rem;
                        `}
                      >
                        {topic.username}
                      </div>
                    </div>
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        flex-shrink: 0;
                      `}
                    >
                      <Button
                        color="green"
                        variant="soft"
                        disabled={
                          isSubmitting || topicAction.busy || topicAction.confirmed
                        }
                        loading={topicAction.busy && topicActionLoadingId === topic.id}
                        onClick={() => handleRestoreTopic(topic.id)}
                        uppercase={false}
                        style={chatFormActionStyle}
                      >
                        <Icon icon="undo" />
                        <span style={{ marginLeft: '0.5rem' }}>Restore</span>
                      </Button>
                      <Button
                        color="red"
                        variant="soft"
                        disabled={
                          isSubmitting || topicAction.busy || topicAction.confirmed
                        }
                        onClick={() => setPermanentDeleteTopic(topic)}
                        aria-label={`Permanently delete topic: ${topic.content}`}
                        uppercase={false}
                        style={chatFormActionStyle}
                      >
                        <Icon icon="trash-alt" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={css`
                  width: 100%;
                  text-align: center;
                  padding: 3rem 0;
                  font-size: 1.5rem;
                  color: ${Color.darkerGray()};
                `}
              >
                No deleted topics
              </div>
            )}
          </div>
        </Modal>
      )}
      {userIsChannelOwner && confirmModalShown && (
        <PurchaseModal
          key={`${userId}:${channelId}:topics`}
          scope={`${userId}:${channelId}:topics`}
          onHide={() => setConfirmModalShown(false)}
          title="Enable topics"
          description="Unlock topics for this channel. The owner can add topics after purchase."
          price={priceTable.chatSubject}
          balance={twinkleCoins}
          onPurchase={() => buyChatSubject(channelId)}
          validateReceipt={receipt => Number.isSafeInteger(receipt.topic?.id) && Number(receipt.topic?.id) > 0}
          onApply={({ coins, topic }) => {
            onEnableChatSubject({ channelId, topic });
            onSetUserState({ userId, newState: { twinkleCoins: coins } });
            setEditedCanChangeSubject('owner');
            onScrollToBottom();
          }}
        />
      )}
      {userIsChannelOwner && themeToPurchase && (
        <PurchaseModal
          key={`${userId}:${channelId}:theme:${themeToPurchase}`}
          scope={`${userId}:${channelId}:theme:${themeToPurchase}`}
          onHide={() => setThemeToPurchase('')}
          title="Unlock channel color"
          description={<span>
            <span aria-hidden="true" style={{ display: 'inline-block', width: 16, height: 16, marginRight: 6, borderRadius: '50%', verticalAlign: 'text-bottom', background: Color[themeToPurchase]() }} />
            Unlock the <strong>{themeToPurchase === 'darkBlue' ? 'dark blue' : themeToPurchase}</strong> color for this channel. Save your settings afterward to apply it.
          </span>}
          price={priceTable.chatTheme}
          balance={twinkleCoins}
          onPurchase={() => buyChatTheme({ channelId, theme: themeToPurchase })}
          validateReceipt={receipt => Array.isArray(receipt.unlockedThemes) && receipt.unlockedThemes.every(value => typeof value === 'string') && receipt.unlockedThemes.includes(themeToPurchase)}
          onApply={({ coins, unlockedThemes: canonicalUnlockedThemes }) => {
            onSetChannelState({ channelId, newState: { unlockedThemes: canonicalUnlockedThemes } });
            onSetUserState({ userId, newState: { twinkleCoins: coins } });
            setSelectedTheme(themeToPurchase);
          }}
        />
      )}
      {userIsChannelOwner && !!permanentDeleteTopic && (
        <Modal isOpen modalLevel={2} aria-label="Permanently delete topic" size="sm"
          hasHeader={false} bodyPadding={0} className={chatFormModalClass}
          closeOnBackdropClick={false} closeOnEscape={!topicAction.busy} showCloseButton={!topicAction.busy}
          onClose={handleClosePermanentDelete}>
          <section className={chatFormClass}>
            <header><h2>{topicAction.confirmed ? 'Topic permanently deleted' : 'Permanently delete topic?'}</h2><p className="description">{topicAction.confirmed ? 'The deletion is complete. Update this view to show the latest topics.' : 'This cannot be undone. The topic will no longer be recoverable.'}</p></header>
            <main><p style={{ overflowWrap: 'anywhere' }}>{permanentDeleteTopic.content}</p>
              {topicAction.error && <p role="alert" className="error">{topicAction.confirmed ? 'Topic permanently deleted, but the view couldn’t update. Retry updating without deleting again.' : topicAction.error}</p>}
            </main>
            <footer><Button variant="ghost" uppercase={false} style={chatFormActionStyle} disabled={topicAction.busy}
              onClick={handleClosePermanentDelete}>{topicAction.confirmed ? 'Close' : 'Cancel'}</Button>
              <Button color={topicAction.confirmed ? 'logoBlue' : 'red'} variant="soft" uppercase={false} style={chatFormActionStyle}
                aria-busy={topicAction.busy} onClick={handlePermanentlyDeleteTopic}>
                {topicAction.busy ? 'Working…' : topicAction.confirmed ? 'Retry updating' : 'Delete permanently'}
              </Button></footer>
          </section>
        </Modal>
      )}
      {imageEditModalShown && (
        <ImageEditModal
          imageUri={imageUri}
          onEditDone={({ croppedImageUrl }) => {
            if (croppedImageUrl) {
              handleEditDone(croppedImageUrl);
            }
          }}
          onHide={() => setImageEditModalShown(false)}
          uploadDisabled={true}
          aspectFixed={false}
        />
      )}
    </Modal>
  );

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
      const newImageUrl = URL.createObjectURL(e.target.files[0]);
      setImageUri(newImageUrl);
      setImageEditModalShown(true);
      imageUrlRef.current = newImageUrl;
    }
  }

  function handleEditDone(croppedUrl: string) {
    setNewThumbUri(croppedUrl);
    setImageEditModalShown(false);
  }

  function handleSetColor(color: string) {
    if (
      (unlockedThemes || []).includes(color) ||
      color === 'green' ||
      color === 'logoBlue'
    ) {
      return setSelectedTheme(color);
    }
    setThemeToPurchase(color);
  }

  async function handleOpenDeletedTopics() {
    if (!userIsChannelOwner) return;
    setDeletedTopicsModalShown(true);
    await handleLoadDeletedTopics();
  }

  async function handleLoadDeletedTopics() {
    if (!userIsChannelOwner) return;
    await deletedTopicsList.reload();
  }

  function handleCloseDeletedTopics() {
    if (topicAction.pending.current) return;
    deletedTopicsList.invalidate();
    setDeletedTopicsModalShown(false);
  }

  function handleClosePermanentDelete() {
    if (topicAction.pending.current) return;
    setPermanentDeleteTopic(null);
    // A committed delete with a failed refresh must not become a restore retry.
    if (topicAction.error) handleCloseDeletedTopics();
  }

  async function reloadCanonicalChannelTopicState(isCurrent: () => boolean) {
    const data = await loadChatChannel({
      channelId,
      skipUpdateChannelId: true,
      hydrateMessages: true,
      fromWriter: true
    });
    if (!isCurrent()) return;
    const canonicalChannel = data?.channel;
    if (!canonicalChannel || Number(canonicalChannel.id) !== channelId || !Array.isArray(canonicalChannel.pinnedTopicIds) || !canonicalChannel.topicObj || typeof canonicalChannel.topicObj !== 'object') {
      throw new Error('Invalid canonical channel topic state');
    }
    onSetChannelState({
      channelId,
      newState: {
        featuredTopicId: canonicalChannel.featuredTopicId || null,
        lastTopicId: canonicalChannel.lastTopicId || null,
        pinnedTopicIds: canonicalChannel.pinnedTopicIds || [],
        topicObj: canonicalChannel.topicObj || {},
        ...(Array.isArray(data?.messages)
          ? buildCanonicalChannelMessagesState({
              messages: data.messages,
              existingMessagesObj: messagesRef.current,
              messagesHydrated: data.messagesHydrated === true
            })
          : {})
      }
    });
  }

  async function handleRestoreTopic(topicId: number) {
    if (!userIsChannelOwner || topicAction.pending.current || !topicId) return;
    setTopicActionLoadingId(topicId);
    await topicAction.runAction({ id: topicId, kind: 'restore' }, () => restoreDeletedTopic({ channelId, topicId }), async current => {
      await reloadCanonicalChannelTopicState(current);
      if (current()) await handleLoadDeletedTopics();
    });
  }

  async function handlePermanentlyDeleteTopic() {
    const topicId = Number(permanentDeleteTopic?.id || 0);
    if (!topicId || !userIsChannelOwner || topicAction.pending.current) return;
    setTopicActionLoadingId(topicId);
    await topicAction.runAction({ id: topicId, kind: 'delete' }, () => permanentlyDeleteTopic({ channelId, topicId }), async current => {
      await reloadCanonicalChannelTopicState(current);
      if (!current()) return;
      await handleLoadDeletedTopics();
      if (current()) setPermanentDeleteTopic(null);
    });
  }

  async function handleSubmit() {
    if (disabled) return;
    await saveRequest.run('Couldn’t save these settings. Your changes are kept. Please try again.', async isCurrent => {
      let path: string | null = null;
      if (newThumbUri) {
        if (uploadedThumbnailRef.current?.uri === newThumbUri) {
          path = uploadedThumbnailRef.current.path;
        } else {
          const uploadId = uuidv1();
          const file = returnImageFileFromUrl({ imageUrl: newThumbUri, fileName: uploadId });
          const upload = await createThumbnailUpload({ fileSize: file.size, path: uploadId });
          if (!isCurrent()) return;
          const response = await fetch(upload.signedRequest, { method: 'PUT', body: file });
          if (!response.ok) throw new Error('Failed to upload channel thumbnail');
          if (!isCurrent()) return;
          path = upload.path;
          if (!path) throw new Error('Missing uploaded thumbnail path');
          uploadedThumbnailRef.current = { uri: newThumbUri, path };
        }
      }
      if (!isCurrent()) return;
      await onDone({
        editedChannelName: !userIsChannelOwner && editedChannelName === channelName ? null : editedChannelName,
        editedDescription,
        editedIsPublic,
        editedIsClosed,
        editedOnlyOwnerCanPost,
        editedCanChangeSubject,
        editedTheme: selectedTheme,
        newThumbPath: path || (currentThumbUrl ? thumbPath : null),
        canApply: isCurrent
      });
    });
  }
}

const settingsClass = css`
  .identity { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: start; }
  .permission-settings { display: flex; flex-direction: column; gap: 10px; }
  h3 { margin: 0 0 10px; font-size: 16px; color: #253247; }
  .permission-settings h3 { margin-bottom: 0; }
  .management-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #dce3ed; }
  textarea { display: block; width: 100%; min-height: 90px; padding: 10px 12px; border: 1px solid #b8c4d4; border-radius: 10px; background: #fff; color: #253247; font: inherit; font-size: 16px; line-height: 1.5; resize: vertical; scroll-margin-block: 120px 84px; }
  textarea:focus-visible { outline: 2px solid #334155; outline-offset: 2px; }
  input:disabled, textarea:disabled { cursor: default; }
  input[aria-invalid='true'], textarea[aria-invalid='true'] { border-color: #b42338; }
  .setting label:has(input:disabled) { cursor: default; }
  @media (max-width: 480px) { .identity { grid-template-columns: minmax(0, 1fr); gap: 16px; } }
`;
