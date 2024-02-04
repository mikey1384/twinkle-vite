import React, { useEffect, useRef, useState } from 'react';
import {
  addEmoji,
  finalizeEmoji,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useKeyContext } from '~/contexts';
import SearchDropdown from '~/components/SearchDropdown';
import Input from '~/components/Texts/Input';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { edit } from '~/constants/placeholders';
import { css } from '@emotion/css';

export default function TopicInput({
  displayedThemeColor,
  maxLength = 100,
  searchResults,
  onSelectTopic,
  onSubmit
}: {
  channelId: number;
  displayedThemeColor: string;
  maxLength?: number;
  searchResults: any[];
  onSelectTopic: (v: number) => void;
  onSubmit: (input: string) => void;
}) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const [exactMatchExists, setExactMatchExists] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [readyForSubmit, setReadyForSubmit] = useState(false);
  const [topicLabel, setTopicLabel] = useState('');
  const EditSubjectFormRef = useRef(null);
  const timerRef: React.MutableRefObject<any> = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    setReadyForSubmit(false);
    if (!stringIsEmpty(topicLabel)) {
      timerRef.current = setTimeout(() => handleChangeInput(topicLabel), 300);
    } else {
      setReadyForSubmit(true);
    }
    async function handleChangeInput(input: string) {
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
  }, [topicLabel]);

  return (
    <ErrorBoundary componentPath="MessagesContainer/ChannelHeader/EditSubjectForm">
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
                placeholder={edit.subject}
                value={topicLabel}
                onChange={onInputChange}
                onKeyUp={onKeyUp}
                onKeyDown={onKeyDown}
              />
              {searchResults.length > 0 && (
                <SearchDropdown
                  onUpdate={onUpdate}
                  onItemClick={onItemClick}
                  renderItemLabel={renderItemLabel}
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
        </div>
        <div style={{ background: '#fff' }}>
          <small style={{ color: topicLabel.length > maxLength ? 'red' : '' }}>
            {topicLabel.length}/{maxLength} Characters
          </small>
          {topicLabel.length <= maxLength && (
            <small>
              {' '}
              (Press <b>Enter</b> to Apply)
            </small>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  function onKeyDown(event: any) {
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

  function onKeyUp(event: any) {
    if (event.keyCode === 13) {
      handleSubmit();
    } else {
      setTopicLabel(addEmoji(event.target.value));
    }
  }

  function onInputChange(text: string) {
    setTopicLabel(text);
    setHighlightedIndex(-1);
    setExactMatchExists(false);
  }

  function onUpdate() {
    const text = topicLabel
      ? `${topicLabel[0].toUpperCase()}${topicLabel.slice(1)}`
      : '';
    for (let i = 0; i < searchResults.length; i++) {
      if (text === searchResults[i].content) {
        setExactMatchExists(true);
        return setHighlightedIndex(i);
      }
    }
    setHighlightedIndex(-1);
  }

  function handleSubmit() {
    if (!readyForSubmit) return;
    if (stringIsEmpty(topicLabel)) return;
    if (topicLabel && topicLabel.length > maxLength) return;
    if (topicLabel) {
      onSubmit(finalizeEmoji(topicLabel));
    }
  }

  function onItemClick(item: any) {
    const { id: topicId } = item;
    onSelectTopic(topicId);
  }

  function renderItemLabel(item: any) {
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
