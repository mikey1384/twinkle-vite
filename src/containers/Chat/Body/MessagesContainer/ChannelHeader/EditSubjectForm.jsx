import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import {
  addEmoji,
  finalizeEmoji,
  stringIsEmpty,
  trimWhiteSpaces
} from '~/helpers/stringHelpers';
import { useOutsideClick } from '~/helpers/hooks';
import { Color } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useKeyContext } from '~/contexts';
import SearchDropdown from '~/components/SearchDropdown';
import Button from '~/components/Button';
import SubjectsModal from '../../../Modals/SubjectsModal';
import Input from '~/components/Texts/Input';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { edit } from '~/constants/placeholders';
import { css } from '@emotion/css';

EditSubjectForm.propTypes = {
  autoFocus: PropTypes.bool,
  channelId: PropTypes.number,
  currentSubjectId: PropTypes.number,
  displayedThemeColor: PropTypes.string,
  maxLength: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onClickOutSide: PropTypes.func.isRequired,
  onEditSubmit: PropTypes.func.isRequired,
  onReloadChatSubject: PropTypes.func,
  searchResults: PropTypes.array,
  title: PropTypes.string.isRequired,
  theme: PropTypes.string,
  userIsOwner: PropTypes.bool
};

export default function EditSubjectForm({
  autoFocus,
  channelId,
  currentSubjectId,
  displayedThemeColor,
  onReloadChatSubject,
  maxLength = 100,
  searchResults,
  onChange,
  onClickOutSide,
  userIsOwner,
  ...props
}) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const [exactMatchExists, setExactMatchExists] = useState(false);
  const [title, setTitle] = useState(props.title);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [readyForSubmit, setReadyForSubmit] = useState(false);
  const [subjectsModalShown, setSubjectsModalShown] = useState(false);
  const EditSubjectFormRef = useRef(null);
  const timerRef = useRef(null);
  useOutsideClick(EditSubjectFormRef, () => {
    if (!subjectsModalShown) onClickOutSide();
  });

  useEffect(() => {
    clearTimeout(timerRef.current);
    setReadyForSubmit(false);
    if (!stringIsEmpty(title)) {
      timerRef.current = setTimeout(() => handleChangeInput(title), 300);
    } else {
      setReadyForSubmit(true);
    }
    async function handleChangeInput(input) {
      await onChange(input);
      const content = input ? `${input[0].toUpperCase()}${input.slice(1)}` : '';
      for (let i = 0; i < searchResults.length; i++) {
        if (content === searchResults[i].content) {
          setExactMatchExists(true);
          break;
        }
      }
      setReadyForSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  return (
    <ErrorBoundary componentPath="MessagesContainer/ChannelHeader/EditSubjectForm">
      {subjectsModalShown && (
        <SubjectsModal
          channelId={channelId}
          displayedThemeColor={displayedThemeColor}
          currentSubjectId={currentSubjectId}
          onHide={() => setSubjectsModalShown(false)}
          userIsOwner={userIsOwner}
          onSelectSubject={(subjectId) => {
            onReloadChatSubject(subjectId);
            setSubjectsModalShown(false);
          }}
        />
      )}
      <div ref={EditSubjectFormRef} style={{ width: '100%', zIndex: 1 }}>
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}
          className={css`
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
          `}
        >
          <div style={{ width: '100%' }}>
            <form
              style={{
                width: '100%',
                position: 'relative',
                marginTop: '1.5rem'
              }}
            >
              <Input
                autoFocus={autoFocus}
                placeholder={edit.subject}
                value={title}
                onChange={onInputChange}
                onKeyUp={onKeyUp}
                onKeyDown={onKeyDown}
              />
              {searchResults.length > 0 && (
                <SearchDropdown
                  onUpdate={onUpdate}
                  onItemClick={onItemClick}
                  renderItemLabel={renderItemLabel}
                  startingIndex={-1}
                  style={{ width: '100%' }}
                  indexToHighlight={highlightedIndex}
                  searchResults={searchResults}
                />
              )}
              {!readyForSubmit && (
                <Loading style={{ position: 'absolute', top: 0 }} />
              )}
            </form>
          </div>
          <div
            style={{
              marginTop: '1.7rem',
              marginLeft: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Button
              style={{ fontSize: '1.3rem' }}
              filled
              color={displayedThemeColor}
              onClick={() => setSubjectsModalShown(true)}
            >
              View Topics
            </Button>
          </div>
        </div>
        <div style={{ background: '#fff' }}>
          <small style={{ color: title.length > maxLength && 'red' }}>
            {title.length}/{maxLength} Characters
          </small>
          {title.length <= maxLength && (
            <small>
              {' '}
              (Press <b>Enter</b> to Apply)
            </small>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  function onKeyDown(event) {
    let index = highlightedIndex;
    if (searchResults.length > 0 && !exactMatchExists) {
      if (event.keyCode === 40) {
        event.preventDefault();
        setHighlightedIndex(Math.min(++index, searchResults.length - 1));
      }
      if (event.keyCode === 38) {
        event.preventDefault();
        setHighlightedIndex(Math.max(--index, -1));
      }
    }
  }

  function onKeyUp(event) {
    if (event.keyCode === 13) {
      handleEditSubmit();
    } else {
      setTitle(addEmoji(event.target.value));
    }
  }

  function onInputChange(text) {
    setTitle(text);
    setHighlightedIndex(-1);
    setExactMatchExists(false);
  }

  function onUpdate() {
    let text = title ? `${title[0].toUpperCase()}${title.slice(1)}` : '';
    for (let i = 0; i < searchResults.length; i++) {
      if (text === searchResults[i].content) {
        setExactMatchExists(true);
        return setHighlightedIndex(i);
      }
    }
    setHighlightedIndex(-1);
  }

  function handleEditSubmit() {
    if (!readyForSubmit) return;
    if (highlightedIndex > -1) {
      const { id: subjectId } = searchResults[highlightedIndex];
      if (subjectId === currentSubjectId) return onClickOutSide();
      return onReloadChatSubject(subjectId);
    }
    if (stringIsEmpty(title)) return;
    if (title && title.length > maxLength) return;
    if (
      title &&
      trimWhiteSpaces(`${title[0].toUpperCase()}${title.slice(1)}`) !==
        props.title
    ) {
      props.onEditSubmit(finalizeEmoji(title));
    } else {
      onClickOutSide();
    }
  }

  function onItemClick(item) {
    const { id: subjectId } = item;
    if (subjectId === currentSubjectId) return onClickOutSide();
    onReloadChatSubject(subjectId);
  }

  function renderItemLabel(item) {
    return (
      <div>
        <div
          style={{
            color: Color[displayedThemeColor](),
            fontWeight: 'bold'
          }}
        >
          {item.content}
          <span style={{ color: Color[linkColor]() }}>
            {Number(item.numMsgs) > 0 && ` (${item.numMsgs})`}
          </span>
        </div>
        <div>
          <small>
            Posted by <b>{item.username}</b> ({timeSince(item.timeStamp)})
          </small>
        </div>
      </div>
    );
  }
}
