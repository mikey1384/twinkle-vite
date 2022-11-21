import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { isMobile } from '~/helpers';
import {
  stringIsEmpty,
  exceedsCharLimit,
  truncateText
} from '~/helpers/stringHelpers';
import { useChatContext, useInputContext } from '~/contexts';
import { AI_DRAWING_CHAT_TYPE } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

PromptInput.propTypes = {
  innerRef: PropTypes.object,
  loading: PropTypes.bool,
  posting: PropTypes.bool,
  registerButtonShown: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired
};

export default function PromptInput({
  innerRef,
  loading,
  onSubmit,
  posting,
  registerButtonShown
}) {
  const onSetAIImageStatusMessage = useChatContext(
    (v) => v.actions.onSetAIImageStatusMessage
  );
  const onSetAIImageErrorMessage = useChatContext(
    (v) => v.actions.onSetAIImageErrorMessage
  );
  const state = useInputContext((v) => v.state);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const prevText = useMemo(
    () => state[AI_DRAWING_CHAT_TYPE]?.text || '',
    [state]
  );
  const [text, setText] = useState(prevText);

  useEffect(() => {
    if (!deviceIsMobile) {
      innerRef.current.focus();
    }
  }, [innerRef]);

  useEffect(() => {
    return () => {
      onEnterComment({
        contentType: AI_DRAWING_CHAT_TYPE,
        text
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const messageExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'message',
        contentType: 'chat',
        text
      }),
    [text]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex' }}>
        <Input
          inputRef={innerRef}
          placeholder="What do you want the AI to draw?"
          onKeyDown={handleKeyDown}
          value={text}
          onChange={handleChange}
          style={{
            ...(messageExceedsCharLimit?.style || {})
          }}
        />
        {registerButtonShown && (
          <div style={{ height: '100%', margin: '0.5rem 0 0.2rem 1rem' }}>
            <Button
              filled
              disabled={loading}
              color="green"
              onClick={handleSubmit}
            >
              <Icon icon="paper-plane" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  function handleChange(text) {
    onSetAIImageErrorMessage('');
    if (!posting) {
      onSetAIImageStatusMessage('');
    }
    const regex = /[^a-zA-Z0-9\-'".,?!\s]/gi;
    const isInvalid = regex.test(event.target.value.trim());
    if (isInvalid) {
      return onSetAIImageErrorMessage(
        `"${truncateText({
          text: event.target.value,
          limit: 20
        })}" contains character(s) that are not allowed.`
      );
    }
    setText(text);
  }

  function handleKeyDown(event) {
    if (posting) return;
    const enterKeyPressed = event.keyCode === 13;
    const shiftKeyPressed = event.shiftKey;
    if (
      enterKeyPressed &&
      !shiftKeyPressed &&
      !messageExceedsCharLimit &&
      !loading
    ) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    innerRef.current.focus();
    if (stringIsEmpty(text)) return;
    onSubmit(text);
    setText('');
  }
}
