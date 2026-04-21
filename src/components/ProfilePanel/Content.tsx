import React from 'react';
import AlertModal from '~/components/Modals/AlertModal';
import Comments from '~/components/Comments';
import Link from '~/components/Link';
import Loading from '~/components/Loading';
import ProfilePic from '~/components/ProfilePic';
import RankBar from '~/components/RankBar';
import UserDetails from '~/components/UserDetails';
import AchievementBadges from '~/components/AchievementBadges';
import ScopedTheme from '~/theme/ScopedTheme';
import { ThemeName } from '~/theme';
import ActionButtons from './ActionButtons';
import EditModals from './EditModals';
import QuickLinks from './QuickLinks';
import {
  heroBadgesClass,
  heroSectionClass,
  imageTooLarge10MBLabel,
  leftColumnClass,
  panelContainerClass,
  pleaseSelectSmallerImageLabel,
  profileContentClass,
  profilePicClass,
  profilePicWrapperClass,
  rankBarWrapperClass,
  detailsColumnClass
} from './styles';

export default function Content({
  alertModalShown,
  banned,
  bioEditModalShown,
  canEdit,
  chatLoading,
  commentInputAreaRef,
  commentParent,
  comments,
  commentsLoadMoreButton,
  commentsShown,
  expandable,
  imageEditModalShown,
  imageUri,
  isAway,
  isBusy,
  isOnline,
  lastActive,
  loadingComments,
  noBio,
  numMessages,
  onDeleteComment,
  onEditComment,
  onEditRewardComment,
  onExpandComments,
  onHideAlert,
  onHideBioEditModal,
  onHideImageEditModal,
  onHideProfilePicModal,
  onImageEditDone,
  onLikeComment,
  onLoadMoreComments,
  onLoadMoreReplies,
  onLoadRepliesOfReply,
  onMessagesButtonClick,
  onOpenBioEditModal,
  onOpenCards,
  onOpenProfile,
  onOpenProfilePicModal,
  onReloadProfile,
  onRemoveStatusMsg,
  onSelectProfileImage,
  onSubmitBio,
  onTalkClick,
  onUpdateStatusMsg,
  onUploadComment,
  onUploadReply,
  panelContainerStyle,
  profile,
  profileFirstRow,
  profileId,
  profileLoaded,
  profileName,
  profilePicModalShown,
  profilePicUrl,
  profileSecondRow,
  profileThirdRow,
  profileUsername,
  themeName,
  twinkleXP,
  userId
}: {
  alertModalShown: boolean;
  banned?: any;
  bioEditModalShown: boolean;
  canEdit: boolean;
  chatLoading: boolean;
  commentInputAreaRef: React.RefObject<any>;
  commentParent: any;
  comments: any[];
  commentsLoadMoreButton: any;
  commentsShown: boolean;
  expandable?: boolean;
  imageEditModalShown: boolean;
  imageUri: any;
  isAway: boolean;
  isBusy: boolean;
  isOnline: boolean;
  lastActive?: any;
  loadingComments: boolean;
  noBio: boolean;
  numMessages: number;
  onDeleteComment: any;
  onEditComment: any;
  onEditRewardComment: any;
  onExpandComments: () => void;
  onHideAlert: () => void;
  onHideBioEditModal: () => void;
  onHideImageEditModal: () => void;
  onHideProfilePicModal: () => void;
  onImageEditDone: ({
    pictures,
    filePath
  }: {
    pictures?: any[];
    filePath?: string;
  }) => void;
  onLikeComment: any;
  onLoadMoreComments: any;
  onLoadMoreReplies: any;
  onLoadRepliesOfReply: any;
  onMessagesButtonClick: () => void;
  onOpenBioEditModal: () => void;
  onOpenCards: () => void;
  onOpenProfile: () => void;
  onOpenProfilePicModal: () => void;
  onReloadProfile: () => void;
  onRemoveStatusMsg: (userId: number) => void;
  onSelectProfileImage: (selectedImageUri: any) => void;
  onSubmitBio: (params: object) => void | Promise<void>;
  onTalkClick: () => void;
  onUpdateStatusMsg: (data: any) => void;
  onUploadComment: any;
  onUploadReply: any;
  panelContainerStyle: React.CSSProperties;
  profile: any;
  profileFirstRow?: string;
  profileId: number;
  profileLoaded: boolean;
  profileName?: string;
  profilePicModalShown: boolean;
  profilePicUrl?: string;
  profileSecondRow?: string;
  profileThirdRow?: string;
  profileUsername: string;
  themeName: ThemeName;
  twinkleXP?: number;
  userId: number;
}) {
  return (
    <>
      <ScopedTheme theme={themeName} roles={['profilePanel']}>
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            overflow: 'visible'
          }}
        >
          <div className={panelContainerClass} style={panelContainerStyle}>
            <div className={`unselectable ${heroSectionClass}`}>
              <div className={heroBadgesClass}>
                <AchievementBadges
                  thumbSize="2.5rem"
                  unlockedAchievementIds={profile.unlockedAchievementIds}
                />
              </div>
            </div>
            {profileLoaded ? (
              <>
                <div className={profileContentClass}>
                  <div className={leftColumnClass}>
                    <div className={`unselectable ${profilePicWrapperClass}`}>
                      <Link
                        onClick={onReloadProfile}
                        to={`/users/${profileUsername}`}
                        style={{ display: 'block', width: '100%' }}
                      >
                        <ProfilePic
                          style={{ cursor: 'pointer' }}
                          className={profilePicClass}
                          userId={profileId}
                          profilePicUrl={profilePicUrl}
                          online={isOnline}
                          isBusy={isBusy}
                          isAway={isAway}
                          statusShown
                          large
                          statusSize="medium"
                        />
                      </Link>
                    </div>
                    <QuickLinks
                      cardsEnabled={!!profileUsername}
                      onOpenCards={onOpenCards}
                      website={profile.website}
                      youtubeUrl={profile.youtubeUrl}
                    />
                  </div>
                  <div className={detailsColumnClass}>
                    <UserDetails
                      profile={profile}
                      removeStatusMsg={onRemoveStatusMsg}
                      updateStatusMsg={onUpdateStatusMsg}
                      onSetBioEditModalShown={onOpenBioEditModal}
                      userId={userId}
                    />
                    <ActionButtons
                      banned={banned}
                      canEdit={canEdit}
                      chatLoading={chatLoading}
                      commentsShown={commentsShown}
                      expandable={expandable}
                      isOnline={isOnline}
                      lastActive={lastActive}
                      loadingComments={loadingComments}
                      noBio={noBio}
                      numMessages={numMessages}
                      onMessagesButtonClick={onMessagesButtonClick}
                      onOpenBioEditModal={onOpenBioEditModal}
                      onOpenCards={onOpenCards}
                      onOpenProfile={onOpenProfile}
                      onOpenProfilePicModal={onOpenProfilePicModal}
                      onTalkClick={onTalkClick}
                      profileId={profileId}
                      profileUsername={profileUsername}
                      userId={userId}
                    />
                  </div>
                </div>
                <EditModals
                  bioEditModalShown={bioEditModalShown}
                  imageEditModalShown={imageEditModalShown}
                  imageUri={imageUri}
                  onHideBioEditModal={onHideBioEditModal}
                  onHideImageEditModal={onHideImageEditModal}
                  onHideProfilePicModal={onHideProfilePicModal}
                  onImageEditDone={onImageEditDone}
                  onSelectProfileImage={onSelectProfileImage}
                  onSubmitBio={onSubmitBio}
                  profileFirstRow={profileFirstRow}
                  profilePicModalShown={profilePicModalShown}
                  profilePicUrl={profilePicUrl}
                  profileSecondRow={profileSecondRow}
                  profileThirdRow={profileThirdRow}
                />
              </>
            ) : (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '2rem 0'
                }}
              >
                <Loading />
              </div>
            )}
            {profileLoaded ? (
              <Comments
                comments={comments}
                commentsLoadLimit={5}
                commentsShown={commentsShown}
                theme={themeName}
                inputAreaInnerRef={commentInputAreaRef}
                inputTypeLabel={`message${
                  userId === profileId ? '' : ` to ${profileName}`
                }`}
                isLoading={loadingComments}
                loadMoreButton={commentsLoadMoreButton}
                numPreviews={1}
                onCommentSubmit={onUploadComment}
                onDelete={onDeleteComment}
                onEditDone={onEditComment}
                onLikeClick={onLikeComment}
                onLoadMoreComments={onLoadMoreComments}
                onLoadMoreReplies={onLoadMoreReplies}
                onLoadRepliesOfReply={onLoadRepliesOfReply}
                onPreviewClick={onExpandComments}
                onReplySubmit={onUploadReply}
                onRewardCommentEdit={onEditRewardComment}
                parent={commentParent}
                style={{ marginTop: '0.6rem' }}
                userId={userId}
              />
            ) : null}
          </div>
        </div>
        {alertModalShown ? (
          <AlertModal
            title={imageTooLarge10MBLabel}
            content={pleaseSelectSmallerImageLabel}
            onHide={onHideAlert}
          />
        ) : null}
      </ScopedTheme>
      {!!twinkleXP && profileLoaded ? (
        <div className={rankBarWrapperClass}>
          <ScopedTheme theme={themeName as any}>
            <RankBar profile={profile} />
          </ScopedTheme>
        </div>
      ) : null}
    </>
  );
}
