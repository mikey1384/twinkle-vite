import { useMemo } from 'react';
import { useTheme } from '~/helpers/hooks';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import renderEnglishMessage from './localization/english';
import renderKoreanMessage from './localization/korean';

export default function useHeadingText({ action, contentObj, theme }) {
  const {
    id,
    byUser,
    commentId,
    targetObj = {},
    replyId,
    rootType,
    contentType,
    uploader,
    rootObj
  } = contentObj;
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor },
    userLink: { color: userLinkColor },
    content: { color: contentColor }
  } = useTheme(theme || profileTheme);
  const HeadingText = useMemo(() => {
    const params = {
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
    };
    return SELECTED_LANGUAGE === 'kr'
      ? renderKoreanMessage(params)
      : renderEnglishMessage(params);
  }, [
    action,
    byUser,
    contentColor,
    commentId,
    contentObj,
    contentType,
    id,
    linkColor,
    replyId,
    rootObj,
    rootType,
    targetObj,
    theme,
    uploader,
    userLinkColor
  ]);

  return HeadingText;
}
