import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectNewOwnerModal from '../SelectNewOwnerModal';
import SwitchButton from '~/components/Buttons/SwitchButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import ColorSelector from './ColorSelector';
import NameChanger from './NameChanger';
import GroupThumbnail from './GroupThumbnail';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import { buildCanonicalChannelMessagesState } from '../helpers';
import { cloudFrontURL, priceTable } from '~/constants/defaultValues';
import { returnImageFileFromUrl } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';
import { exceedsCharLimit, stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { User } from '~/types';
import { css } from '@emotion/css';
import TwinkleURL from '~/constants/URL';
import request from 'axios';
const changeThemeLabel = 'Change theme';

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
  onPurchaseSubject,
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
  onDone: (v: any) => void;
  onHide: () => void;
  onlyOwnerCanPost: boolean;
  onPurchaseSubject: (v: any) => void;
  onSelectNewOwner: (v: { newOwner: User; andLeave?: boolean }) => void;
  onScrollToBottom: () => void;
  selectingNewOwner: boolean;
  theme: string;
  unlockedThemes: string[];
  userIsChannelOwner: boolean;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const buyChatSubject = useAppContext((v) => v.requestHelpers.buyChatSubject);
  const buyChatTheme = useAppContext((v) => v.requestHelpers.buyChatTheme);
  const customChannelNames = useChatContext((v) => v.state.customChannelNames);
  const onEnableChatSubject = useChatContext(
    (v) => v.actions.onEnableChatSubject
  );
  const onEnableTheme = useChatContext((v) => v.actions.onEnableTheme);
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
  const [hovered, setHovered] = useState(false);
  const [selectNewOwnerModalShown, setSelectNewOwnerModalShown] =
    useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [editedChannelName, setEditedChannelName] = useState(
    customChannelNames[channelId] || channelName
  );
  const [editedIsPublic, setEditedIsPublic] = useState(isPublic);
  const [editedDescription, setEditedDescription] = useState(description || '');
  const [editedIsClosed, setEditedIsClosed] = useState(isClosed);
  const [editedCanChangeSubject, setEditedCanChangeSubject] =
    useState(canChangeSubject);
  const [editedOnlyOwnerCanPost, setEditedOnlyOwnerCanPost] =
    useState(onlyOwnerCanPost);
  const currentTheme = theme || 'logoBlue';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [themeToPurchase, setThemeToPurchase] = useState('');
  const [currentThumbUrl, setCurrentThumbUrl] = useState<string | null>(
    thumbPath ? `${cloudFrontURL}/thumbs/${thumbPath}/thumb.png` : null
  );
  const [newThumbUri, setNewThumbUri] = useState<string | null>(null);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [deletedTopics, setDeletedTopics] = useState<any[]>([]);
  const [deletedTopicsLoading, setDeletedTopicsLoading] = useState(false);
  const [deletedTopicsModalShown, setDeletedTopicsModalShown] = useState(false);
  const [topicActionLoadingId, setTopicActionLoadingId] = useState(0);
  const [permanentDeleteTopic, setPermanentDeleteTopic] = useState<any>(null);
  const imageUrlRef = useRef<string | null>(null);

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
    const customChannelName = customChannelNames[channelId];
    let channelNameDidNotChange = editedChannelName === channelName;
    if (
      !!customChannelName &&
      !stringIsEmpty(customChannelName) &&
      customChannelName !== editedChannelName
    ) {
      channelNameDidNotChange = false;
    }
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
      (userIsChannelOwner && stringIsEmpty(editedChannelName))
    );
  }, [
    customChannelNames,
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
      isOpen={true}
      onClose={onHide}
      title="Settings"
      size="lg"
      closeOnBackdropClick={false}
      modalLevel={0}
      footer={
        <>
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button
            loading={isSubmitting}
            color={doneColor}
            disabled={disabled}
            onClick={handleSubmit}
          >
            Done
          </Button>
        </>
      }
    >
      <div
        className={css`
          width: 80%;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
          `}
        >
          <div
            className={css`
              flex: 1;
              margin-right: 1rem;
            `}
          >
            <NameChanger
              editedChannelName={editedChannelName}
              onSetEditedChannelName={setEditedChannelName}
              userIsChannelOwner={userIsChannelOwner}
              actualChannelName={channelName}
              usingCustomName={!!customChannelNames[channelId]}
            />
          </div>
          <div>
            {userIsChannelOwner && (
              <GroupThumbnail
                thumbUrl={newThumbUri || currentThumbUrl}
                onClick={() =>
                  document.getElementById('thumbnail-input')?.click()
                }
                style={{
                  width: '150px',
                  height: '150px'
                }}
              />
            )}
            <input
              id="thumbnail-input"
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className={css`
                display: none;
              `}
            />
            {userIsChannelOwner &&
              (currentThumbUrl || newThumbUri) &&
              !isSubmitting && (
                <div
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <div
                    className={css`
                      margin-left: 1rem;
                      color: ${Color.darkerGray()};
                      cursor: pointer;
                      font-weight: bold;
                      &:hover {
                        text-decoration: underline;
                      }
                    `}
                    onClick={() => {
                      if (newThumbUri) {
                        setNewThumbUri(null);
                      } else {
                        setCurrentThumbUrl(null);
                      }
                    }}
                  >
                    <Icon icon="times" />
                    <span style={{ marginLeft: '0.7rem' }}>Remove</span>
                  </div>
                </div>
              )}
          </div>
        </div>
        {userIsChannelOwner && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Input
              style={{
                marginTop: '0.5rem',
                width: '100%'
              }}
              hasError={!!descriptionExceedsCharLimit}
              autoFocus
              placeholder="Enter group description..."
              value={editedDescription}
              errorMessage="Description exceeds character limit"
              onChange={setEditedDescription}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '1.5rem'
              }}
            >
              <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
                Public Group:
              </p>
              <SwitchButton
                style={{ marginLeft: '1rem' }}
                checked={editedIsPublic}
                onChange={() => setEditedIsPublic((isPublic) => !isPublic)}
              />
            </div>
          </div>
        )}
        {userIsChannelOwner && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '1.5rem'
            }}
          >
            <p
              style={{
                fontWeight: 'bold',
                fontSize: '1.7rem',
                opacity: editedIsPublic ? 0.3 : 1
              }}
            >
              <span style={{ color: Color.logoBlue() }}>Anyone</span> can invite
              new members:
            </p>
            <SwitchButton
              style={{ marginLeft: '1rem' }}
              disabled={editedIsPublic}
              checked={!editedIsClosed || editedIsPublic}
              onChange={() => setEditedIsClosed((isClosed) => !isClosed)}
            />
          </div>
        )}
        {userIsChannelOwner && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '1.5rem'
            }}
          >
            <p
              style={{
                fontWeight: 'bold',
                fontSize: '1.7rem'
              }}
            >
              Only the owner can post messages on Main
            </p>
            <SwitchButton
              style={{ marginLeft: '1rem' }}
              checked={!!editedOnlyOwnerCanPost}
              onChange={() => setEditedOnlyOwnerCanPost((prev) => !prev)}
            />
          </div>
        )}
        {userIsChannelOwner && (
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p
                style={{
                  fontWeight: 'bold',
                  fontSize: '1.7rem',
                  opacity: canChangeSubject ? 1 : 0.3
                }}
              >
                <span style={{ color: Color.logoBlue() }}>Anyone</span> can add
                topics:
              </p>
              <SwitchButton
                disabled={!canChangeSubject}
                style={{ marginLeft: '1rem' }}
                checked={editedCanChangeSubject === 'all'}
                onChange={() =>
                  setEditedCanChangeSubject((prevValue) =>
                    !prevValue || prevValue === 'all' ? 'owner' : 'all'
                  )
                }
              />
            </div>
            {!canChangeSubject && (
              <div>
                <Button
                  onClick={() =>
                    insufficientFunds ? null : setConfirmModalShown(true)
                  }
                  variant="solid"
                  tone="raised"
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  color="logoBlue"
                  style={{
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    background: insufficientFunds ? Color.logoBlue(0.2) : '',
                    cursor: insufficientFunds ? 'default' : 'pointer',
                    boxShadow: insufficientFunds ? 'none' : '',
                    borderColor: insufficientFunds ? Color.logoBlue(0.2) : '',
                    outline: insufficientFunds ? 'none' : ''
                  }}
                >
                  <Icon size="lg" icon="coins" />
                  <span style={{ marginLeft: '0.5rem' }}>Buy</span>
                </Button>
                {insufficientFunds && hovered && (
                  <FullTextReveal
                    show
                    direction="left"
                    style={{ color: '#000', marginTop: '0.5rem' }}
                    text={`You need ${
                      priceTable.chatSubject - twinkleCoins
                    } more Twinkle Coins`}
                  />
                )}
              </div>
            )}
          </div>
        )}
        {userIsChannelOwner && (
          <div
            style={{
              width: '100%',
              marginTop: '2rem',
              justifyContent: 'space-between',
              display: 'flex'
            }}
          >
            <div
              style={{
                width: '50%',
                fontWeight: 'bold',
                fontSize: '1.7rem'
              }}
            >
              {changeThemeLabel}:
            </div>
            <ColorSelector
              colors={[
                'green',
                'orange',
                'red',
                'rose',
                'pink',
                'purple',
                'darkBlue',
                'logoBlue'
              ]}
              unlocked={unlockedThemes}
              onSetColor={handleSetColor}
              selectedColor={selectedTheme}
              style={{
                marginTop: '1rem',
                height: 'auto',
                justifyContent: 'flex-end'
              }}
            />
          </div>
        )}
        {userIsChannelOwner && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '2rem'
              }}
            >
              <Button
                onClick={() => setSelectNewOwnerModalShown(true)}
                variant="solid"
                tone="raised"
                disabled={isSubmitting}
              >
                Change Owner
              </Button>
            </div>
          </div>
        )}
        {userIsChannelOwner && (
          <div
            className={css`
              margin-top: 2rem;
              border-top: 1px solid ${Color.borderGray()};
              padding-top: 1.5rem;
              padding-bottom: 1.5rem;
              display: flex;
              justify-content: flex-end;
            `}
          >
            <Button
              variant="soft"
              disabled={deletedTopicsLoading || isSubmitting}
              loading={deletedTopicsLoading}
              onClick={handleOpenDeletedTopics}
              style={{ fontSize: '1.2rem' }}
            >
              <Icon icon="undo" />
              <span style={{ marginLeft: '0.7rem' }}>Deleted Topics</span>
            </Button>
          </div>
        )}
      </div>
      {selectNewOwnerModalShown && (
        <SelectNewOwnerModal
          loading={selectingNewOwner}
          modalOverModal
          onHide={() => setSelectNewOwnerModalShown(false)}
          members={members}
          onSubmit={({ newOwner }) => {
            onSelectNewOwner({ newOwner });
            onHide();
          }}
          isClass={isClass}
          channelId={channelId}
        />
      )}
      {userIsChannelOwner && deletedTopicsModalShown && (
        <Modal
          modalKey="DeletedTopicsModal"
          isOpen
          onClose={() => setDeletedTopicsModalShown(false)}
          title="Deleted Topics"
          size="md"
          modalLevel={1}
          footer={
            <Button
              variant="ghost"
              onClick={() => setDeletedTopicsModalShown(false)}
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
            {deletedTopicsLoading ? (
              <div
                className={css`
                  font-size: 1.1rem;
                  color: ${Color.darkerGray()};
                `}
              >
                Loading deleted topics...
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
                          font-size: 1.2rem;
                          font-weight: bold;
                          overflow-wrap: break-word;
                        `}
                      >
                        {topic.content}
                      </div>
                      <div
                        className={css`
                          font-size: 1.1rem;
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
                          isSubmitting || topicActionLoadingId === topic.id
                        }
                        loading={topicActionLoadingId === topic.id}
                        onClick={() => handleRestoreTopic(topic.id)}
                        style={{ fontSize: '1.1rem' }}
                      >
                        <Icon icon="undo" />
                        <span style={{ marginLeft: '0.5rem' }}>Restore</span>
                      </Button>
                      <Button
                        color="red"
                        variant="soft"
                        disabled={
                          isSubmitting || topicActionLoadingId === topic.id
                        }
                        onClick={() => setPermanentDeleteTopic(topic)}
                        style={{ fontSize: '1.1rem' }}
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
                  font-size: 1.1rem;
                  color: ${Color.darkerGray()};
                `}
              >
                No deleted topics
              </div>
            )}
          </div>
        </Modal>
      )}
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          title={`Purchase "Topics" Feature`}
          description={`Purchase "Topics" Feature for ${priceTable.chatSubject} Twinkle Coins?`}
          descriptionFontSize="2rem"
          onConfirm={handlePurchaseSubject}
        />
      )}
      {themeToPurchase && (
        <ConfirmModal
          modalOverModal
          onHide={() => setThemeToPurchase('')}
          title={`Purchase theme`}
          description={
            <div>
              Purchase{' '}
              <b style={{ color: Color[themeToPurchase]() }}>this theme</b> for{' '}
              {priceTable.chatTheme} Twinkle Coins?
            </div>
          }
          descriptionFontSize="2rem"
          onConfirm={handlePurchaseTheme}
        />
      )}
      {userIsChannelOwner && !!permanentDeleteTopic && (
        <ConfirmModal
          modalOverModal
          onHide={() => setPermanentDeleteTopic(null)}
          title="Delete Topic Permanently"
          description={`Permanently delete "${permanentDeleteTopic.content}"?`}
          descriptionFontSize="1.7rem"
          onConfirm={handlePermanentlyDeleteTopic}
        />
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
      unlockedThemes.includes(color) ||
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
    try {
      setDeletedTopicsLoading(true);
      const topics = await loadDeletedTopics({ channelId });
      setDeletedTopics(Array.isArray(topics) ? topics : []);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletedTopicsLoading(false);
    }
  }

  async function reloadCanonicalChannelTopicState() {
    const data = await loadChatChannel({
      channelId,
      skipUpdateChannelId: true,
      fromWriter: true
    });
    const canonicalChannel = data?.channel || {};
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
              existingMessagesObj: currentMessagesObj
            })
          : {})
      }
    });
  }

  async function handleRestoreTopic(topicId: number) {
    try {
      setTopicActionLoadingId(topicId);
      await restoreDeletedTopic({ channelId, topicId });
      await reloadCanonicalChannelTopicState();
      await handleLoadDeletedTopics();
    } catch (error) {
      console.error(error);
    } finally {
      setTopicActionLoadingId(0);
    }
  }

  async function handlePermanentlyDeleteTopic() {
    const topicId = Number(permanentDeleteTopic?.id || 0);
    if (!topicId) return;
    try {
      setTopicActionLoadingId(topicId);
      await permanentlyDeleteTopic({ channelId, topicId });
      await reloadCanonicalChannelTopicState();
      await handleLoadDeletedTopics();
      setPermanentDeleteTopic(null);
    } catch (error) {
      console.error(error);
    } finally {
      setTopicActionLoadingId(0);
    }
  }

  async function handlePurchaseSubject() {
    try {
      const { coins, topic } = await buyChatSubject(channelId);
      onEnableChatSubject({ channelId, topic });
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      onPurchaseSubject(topic);
      setEditedCanChangeSubject('owner');
      onScrollToBottom();
      setConfirmModalShown(false);
    } catch (error) {
      console.error(error);
      setConfirmModalShown(false);
    }
  }

  async function handlePurchaseTheme() {
    try {
      const { coins } = await buyChatTheme({
        channelId,
        theme: themeToPurchase
      });
      onEnableTheme({ channelId, theme: themeToPurchase });
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      setThemeToPurchase('');
    } catch (error) {
      console.error(error);
      setThemeToPurchase('');
    }
  }

  async function handleSubmit() {
    let path = null;
    setIsSubmitting(true);
    if (newThumbUri) {
      path = uuidv1();
      const file = returnImageFileFromUrl({
        imageUrl: newThumbUri,
        fileName: path
      });
      const { data: url } = await request.post(`${TwinkleURL}/content/thumb`, {
        fileSize: file.size,
        path
      });
      await request.put(url.signedRequest, file);
    }
    onDone({
      editedChannelName:
        !userIsChannelOwner && editedChannelName === channelName
          ? null
          : editedChannelName,
      editedDescription,
      editedIsPublic,
      editedIsClosed,
      editedOnlyOwnerCanPost,
      editedCanChangeSubject,
      editedTheme: selectedTheme,
      newThumbPath: path || (currentThumbUrl ? thumbPath : null)
    });
  }
}
