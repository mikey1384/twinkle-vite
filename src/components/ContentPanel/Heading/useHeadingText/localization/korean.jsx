import { Color } from '~/constants/css';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import localize from '~/constants/localize';

export default function renderKoreanMessage({
  id,
  action,
  byUser,
  contentColor,
  commentId,
  contentObj,
  contentType,
  linkColor,
  replyId,
  rootObj,
  rootType,
  targetObj,
  theme,
  uploader,
  userLinkColor
}) {
  const contentLabel =
    rootType === 'url' ? 'link' : rootType === 'subject' ? 'subject' : rootType;
  const contentLinkColor = Color[contentColor]();

  switch (contentType) {
    case 'video':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} />
          님이 동영상을 게시했습니다:{' '}
          <ContentLink
            theme={theme}
            content={contentObj}
            contentType={contentType}
          />{' '}
        </>
      );
    case 'comment':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} />
          님이{' '}
          <ContentLink theme={theme} content={rootObj} contentType={rootType} />
          ({localize(contentLabel)})에 {renderTargetAction()}
          <ContentLink
            theme={theme}
            content={{ id, title: action }}
            contentType={contentType}
            style={{ color: contentLinkColor }}
          />{' '}
        </>
      );
    case 'url':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> 님이
          링크를 공유했습니다:{' '}
          <ContentLink
            theme={theme}
            content={contentObj}
            contentType={contentType}
          />{' '}
        </>
      );
    case 'subject':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} />
          님이{' '}
          {rootObj.id && (
            <>
              {localize(contentLabel)}(
              <ContentLink
                theme={theme}
                content={rootObj}
                contentType={rootType}
              />
              )에{' '}
            </>
          )}
          <ContentLink
            theme={theme}
            content={{ id, title: '주제를' }}
            contentType={contentType}
            style={{
              color: byUser ? Color[userLinkColor]() : contentLinkColor
            }}
          />{' '}
          개설했습니다{' '}
        </>
      );
    case 'pass':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} />
          님이{' '}
          <ContentLink
            theme={theme}
            content={{
              id: rootObj.id,
              title: `${rootObj.isTask ? '과제' : '임무'}(${rootObj.title})`,
              missionType: rootObj.missionType,
              rootMissionType: rootObj.rootMission?.missionType
            }}
            contentType="mission"
            style={{ color: Color.orange() }}
          />
          를 완료했습니다{' '}
        </>
      );
    default:
      return <span>Error</span>;
  }

  function renderTargetAction() {
    if (targetObj?.comment && !targetObj?.comment.notFound) {
      return (
        <span>
          <UsernameText
            user={targetObj.comment.uploader}
            color={Color[linkColor]()}
          />
          님이 남기신{' '}
          <ContentLink
            theme={theme}
            content={{
              id: replyId || commentId,
              title: replyId
                ? localize('reply')
                : rootType === 'user'
                ? localize('message')
                : localize('comment')
            }}
            contentType="comment"
            style={{ color: contentLinkColor }}
          />
          에{' '}
        </span>
      );
    }
    return null;
  }
}
