import React, { useEffect, useMemo, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import UserListModal from '~/components/Modals/UserListModal';
import DropdownButton from '~/components/Buttons/DropdownButton';
import EditTitleForm from '~/components/Forms/EditTitleForm';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Embedly from '~/components/Embedly';
import Icon from '~/components/Icon';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useExploreContext,
  useKeyContext
} from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const editLabel = localize('edit');
const removeLabel = localize('remove');

export default function LinkItem({
  link: { id, numComments, likes, timeStamp, title, uploader, ...embedProps }
}: {
  link: {
    content: string;
    id: number;
    numComments: number;
    siteUrl: string;
    thumbUrl: string;
    title: string;
    timeStamp: number;
    uploader: {
      level: number;
      id: number;
      username: string;
    };
    likes: { id: number; username: string; profilePicUrl: string }[];
  };
}) {
  const navigate = useNavigate();
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const level = useKeyContext((v) => v.myState.level);
  const userId = useKeyContext((v) => v.myState.userId);
  const { canDelete, canEdit } = useMyLevel();
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const onEditLinkTitle = useExploreContext((v) => v.actions.onEditLinkTitle);
  const onDeleteContent = useContentContext((v) => v.actions.onDeleteContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const { loaded, isDeleted } = useContentState({
    contentType: 'url',
    contentId: id
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [onEdit, setOnEdit] = useState(false);
  useEffect(() => {
    if (!loaded) {
      onInitContent({
        contentId: id,
        contentType: 'url',
        id,
        likes,
        timeStamp,
        title,
        uploader,
        ...embedProps
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userIsUploader = userId === uploader.id;

  const editButtonShown = useMemo(() => {
    const userCanEditThis = (canEdit || canDelete) && level > uploader.level;
    return userIsUploader || userCanEditThis;
  }, [level, canDelete, canEdit, uploader.level, userIsUploader]);

  const editMenuItems = useMemo(() => {
    const items = [];
    if (userIsUploader || canEdit) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () => setOnEdit(true)
      });
    }
    if (userIsUploader || canDelete) {
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>{removeLabel}</span>
          </>
        ),
        onClick: () => setConfirmModalShown(true)
      });
    }
    return items;
  }, [canDelete, canEdit, userIsUploader]);

  const uploadedLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          게시자: <UsernameText user={uploader} /> {`${timeSince(timeStamp)}`}
        </>
      );
    }
    return (
      <>
        Uploaded {`${timeSince(timeStamp)} `}
        by <UsernameText user={uploader} />
      </>
    );
  }, [timeStamp, uploader]);

  const likesLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => setUserListModalShown(true)}
          >
            좋아요 ({`${likes.length}`})
          </span>
          &nbsp;&nbsp;
        </>
      );
    }
    return (
      <>
        <span
          style={{ cursor: 'pointer' }}
          onClick={() => setUserListModalShown(true)}
        >
          {`${likes.length}`} like
          {likes.length > 1 ? 's' : ''}
        </span>
        &nbsp;&nbsp;
      </>
    );
  }, [likes.length]);

  const commentsLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <span>댓글 ({numComments})</span>;
    }
    return (
      <span>
        {numComments} comment
        {numComments > 1 ? 's' : ''}
      </span>
    );
  }, [numComments]);

  return !isDeleted ? (
    <nav
      className={css`
        display: flex;
        width: 100%;
        section {
          display: flex;
          justify-content: space-between;
        }
      `}
    >
      <div
        onMouseUp={() => {
          if (!onEdit) navigate(`/links/${id}`);
        }}
        style={{ cursor: !onEdit ? 'pointer' : '' }}
        className={css`
          position: relative;
          width: 15%;
          &:after {
            content: '';
            display: block;
            padding-bottom: 35%;
          }
          @media (max-width: ${mobileMaxWidth}) {
            width: 20%;
          }
        `}
      >
        <Embedly
          imageOnly
          noLink
          style={{ width: '100%', height: '100%' }}
          loadingHeight="6rem"
          contentId={id}
        />
      </div>
      <section
        style={{
          marginLeft: '2rem',
          display: 'flex'
        }}
        className={css`
          width: ${editButtonShown ? 'CALC(85% - 6rem)' : '85%'};
          @media (max-width: ${mobileMaxWidth}) {
            width: ${editButtonShown ? 'CALC(80% - 6rem)' : '80%'};
          }
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 100%;
          `}
        >
          <div style={{ width: '100%' }}>
            <div
              className={css`
                width: 100%;
                a {
                  font-size: 2rem;
                  line-height: 1.2;
                  font-weight: bold;
                }
              `}
            >
              {!onEdit && (
                <p
                  onMouseUp={() => {
                    if (!onEdit) navigate(`/links/${id}`);
                  }}
                  style={{
                    width: '100%',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    color: Color[linkColor](),
                    fontWeight: 'bold'
                  }}
                  className={css`
                    font-size: 2rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.5rem;
                    }
                  `}
                >
                  {title}
                </p>
              )}
              {onEdit && (
                <EditTitleForm
                  autoFocus
                  savingEdit={savingEdit}
                  style={{ width: '80%' }}
                  maxLength={200}
                  title={title}
                  onEditSubmit={handleEditedTitleSubmit}
                  onClickOutSide={() => setOnEdit(false)}
                />
              )}
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                lineHeight: '2rem'
              }}
            >
              {uploadedLabel}
            </div>
          </div>
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: bold;
              color: ${Color.darkerGray()};
              margin-bottom: 0.5rem;
            `}
          >
            {likes.length > 0 ? likesLabel : null}
            {numComments > 0 ? commentsLabel : null}
          </div>
        </div>
      </section>
      {!onEdit && editButtonShown && (
        <div>
          <DropdownButton
            skeuomorphic
            icon="chevron-down"
            color="darkerGray"
            menuProps={editMenuItems}
          />
        </div>
      )}
      {confirmModalShown && (
        <ConfirmModal
          title="Remove Link"
          onConfirm={handleDelete}
          onHide={() => setConfirmModalShown(false)}
        />
      )}
      {userListModalShown && (
        <UserListModal
          users={likes}
          onHide={() => setUserListModalShown(false)}
          title="People who liked this link"
        />
      )}
    </nav>
  ) : null;

  async function handleDelete() {
    await deleteContent({ id, contentType: 'url' });
    onDeleteContent({ contentType: 'url', contentId: id });
  }

  async function handleEditedTitleSubmit(text: string) {
    setSavingEdit(true);
    await editContent({ editedTitle: text, contentId: id, contentType: 'url' });
    onEditLinkTitle({ title: text, id });
    setOnEdit(false);
    setSavingEdit(false);
  }
}
