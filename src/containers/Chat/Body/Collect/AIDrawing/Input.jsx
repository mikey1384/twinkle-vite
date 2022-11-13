import { useEffect, useMemo, useState } from 'react';
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
  onSubmit: PropTypes.func.isRequired
};

export default function Input({
  innerRef,
  loading,
  onSubmit,
  registerButtonShown
}) {
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

  function handleChange(event) {
    setText(event.target.value);
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
