import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { isMobile } from '~/helpers';
import { stringIsEmpty, exceedsCharLimit } from '~/helpers/stringHelpers';
import { useInputContext } from '~/contexts';
import { AI_DRAWING_CHAT_TYPE } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

Input.propTypes = {
  innerRef: PropTypes.object,
  loading: PropTypes.bool,
  registerButtonShown: PropTypes.bool,
  onInput: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

export default function Input({
  innerRef,
  loading,
  onInput,
  onSubmit,
  registerButtonShown,
  isSubmitting
}) {
  const state = useInputContext((v) => v.state);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const text = useMemo(() => state[AI_DRAWING_CHAT_TYPE]?.text || '', [state]);

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
          placeholder="Enter a detailed description of the thing you want the AI to draw for you"
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
              disabled={loading || isSubmitting}
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

  function handleChange(event) {
    const regex = /[^a-zA-Z\-'\s]/gi;
    const isInvalid = regex.test(event.target.value.trim());
    if (isInvalid) {
      return console.log('not allowed here');
    }
    onInput();
    onEnterComment({
      contentType: AI_DRAWING_CHAT_TYPE,
      text: event.target.value
    });
  }

  function handleKeyDown(event) {
    const enterKeyPressed = event.keyCode === 13;
    if (enterKeyPressed && !messageExceedsCharLimit && !loading) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    innerRef.current.focus();
    if (stringIsEmpty(text)) return;
    onSubmit(text);
  }
}
