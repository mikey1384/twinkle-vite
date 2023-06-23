import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { isMobile } from '~/helpers';
import {
  stringIsEmpty,
  exceedsCharLimit,
  truncateText
} from '~/helpers/stringHelpers';
import { useChatContext, useInputContext } from '~/contexts';
import { SELECTED_LANGUAGE, VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const typeWordLabel = localize('typeWord');

Input.propTypes = {
  innerRef: PropTypes.object.isRequired,
  loading: PropTypes.bool,
  onInput: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  registerButtonShown: PropTypes.bool,
  isSubmitting: PropTypes.bool
};
export default function Input({
  innerRef,
  loading,
  onInput,
  onSubmit,
  registerButtonShown,
  isSubmitting
}: {
  innerRef: React.RefObject<any>;
  loading?: boolean;
  onInput: () => void;
  onSubmit: (text: string) => void;
  registerButtonShown: boolean;
  isSubmitting: boolean;
}) {
  const state = useInputContext((v) => v.state);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const onSetVocabErrorMessage = useChatContext(
    (v) => v.actions.onSetVocabErrorMessage
  );
  const text = useMemo(() => state[VOCAB_CHAT_TYPE]?.text || '', [state]);

  useEffect(() => {
    if (!deviceIsMobile) {
      innerRef.current.focus();
    }
  }, [innerRef]);

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
        <Textarea
          innerRef={innerRef}
          minRows={1}
          placeholder={typeWordLabel}
          onKeyDown={handleKeyDown}
          value={text}
          onChange={handleChange}
          hasError={!!messageExceedsCharLimit}
        />
        {registerButtonShown && (
          <div style={{ height: '100%', margin: '0.5rem 0 0.2rem 1rem' }}>
            <Button
              filled
              disabled={loading || isSubmitting || !!messageExceedsCharLimit}
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

  function handleChange(event: any) {
    const regex = /[^a-zA-Z\-'\s]/gi;
    const isInvalid = regex.test(event.target.value.trim());
    if (isInvalid) {
      if (SELECTED_LANGUAGE === 'kr') {
        return onSetVocabErrorMessage(
          `허용되지 않는 문자가 포함되어 있습니다: "${truncateText({
            text: event.target.value,
            limit: 20
          })}"`
        );
      }
      return onSetVocabErrorMessage(
        `"${truncateText({
          text: event.target.value,
          limit: 20
        })}" is not allowed for vocabulary section.`
      );
    }
    onInput();
    onSetVocabErrorMessage('');
    onEnterComment({
      contentType: VOCAB_CHAT_TYPE,
      text: event.target.value
    });
  }

  function handleKeyDown(event: any) {
    const enterKeyPressed = event.keyCode === 13;
    if (enterKeyPressed && !messageExceedsCharLimit && !loading) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    if (messageExceedsCharLimit) return;
    innerRef.current.focus();
    if (stringIsEmpty(text)) return;
    onSubmit(text);
  }
}
