 
import React, { useMemo, useRef, useState } from 'react';
import Textarea from '~/components/Texts/Textarea';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Banner from '~/components/Banner';
import {
  exceedsCharLimit,
  isValidUrl,
  stringIsEmpty,
  addEmoji,
  finalizeEmoji
} from '~/helpers/stringHelpers';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';

export default function AddLinkModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const uploadContent = useAppContext((v) => v.requestHelpers.uploadContent);
  const onUploadLink = useExploreContext((v) => v.actions.onUploadLink);
  const [urlError, setUrlError] = useState('');
  const [form, setForm] = useState({
    url: '',
    title: '',
    description: ''
  });
  const UrlFieldRef: React.RefObject<any> = useRef(null);
  const descriptionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'url',
        inputType: 'description',
        text: form.description
      }),
    [form.description]
  );

  const titleExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'url',
        inputType: 'title',
        text: form.title
      }),
    [form.title]
  );

  const urlExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'url',
        inputType: 'url',
        text: form.url
      }),
    [form.url]
  );

  const urlHasError = useMemo(() => {
    if (urlError) {
      return {
        color: 'red',
        borderColor: 'red'
      };
    }
    return urlExceedsCharLimit?.style;
  }, [urlError, urlExceedsCharLimit]);

  return (
    <Modal onHide={onHide}>
      <header>Add Links</header>
      <main>
        {urlError && (
          <Banner style={{ marginBottom: '1rem' }}>{urlError}</Banner>
        )}
        <Input
          inputRef={UrlFieldRef}
          style={urlHasError}
          value={form.url}
          onChange={handleUrlFieldChange}
          placeholder="Paste the Link's Internet Address (URL) here"
        />
        <Input
          style={{ marginTop: '1rem', ...(titleExceedsCharLimit?.style || {}) }}
          value={form.title}
          onChange={(text) => setForm({ ...form, title: text })}
          placeholder="Enter Title"
          onKeyUp={(event: any) => {
            if (event.key === ' ') {
              setForm({
                ...form,
                title: addEmoji(event.target.value)
              });
            }
          }}
        />
        {titleExceedsCharLimit && (
          <small style={{ color: 'red', width: '100%' }}>
            {titleExceedsCharLimit?.message}
          </small>
        )}
        <Textarea
          style={{
            marginTop: '1rem'
          }}
          hasError={!!descriptionExceedsCharLimit}
          value={form.description}
          minRows={4}
          placeholder="Enter Description (Optional, you don't need to write this)"
          onChange={(event: any) =>
            setForm({ ...form, description: event.target.value })
          }
          onKeyUp={(event: any) => {
            if (event.key === ' ') {
              setForm({
                ...form,
                description: addEmoji(event.target.value)
              });
            }
          }}
        />
        {descriptionExceedsCharLimit && (
          <small style={{ color: 'red', width: '100%' }}>
            {descriptionExceedsCharLimit.message}
          </small>
        )}
      </main>
      <footer>
        <Button onClick={onHide} transparent style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          onClick={handleSubmit}
          disabled={submitDisabled()}
        >
          Add
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit(event: any) {
    const { url, title, description } = form;
    event.preventDefault();
    if (!isValidUrl(url)) {
      setUrlError('That is not a valid url');
      return UrlFieldRef.current.focus();
    }
    const linkItem = await uploadContent({
      url,
      title: finalizeEmoji(title),
      description: finalizeEmoji(description)
    });
    onUploadLink(linkItem);
    onHide();
  }

  function handleUrlFieldChange(text: string) {
    setForm({
      ...form,
      url: text
    });
    setUrlError('');
  }

  function submitDisabled() {
    const { url, title } = form;
    if (stringIsEmpty(url)) return true;
    if (stringIsEmpty(title)) return true;
    if (urlHasError) return true;
    if (titleExceedsCharLimit) return true;
    if (descriptionExceedsCharLimit) return true;
    return false;
  }
}
