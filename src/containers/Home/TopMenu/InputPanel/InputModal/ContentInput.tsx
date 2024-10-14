import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Banner from '~/components/Banner';
import RewardLevelForm from '~/components/Forms/RewardLevelForm';
import Link from '~/components/Link';
import Checkbox from '~/components/Checkbox';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { PanelStyle } from './Styles';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { scrollElementToCenter } from '~/helpers';
import {
  exceedsCharLimit,
  isValidUrl,
  isValidYoutubeUrl,
  stringIsEmpty,
  addEmoji,
  finalizeEmoji
} from '~/helpers/stringHelpers';
import {
  useAppContext,
  useHomeContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import localize from '~/constants/localize';
import RewardLevelExplainer from '~/components/RewardLevelExplainer';

const BodyRef = document.scrollingElement || document.documentElement;
const enterDescriptionOptionalLabel = localize('enterDescriptionOptional');
const enterTitleHereLabel = localize('enterTitleHere');
const postContentLabel = localize('postContent');
const copyAndPasteUrlLabel = localize('copyAndPasteUrl');
const youtubeVideoLabel = localize('youtubeVideo');

function ContentInput({ onModalHide }: { onModalHide: () => void }) {
  const checkContentUrl = useAppContext(
    (v) => v.requestHelpers.checkContentUrl
  );
  const uploadContent = useAppContext((v) => v.requestHelpers.uploadContent);
  const { canEditRewardLevel, banned } = useKeyContext((v) => v.myState);
  const {
    warning: { color: warningColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const content = useInputContext((v) => v.state.content);
  const onResetContentInput = useInputContext(
    (v) => v.actions.onResetContentInput
  );
  const onSetContentAlreadyPosted = useInputContext(
    (v) => v.actions.onSetContentAlreadyPosted
  );
  const onSetContentIsVideo = useInputContext(
    (v) => v.actions.onSetContentIsVideo
  );
  const onSetContentDescription = useInputContext(
    (v) => v.actions.onSetContentDescription
  );
  const onSetContentDescriptionFieldShown = useInputContext(
    (v) => v.actions.onSetContentDescriptionFieldShown
  );
  const onSetContentRewardLevel = useInputContext(
    (v) => v.actions.onSetContentRewardLevel
  );
  const onSetContentTitle = useInputContext((v) => v.actions.onSetContentTitle);
  const onSetContentTitleFieldShown = useInputContext(
    (v) => v.actions.onSetContentTitleFieldShown
  );
  const onSetContentUrl = useInputContext((v) => v.actions.onSetContentUrl);
  const onSetContentUrlError = useInputContext(
    (v) => v.actions.onSetContentUrlError
  );
  const onSetContentUrlHelper = useInputContext(
    (v) => v.actions.onSetContentUrlHelper
  );
  const onSetYouTubeVideoDetails = useInputContext(
    (v) => v.actions.onSetYouTubeVideoDetails
  );

  const {
    alreadyPosted: prevAlreadyPosted,
    descriptionFieldShown: prevDescriptionFieldShown,
    form,
    titleFieldShown: prevTitleFieldShown,
    urlHelper: prevUrlHelper,
    urlError: prevUrlError,
    ytDetails
  } = content;
  const alreadyPostedRef = useRef(prevAlreadyPosted);
  const [alreadyPosted, setAlreadyPosted] = useState(prevAlreadyPosted);
  const titleRef = useRef(form.title);
  const contentIsVideoRef = useRef(form.isVideo);
  const [contentIsVideo, setContentIsVideo] = useState(form.isVideo);
  const [title, setTitle] = useState(form.title);
  const descriptionRef = useRef(form.description);
  const [description, setDescription] = useState(form.description);
  const urlRef = useRef(form.url);
  const [url, setUrl] = useState(form.url);
  const descriptionFieldShownRef = useRef(prevDescriptionFieldShown);
  const [descriptionFieldShown, setDescriptionFieldShown] = useState(
    prevDescriptionFieldShown
  );
  const titleFieldShownRef = useRef(prevTitleFieldShown);
  const [titleFieldShown, setTitleFieldShown] = useState(prevTitleFieldShown);
  const urlErrorRef = useRef(prevUrlError);
  const [urlError, setUrlError] = useState(prevUrlError);
  const youTubeVideoDetailsRef = useRef(ytDetails);
  const [youTubeVideoDetails, setYouTubeVideoDetails] = useState(ytDetails);
  const [submitting, setSubmitting] = useState(false);
  const urlHelperRef = useRef(prevUrlHelper);
  const [urlHelper, setUrlHelper] = useState(prevUrlHelper);
  const UrlFieldRef: React.RefObject<any> = useRef(null);
  const checkContentExistsTimerRef: React.MutableRefObject<any> = useRef(null);
  const showHelperMessageTimerRef: React.MutableRefObject<any> = useRef(null);

  const loadingYTDetails = useMemo(() => {
    return contentIsVideo && !youTubeVideoDetails && !urlError;
  }, [contentIsVideo, urlError, youTubeVideoDetails]);

  const titleIsEmpty = useMemo(() => stringIsEmpty(title), [title]);
  const urlIsEmpty = useMemo(() => stringIsEmpty(url), [url]);
  const urlHelperIsEmpty = useMemo(() => stringIsEmpty(urlHelper), [urlHelper]);

  useEffect(() => {
    if (contentIsVideo && !isValidYoutubeUrl(url) && !urlIsEmpty) {
      setUrlError('That is not a valid YouTube url');
    }
  }, [contentIsVideo, url, urlIsEmpty]);

  const descriptionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'description',
        contentType: contentIsVideo ? 'video' : 'url',
        text: description
      }),
    [description, contentIsVideo]
  );

  const titleExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'title',
        contentType: contentIsVideo ? 'video' : 'url',
        text: title
      }),
    [contentIsVideo, title]
  );

  const urlExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'url',
        contentType: contentIsVideo ? 'video' : 'url',
        text: url
      }),
    [contentIsVideo, url]
  );

  const buttonDisabled = useMemo(() => {
    if (urlIsEmpty || titleIsEmpty) return true;
    if (urlError || urlExceedsCharLimit) return true;
    if (titleExceedsCharLimit) return true;
    if (descriptionExceedsCharLimit) return true;
    return false;
  }, [
    descriptionExceedsCharLimit,
    titleExceedsCharLimit,
    titleIsEmpty,
    urlError,
    urlExceedsCharLimit,
    urlIsEmpty
  ]);

  useEffect(() => {
    return function saveFormBeforeUnmount() {
      onSetContentAlreadyPosted(alreadyPostedRef.current);
      onSetContentIsVideo(contentIsVideoRef.current);
      onSetContentDescription(descriptionRef.current);
      onSetContentTitle(titleRef.current);
      onSetContentUrl(urlRef.current);
      onSetContentTitleFieldShown(titleFieldShownRef.current);
      onSetContentDescriptionFieldShown(descriptionFieldShownRef.current);
      onSetContentUrlError(urlErrorRef.current);
      onSetContentUrlHelper(urlHelperRef.current);
      onSetYouTubeVideoDetails(youTubeVideoDetailsRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary
      componentPath="Home/Stories/InputPanel/ContentInput"
      className={PanelStyle}
    >
      <p
        className={css`
          color: ${Color.darkerGray()};
          margin-bottom: 1rem;
          font-size: 2rem;
          font-weight: bold;
        `}
      >
        {postContentLabel}
      </p>
      {urlError && (
        <Banner color={warningColor} style={{ marginBottom: '1rem' }}>
          {urlError}
        </Banner>
      )}
      <Input
        inputRef={UrlFieldRef}
        hasError={!!urlError}
        style={urlExceedsCharLimit?.style || {}}
        value={url}
        onChange={handleUrlFieldChange}
        placeholder={copyAndPasteUrlLabel}
      />
      {alreadyPosted && (
        <div style={{ fontSize: '1.6rem', marginTop: '0.5rem' }}>
          This content has{' '}
          <Link
            style={{ fontWeight: 'bold', color: Color.rose() }}
            to={`/${alreadyPosted.contentType === 'url' ? 'link' : 'video'}s/${
              alreadyPosted.id
            }`}
          >
            already been posted before
          </Link>
        </div>
      )}
      <Checkbox
        label={`${youtubeVideoLabel}:`}
        onClick={() => {
          setUrlError('');
          handleSetContentIsVideo(!contentIsVideo);
        }}
        style={{ marginTop: '1rem' }}
        checked={contentIsVideo}
      />
      {!urlHelperIsEmpty && (
        <span
          style={{
            fontSize: '1.7rem',
            marginTop: '1rem',
            display: 'block'
          }}
          className={css`
            > a {
              font-weight: bold;
            }
          `}
          dangerouslySetInnerHTML={{
            __html: urlHelper
          }}
        />
      )}
      {loadingYTDetails && !urlIsEmpty ? (
        <Loading />
      ) : (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="unselectable" style={{ position: 'relative' }}>
            {titleFieldShown && (
              <ErrorBoundary componentPath="Home/Stories/InputPanel/ContentInput/TitleField">
                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: '2rem'
                  }}
                >
                  Title:
                </span>
                <Input
                  value={title}
                  onChange={handleSetTitle}
                  placeholder={`${enterTitleHereLabel}...`}
                  onKeyUp={(event: any) => {
                    if (event.key === ' ') {
                      handleSetTitle(addEmoji(event.target.value));
                    }
                  }}
                  style={{
                    ...(titleExceedsCharLimit?.style || {})
                  }}
                />
                {titleExceedsCharLimit && (
                  <small style={{ color: 'red' }}>
                    {titleExceedsCharLimit.message}
                  </small>
                )}
              </ErrorBoundary>
            )}
            {descriptionFieldShown && (
              <ErrorBoundary componentPath="Home/Stories/InputPanel/ContentInput/Textarea">
                <Textarea
                  value={description}
                  minRows={4}
                  placeholder={enterDescriptionOptionalLabel}
                  onChange={(event: any) =>
                    handleSetDescription(event.target.value)
                  }
                  onKeyUp={(event: any) => {
                    if (event.key === ' ') {
                      handleSetDescription(addEmoji(event.target.value));
                    }
                  }}
                  hasError={!!descriptionExceedsCharLimit}
                  style={{
                    marginTop: '1rem'
                  }}
                />
                {descriptionExceedsCharLimit && (
                  <small style={{ color: 'red' }}>
                    {descriptionExceedsCharLimit?.message}
                  </small>
                )}
              </ErrorBoundary>
            )}
          </div>
          {!buttonDisabled &&
            urlHelperIsEmpty &&
            contentIsVideo &&
            canEditRewardLevel && (
              <div style={{ marginTop: '1rem' }}>
                <RewardLevelExplainer
                  rewardLevel={form.rewardLevel}
                  type="video"
                />
                <RewardLevelForm
                  themed
                  isFromContentInput
                  alreadyPosted={!!alreadyPosted.id}
                  style={{
                    marginTop: '1rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    padding: '1rem',
                    fontSize: '3rem'
                  }}
                  rewardLevel={form.rewardLevel}
                  onSetRewardLevel={onSetContentRewardLevel}
                />
              </div>
            )}
          {descriptionFieldShown && (
            <div className="button-container">
              <Button
                filled
                color={successColor}
                loading={submitting}
                style={{ marginTop: '1rem' }}
                disabled={buttonDisabled}
                onClick={handleSubmit}
              >
                Share!
              </Button>
            </div>
          )}
        </div>
      )}
    </ErrorBoundary>
  );

  async function handleSubmit(event: any) {
    if (banned?.posting) {
      return;
    }
    let urlError;
    event.preventDefault();
    if (!isValidUrl(url)) urlError = 'That is not a valid url';
    if (contentIsVideo && !isValidYoutubeUrl(url)) {
      urlError = 'That is not a valid YouTube url';
    }
    if (urlError) {
      handleSetContentUrlError(urlError);
      UrlFieldRef.current?.focus();
      return scrollElementToCenter(UrlFieldRef.current);
    }
    setSubmitting(true);
    try {
      const data = await uploadContent({
        isVideo: contentIsVideo,
        url: url.trim(),
        rewardLevel: form.rewardLevel,
        title: finalizeEmoji(title),
        description: finalizeEmoji(description),
        ytDetails: contentIsVideo ? youTubeVideoDetails : null
      });
      if (data) {
        onResetContentInput();
        handleSetTitle('');
        handleSetDescription('');
        handleSetUrl('');
        handleSetContentAlreadyPosted(false);
        handleSetContentIsVideo(false);
        handleSetYouTubeVideoDetails(null);
        handleSetContentTitleFieldShown(false);
        handleSetContentUrlError('');
        handleSetContentUrlHelper('');
        handleSetContentDescriptionFieldShown(false);
        onLoadNewFeeds([data]);
        const appElement = document.getElementById('App');
        if (appElement) appElement.scrollTop = 0;
        BodyRef.scrollTop = 0;
      }
      setSubmitting(false);
      onModalHide();
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }

  function handleUrlFieldChange(text: string) {
    handleSetYouTubeVideoDetails(null);
    const urlIsValid = isValidUrl(text);
    handleSetContentAlreadyPosted(false);
    handleSetUrl(text);
    const isYouTubeVideo = isValidYoutubeUrl(text);
    handleSetContentIsVideo(isYouTubeVideo);
    handleSetContentTitleFieldShown(urlIsValid);
    handleSetContentDescriptionFieldShown(urlIsValid);
    handleSetContentUrlError('');
    handleSetContentUrlHelper('');
    if (urlIsValid) {
      clearTimeout(checkContentExistsTimerRef.current);
      checkContentExistsTimerRef.current = setTimeout(
        () => handleCheckUrl(text),
        600
      );
    }
    clearTimeout(showHelperMessageTimerRef.current);
    showHelperMessageTimerRef.current = setTimeout(() => {
      handleSetContentUrlHelper(
        urlIsValid || stringIsEmpty(text)
          ? ''
          : `A URL is a website's internet address. Twinkle Website's URL is <a href="https://www.twin-kle.com" target="_blank">www.twin-kle.com</a>. You can find a webpage's URL at the <b>top area of your browser</b>. Copy a URL you want to share and paste it to the box above.`
      );
      handleSetTitle(
        !urlIsValid && !stringIsEmpty(text) && text.length > 3 ? text : title
      );
      handleSetContentTitleFieldShown(!stringIsEmpty(text));
    }, 300);
  }

  async function handleCheckUrl(url: string) {
    const isVideo = isValidYoutubeUrl(url);
    const {
      exists,
      content,
      ytDetails: details
    } = await checkContentUrl({
      url,
      contentType: isVideo ? 'video' : 'url'
    });
    if (details) {
      if (!stringIsEmpty(details.ytTitle)) {
        handleSetTitle(details.ytTitle);
      }
      handleSetYouTubeVideoDetails(details);
    }
    return handleSetContentAlreadyPosted(exists ? content : false);
  }

  function handleSetContentAlreadyPosted(content: any) {
    setAlreadyPosted(content);
    alreadyPostedRef.current = content;
  }

  function handleSetContentIsVideo(isVideo: boolean) {
    setContentIsVideo(isVideo);
    contentIsVideoRef.current = isVideo;
  }

  function handleSetContentTitleFieldShown(shown: boolean) {
    setTitleFieldShown(shown);
    titleFieldShownRef.current = shown;
  }

  function handleSetContentDescriptionFieldShown(shown: boolean) {
    setDescriptionFieldShown(shown);
    descriptionFieldShownRef.current = shown;
  }

  function handleSetContentUrlError(error: any) {
    setUrlError(error);
    urlErrorRef.current = error;
  }

  function handleSetContentUrlHelper(helper: string) {
    setUrlHelper(helper);
    urlHelperRef.current = helper;
  }

  function handleSetYouTubeVideoDetails(details: any) {
    setYouTubeVideoDetails(details);
    youTubeVideoDetailsRef.current = details;
  }

  function handleSetTitle(text: string) {
    setTitle(text);
    titleRef.current = text;
  }

  function handleSetDescription(text: string) {
    setDescription(text);
    descriptionRef.current = text;
  }

  function handleSetUrl(text: string) {
    setUrl(text);
    urlRef.current = text;
  }
}

export default memo(ContentInput);
