import React, { useContext, useMemo, useState } from 'react';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import LocalContext from '../../Context';
import { Color } from '~/constants/css';
import { isMobile } from '~/helpers';

const editGroupNameLabel = localize('editGroupName');
const hideLabel = localize('hide');
const invitePeopleLabel = localize('invitePeople');
const leaveLabel = localize('leave');
const settingsLabel = localize('settings');
const addToFavoritesLabel = localize('addToFavorites');
const deviceIsMobile = isMobile(navigator);
const menuLabel = deviceIsMobile ? '' : localize('menu');

export default function DefaultChannelTopMenu({
  currentChannel,
  isShown,
  onFavoriteClick,
  onSetHideModalShown,
  onSetInviteUsersModalShown,
  onSetLeaveConfirmModalShown,
  onSetSettingsModalShown,
  userId
}: {
  currentChannel: any;
  isShown: boolean;
  onFavoriteClick: () => void;
  onSetHideModalShown: (shown: boolean) => void;
  onSetInviteUsersModalShown: (shown: boolean) => void;
  onSetLeaveConfirmModalShown: (shown: boolean) => void;
  onSetSettingsModalShown: (shown: boolean) => void;
  userId: number;
}) {
  const [addToFavoritesShown, setAddToFavoritesShown] = useState(false);
  const {
    state: { allFavoriteChannelIds, selectedChannelId }
  } = useContext(LocalContext);
  const favorited = useMemo(() => {
    return allFavoriteChannelIds[selectedChannelId];
  }, [allFavoriteChannelIds, selectedChannelId]);
  const menuProps = useMemo(() => {
    if (currentChannel.twoPeople) {
      return [
        {
          label: (
            <>
              <Icon icon="minus" />
              <span style={{ marginLeft: '1rem' }}>{hideLabel}</span>
            </>
          ),
          onClick: () => onSetHideModalShown(true)
        }
      ];
    }
    const result = [];
    if (!currentChannel.isClosed || currentChannel.creatorId === userId) {
      result.push({
        label: (
          <>
            <Icon icon="users" />
            <span style={{ marginLeft: '1rem' }}>{invitePeopleLabel}</span>
          </>
        ),
        onClick: () => onSetInviteUsersModalShown(true)
      });
    }
    result.push(
      {
        label:
          currentChannel.creatorId === userId ? (
            <>
              <Icon icon="sliders-h" />
              <span style={{ marginLeft: '1rem' }}>{settingsLabel}</span>
            </>
          ) : (
            <>
              <Icon icon="pencil-alt" />
              <span style={{ marginLeft: '1rem' }}>{editGroupNameLabel}</span>
            </>
          ),
        onClick: () => onSetSettingsModalShown(true)
      },
      {
        separator: true
      },
      {
        label: (
          <>
            <Icon icon="sign-out-alt" />
            <span style={{ marginLeft: '1rem' }}>{leaveLabel}</span>
          </>
        ),
        onClick: () => onSetLeaveConfirmModalShown(true)
      }
    );
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentChannel.twoPeople,
    currentChannel.isClosed,
    currentChannel.creatorId,
    userId,
    selectedChannelId
  ]);

  return isShown ? (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        alignItems: 'center',
        zIndex: 50000,
        top: '1rem',
        right: '1rem'
      }}
    >
      <DropdownButton
        skeuomorphic
        opacity={0.7}
        listStyle={{
          width: '15rem'
        }}
        icon="bars"
        text={menuLabel}
        menuProps={menuProps}
      />
      <div
        style={{
          marginLeft: '1.5rem'
        }}
      >
        <div
          style={{ cursor: 'pointer', fontSize: '2rem' }}
          onClick={onFavoriteClick}
          onMouseEnter={() => {
            if (!favorited) {
              setAddToFavoritesShown(true);
            }
          }}
          onMouseLeave={() => setAddToFavoritesShown(false)}
        >
          <Icon
            color={Color.brownOrange()}
            icon={favorited ? 'star' : ['far', 'star']}
          />
        </div>
        <FullTextReveal
          direction="left"
          className="desktop"
          show={addToFavoritesShown && !favorited}
          text={addToFavoritesLabel}
          style={{
            marginTop: '0.5rem',
            fontSize: '1.3rem',
            width: 'auto',
            minWidth: undefined,
            maxWidth: undefined,
            padding: '1rem'
          }}
        />
      </div>
    </div>
  ) : null;
}
