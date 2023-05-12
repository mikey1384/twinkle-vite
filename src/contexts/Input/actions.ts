import { Dispatch } from '~/types';
import { VOCAB_CHAT_TYPE, AI_CARD_CHAT_TYPE } from '~/constants/defaultValues';

export default function InputActions(dispatch: Dispatch) {
  return {
    onEnterComment({
      contentId,
      contentType,
      text,
      targetKey
    }: {
      contentId: number;
      contentType: string;
      text: string;
      targetKey?: number;
    }) {
      return dispatch({
        type: 'ENTER_COMMENT',
        contentId,
        contentType,
        targetKey,
        text:
          contentType === VOCAB_CHAT_TYPE || contentType === AI_CARD_CHAT_TYPE
            ? text.replace(/\s+/g, ' ').toLowerCase()
            : text
      });
    },
    onResetContentInput() {
      return dispatch({
        type: 'RESET_CONTENT_INPUT'
      });
    },
    onResetSubjectInput() {
      return dispatch({
        type: 'RESET_SUBJECT_INPUT'
      });
    },
    onSetCommentAttachment({
      attachment,
      contentType,
      contentId
    }: {
      attachment: object;
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'SET_COMMENT_ATTACHMENT',
        attachment,
        contentType,
        contentId
      });
    },
    onSetContentAlreadyPosted(alreadyPosted: boolean) {
      return dispatch({
        type: 'SET_CONTENT_ALREADY_POSTED',
        alreadyPosted
      });
    },
    onSetContentIsVideo(isVideo: boolean) {
      return dispatch({
        type: 'SET_CONTENT_IS_VIDEO',
        isVideo
      });
    },
    onSetContentDescription(description: string) {
      return dispatch({
        type: 'SET_CONTENT_DESCRIPTION',
        description
      });
    },
    onSetContentRewardLevel(rewardLevel: number) {
      return dispatch({
        type: 'SET_CONTENT_REWARD_LEVEL',
        rewardLevel
      });
    },
    onSetContentTitle(title: string) {
      return dispatch({
        type: 'SET_CONTENT_TITLE',
        title
      });
    },
    onSetContentDescriptionFieldShown(shown: boolean) {
      return dispatch({
        type: 'SET_CONTENT_DESCRIPTION_FIELD_SHOWN',
        shown
      });
    },
    onSetContentTitleFieldShown(shown: boolean) {
      return dispatch({
        type: 'SET_CONTENT_TITLE_FIELD_SHOWN',
        shown
      });
    },
    onSetContentUrl(url: string) {
      return dispatch({
        type: 'SET_CONTENT_URL',
        url
      });
    },
    onSetContentUrlError(urlError: string) {
      return dispatch({
        type: 'SET_CONTENT_URL_ERROR',
        urlError
      });
    },
    onSetContentUrlHelper(urlHelper: string) {
      return dispatch({
        type: 'SET_CONTENT_URL_HELPER',
        urlHelper
      });
    },
    onSetEditedEmail(editedEmail: string) {
      return dispatch({
        type: 'SET_EDITED_EMAIL',
        editedEmail
      });
    },
    onSetEditedWebsite(editedWebsite: string) {
      return dispatch({
        type: 'SET_EDITED_WEBSITE',
        editedWebsite
      });
    },
    onSetEmailError(emailError: string) {
      return dispatch({
        type: 'SET_EMAIL_ERROR',
        emailError
      });
    },
    onSetEditedStatusColor(editedStatusColor: string) {
      return dispatch({
        type: 'SET_EDITED_STATUS_COLOR',
        editedStatusColor
      });
    },
    onSetEditedStatusMsg(editedStatusMsg: string) {
      return dispatch({
        type: 'SET_EDITED_STATUS_MSG',
        editedStatusMsg
      });
    },
    onSetEditedYoutubeName(editedYoutubeName: string) {
      return dispatch({
        type: 'SET_EDITED_YOUTUBE_NAME',
        editedYoutubeName
      });
    },
    onSetEditedYoutubeUrl(editedYoutubeUrl: string) {
      return dispatch({
        type: 'SET_EDITED_YOUTUBE_URL',
        editedYoutubeUrl
      });
    },
    onSetEditForm({
      contentId,
      contentType,
      form
    }: {
      contentId: number;
      contentType: string;
      form: object;
    }) {
      return dispatch({
        type: 'SET_EDIT_FORM',
        contentId,
        contentType,
        form
      });
    },
    onSetEditInteractiveForm({
      interactiveId,
      slideId,
      form
    }: {
      interactiveId: number;
      slideId: number;
      form: object;
    }) {
      return dispatch({
        type: 'SET_EDIT_INTERACTIVE_FORM',
        interactiveId,
        slideId,
        form
      });
    },
    onSetIsMadeByUser(isMadeByUser: boolean) {
      return dispatch({
        type: 'SET_IS_MADE_BY_USER',
        isMadeByUser
      });
    },
    onSetHasSecretAnswer(hasSecretAnswer: boolean) {
      return dispatch({
        type: 'SET_HAS_SECRET_ANSWER',
        hasSecretAnswer
      });
    },
    onSetMissionFeedbackForm({
      attemptId,
      form
    }: {
      attemptId: number;
      form: object;
    }) {
      return dispatch({
        type: 'SET_MISSION_FEEDBACK_FORM',
        attemptId,
        form
      });
    },
    onSetRewardForm({
      contentId,
      contentType,
      form
    }: {
      contentId: number;
      contentType: string;
      form: object;
    }) {
      return dispatch({
        type: 'SET_REWARD_FORM',
        contentId,
        contentType,
        form
      });
    },
    onSetSubjectInputForm({
      contentId,
      contentType,
      form
    }: {
      contentId: number;
      contentType: string;
      form: object;
    }) {
      return dispatch({
        type: 'SET_SUBJECT_INPUT_FORM',
        contentId,
        contentType,
        form
      });
    },
    onSetSearchText({
      category,
      searchText
    }: {
      category: string;
      searchText: string;
    }) {
      return dispatch({
        type: 'SET_SEARCH_TEXT',
        category,
        searchText
      });
    },
    onSetSecretAnswer(secretAnswer: string) {
      return dispatch({
        type: 'SET_SECRET_ANSWER',
        secretAnswer
      });
    },
    onSetSecretAttachment(secretAttachment: object) {
      return dispatch({
        type: 'SET_SECRET_ATTACHMENT',
        secretAttachment
      });
    },
    onSetSubjectAttachment(attachment: object) {
      return dispatch({
        type: 'SET_SUBJECT_ATTACHMENT',
        attachment
      });
    },
    onSetSubjectDescription(description: string) {
      return dispatch({
        type: 'SET_SUBJECT_DESCRIPTION',
        description
      });
    },
    onSetSubjectDescriptionFieldShown(shown: boolean) {
      return dispatch({
        type: 'SET_SUBJECT_DESCRIPTION_FIELD_SHOWN',
        shown
      });
    },
    onSetSubjectRewardLevel(rewardLevel: number) {
      return dispatch({
        type: 'SET_SUBJECT_REWARD_LEVEL',
        rewardLevel
      });
    },
    onSetSubjectTitle(title: string) {
      return dispatch({
        type: 'SET_SUBJECT_TITLE',
        title
      });
    },
    onSetUserInfoOnEdit(onEdit: boolean) {
      return dispatch({
        type: 'SET_USER_INFO_ON_EDIT',
        onEdit
      });
    },
    onSetYouTubeVideoDetails(ytDetails: object) {
      return dispatch({
        type: 'SET_YOUTUBE_VIDEO_DETAILS',
        ytDetails
      });
    },
    onSetWebsiteError(websiteError: string) {
      return dispatch({
        type: 'SET_WEBSITE_ERROR',
        websiteError
      });
    },
    onSetYoutubeError(youtubeError: string) {
      return dispatch({
        type: 'SET_YOUTUBE_ERROR',
        youtubeError
      });
    }
  };
}
