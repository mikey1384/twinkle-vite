import React, { useRef, useState } from 'react';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import {
  isValidEmailAddress,
  isValidUrl,
  isValidYoutubeChannelUrl,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { useInputContext, useKeyContext } from '~/contexts';

export default function InfoEditForm({
  email,
  onCancel,
  onSubmit,
  website,
  youtubeName,
  youtubeUrl
}: {
  email: string;
  onCancel: () => any;
  onSubmit: (arg0: any) => Promise<any>;
  website: string;
  youtubeName: string;
  youtubeUrl: string;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [checking, setChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userInfo = useInputContext((v) => v.state.userInfo);
  const onSetEditedEmail = useInputContext((v) => v.actions.onSetEditedEmail);
  const onSetEmailError = useInputContext((v) => v.actions.onSetEmailError);
  const onSetEditedWebsite = useInputContext(
    (v) => v.actions.onSetEditedWebsite
  );
  const onSetWebsiteError = useInputContext((v) => v.actions.onSetWebsiteError);
  const onSetEditedYoutubeName = useInputContext(
    (v) => v.actions.onSetEditedYoutubeName
  );
  const onSetEditedYoutubeUrl = useInputContext(
    (v) => v.actions.onSetEditedYoutubeUrl
  );
  const onSetYoutubeError = useInputContext((v) => v.actions.onSetYoutubeError);

  const {
    editedEmail = email || '',
    emailError = '',
    editedWebsite = website || '',
    websiteError = '',
    editedYoutubeUrl = youtubeUrl || '',
    youtubeError = '',
    editedYoutubeName = youtubeName || ''
  } = userInfo;
  const timerRef: React.MutableRefObject<any> = useRef(null);

  return (
    <div>
      <Input
        maxLength={50}
        placeholder="Email Address"
        onChange={onEmailInputChange}
        value={editedEmail}
        style={{ borderColor: emailError && 'red' }}
      />
      {emailError && <span style={{ color: 'red' }}>{emailError}</span>}
      <Input
        maxLength={150}
        placeholder="YouTube Channel URL"
        style={{ marginTop: '1rem', borderColor: youtubeError && 'red' }}
        onChange={onYoutubeInputChange}
        value={editedYoutubeUrl}
      />
      {youtubeError && <span style={{ color: 'red' }}>{youtubeError}</span>}
      {!stringIsEmpty(editedYoutubeUrl) && (
        <Input
          maxLength={50}
          placeholder="YouTube Channel Name"
          style={{ marginTop: '1rem' }}
          onChange={(text) => onSetEditedYoutubeName(text)}
          value={editedYoutubeName}
        />
      )}
      <Input
        maxLength={150}
        placeholder="Website URL"
        style={{ marginTop: '1rem', borderColor: websiteError && 'red' }}
        onChange={onWebsiteInputChange}
        value={editedWebsite}
      />
      {websiteError && <span style={{ color: 'red' }}>{websiteError}</span>}
      <div
        style={{
          display: 'flex',
          marginTop: '1rem',
          justifyContent: 'center'
        }}
      >
        <Button transparent onClick={onCancel}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          loading={isSubmitting}
          disabled={
            checking || emailError || websiteError || youtubeError || noChange()
          }
          style={{ marginLeft: '0.5rem' }}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </div>
    </div>
  );

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await onSubmit({
        email: editedEmail,
        website: editedWebsite,
        youtubeName: editedYoutubeName,
        youtubeUrl: editedYoutubeUrl
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function noChange() {
    return (
      editedEmail === (email || '') &&
      editedWebsite === (website || '') &&
      editedYoutubeName === (youtubeName || '') &&
      editedYoutubeUrl === (youtubeUrl || '')
    );
  }

  function onEmailInputChange(text: string) {
    onSetEditedEmail(text);
    onSetEmailError('');
    checkEmail(text);
  }

  function checkEmail(text: string) {
    clearTimeout(timerRef.current);
    setChecking(true);
    timerRef.current = setTimeout(() => {
      onSetEmailError(
        !stringIsEmpty(text) && !isValidEmailAddress(text)
          ? 'That is not a valid email'
          : ''
      );
      setChecking(false);
    }, 1000);
  }

  function onWebsiteInputChange(text: string) {
    onSetEditedWebsite(text);
    onSetWebsiteError('');
    checkWebsiteUrl(text);
  }

  function checkWebsiteUrl(text: string) {
    clearTimeout(timerRef.current);
    setChecking(true);
    timerRef.current = setTimeout(() => {
      onSetWebsiteError(
        !stringIsEmpty(text) && !isValidUrl(text)
          ? 'That is not a valid website address'
          : ''
      );
      setChecking(false);
    }, 1000);
  }

  function onYoutubeInputChange(text: string) {
    onSetEditedYoutubeUrl(text);
    onSetYoutubeError('');
    checkYoutubeUrl(text);
  }

  function checkYoutubeUrl(text: string) {
    clearTimeout(timerRef.current);
    setChecking(true);
    timerRef.current = setTimeout(() => {
      onSetYoutubeError(
        !stringIsEmpty(text) && !isValidYoutubeChannelUrl(text)
          ? 'That is not a valid YouTube channel address'
          : ''
      );
      setChecking(false);
    }, 500);
  }
}
