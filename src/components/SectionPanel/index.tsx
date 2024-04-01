import React, { useMemo, useRef, useState } from 'react';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Body from './Body';
import SearchInput from '~/components/Texts/SearchInput';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import { addEmoji, stringIsEmpty } from '~/helpers/stringHelpers';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useOutsideClick } from '~/helpers/hooks';
import { returnTheme } from '~/helpers';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const editLabel = localize('edit');

export default function SectionPanel({
  button,
  canEdit,
  children,
  customColorTheme,
  emptyMessage,
  innerRef,
  inverted,
  isEmpty,
  isSearching,
  loaded,
  loadMoreButtonShown,
  onEditTitle,
  onLoadMore,
  onSearch,
  placeholder = 'Enter Title',
  searchPlaceholder,
  searchQuery = '',
  style,
  innerStyle = {},
  title
}: {
  canEdit?: boolean;
  title: React.ReactNode | string;
  button?: React.ReactNode;
  emptyMessage?: string;
  innerRef?: React.RefObject<HTMLElement>;
  inverted?: boolean;
  isEmpty?: boolean;
  isSearching?: boolean;
  loaded?: boolean;
  onLoadMore?: () => void;
  children?: React.ReactNode;
  loadMoreButtonShown?: boolean;
  onEditTitle?: (v: string) => void;
  onSearch?: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  style?: React.CSSProperties;
  customColorTheme?: string;
  innerStyle?: React.CSSProperties;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const [savingEdit, setSavingEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [onEdit, setOnEdit] = useState(false);
  const [editedTitle, setEditedTitle] = useState(
    typeof title === 'string' ? title : ''
  );
  const {
    success: { color: successColor },
    sectionPanel: { color: sectionPanelColor },
    sectionPanelText: {
      color: sectionPanelTextColor,
      shadow: sectionPanelTextShadowColor
    }
  } = useMemo(
    () => returnTheme(customColorTheme || profileTheme),
    [customColorTheme, profileTheme]
  );

  const TitleInputRef = useRef(null);
  useOutsideClick(TitleInputRef, () => {
    setOnEdit(false);
    setEditedTitle(typeof title === 'string' ? title : '');
  });

  const paddingTop = useMemo(() => {
    return inverted ? '1.7rem' : '1rem';
  }, [inverted]);

  const searchWidth = useMemo(() => {
    return onSearch ? '40%' : 'auto';
  }, [onSearch]);

  const { color, textShadow } = useMemo(() => {
    return {
      color: Color[sectionPanelTextColor](),
      textShadow: sectionPanelTextShadowColor
        ? `0 0.05rem ${Color[sectionPanelTextShadowColor]()}`
        : 'none'
    };
  }, [sectionPanelTextColor, sectionPanelTextShadowColor]);

  return (
    <div
      style={style}
      className={css`
        border: 1px solid ${Color.borderGray()};
        width: 100%;
        background: #fff;
        border-radius: ${borderRadius};
        margin-bottom: 1rem;
        > header {
          display: grid;
          width: 100%;
          grid-template-areas: 'title search buttons';
          grid-template-columns: auto ${searchWidth} auto;
          background: #fff;
          color: ${color};
          text-shadow: ${textShadow};
          border-top-left-radius: ${borderRadius};
          border-top-right-radius: ${borderRadius};
          padding: 1rem;
          padding-top: ${paddingTop};
          font-weight: bold;
          font-size: 2.5rem;
          align-items: center;
        }
        > main {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 1rem;
          width: 100%;
          justify-content: center;
          min-height: 15rem;
        }
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: 0;
          border-right: 0;
          > header {
            font-size: 2rem;
            border-radius: 0;
          }
        }
      `}
    >
      <header ref={innerRef}>
        <div
          className={css`
            grid-area: title;
            margin-right: 1rem;
            display: flex;
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              width: 100%;
            `}
          >
            {onEdit ? (
              <div
                ref={TitleInputRef}
                className={css`
                  width: 100%;
                  display: flex;
                  align-items: center;
                `}
              >
                <Input
                  style={{ width: '100%' }}
                  maxLength={100}
                  placeholder={placeholder}
                  autoFocus
                  onChange={(text) => setEditedTitle(addEmoji(text))}
                  onKeyPress={(event: { key: string }) => {
                    if (!stringIsEmpty(editedTitle) && event.key === 'Enter') {
                      onChangeTitle(editedTitle);
                    }
                  }}
                  value={editedTitle}
                />
                {!stringIsEmpty(editedTitle) && title !== editedTitle && (
                  <Button
                    style={{ marginLeft: '1rem', zIndex: 1000 }}
                    filled
                    disabled={savingEdit}
                    color={successColor}
                    onClick={() => onChangeTitle(editedTitle)}
                  >
                    <Icon icon="check" size="lg" />
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={css`
                  line-height: 1.5;
                  width: 100%;
                  overflow-wrap: break-word;
                  word-break: break-word;
                `}
              >
                {title}
              </div>
            )}
            {!!canEdit && !!onEditTitle && !onEdit ? (
              <div
                className={css`
                  color: ${Color.gray()};
                  font-weight: normal;
                  margin-top: 0.5rem;
                  font-size: 1.5rem;
                  display: flex;
                  line-height: 1.7rem;
                  align-items: flex-end;
                `}
              >
                <span
                  className={css`
                    cursor: pointer;
                    &:hover {
                      text-decoration: underline;
                    }
                  `}
                  onClick={() => {
                    setOnEdit(true);
                    setEditedTitle(typeof title === 'string' ? title : '');
                  }}
                >
                  <Icon icon="pencil-alt" />
                  &nbsp;&nbsp;{editLabel}
                </span>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
        {onSearch && (
          <SearchInput
            addonColor={sectionPanelColor}
            borderColor={sectionPanelColor}
            style={{
              color: '#fff',
              gridArea: 'search',
              width: '100%',
              justifySelf: 'center',
              zIndex: 0
            }}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            value={searchQuery}
          />
        )}
        <div
          className={css`
            grid-area: buttons;
            justify-self: end;
            @media (max-width: ${mobileMaxWidth}) {
              button {
                font-size: 1.3rem;
              }
            }
          `}
        >
          {button}
        </div>
      </header>
      <main
        className={css`
          width: 100%;
        `}
        style={innerStyle}
      >
        {loaded ? (
          <Body
            content={children}
            emptyMessage={emptyMessage}
            loadMoreButtonShown={loadMoreButtonShown}
            isEmpty={isEmpty}
            isSearching={isSearching}
            searchQuery={searchQuery}
            statusMsgStyle={css`
              padding: 0 1rem;
              font-size: 2.5rem;
              font-weight: bold;
              display: flex;
              justify-content: center;
              align-items: center;
              color: ${Color.darkerGray()};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
          />
        ) : (
          <Loading theme={customColorTheme} />
        )}
        {loadMoreButtonShown && (
          <div
            className={css`
              display: flex;
              justify-content: center;
            `}
          >
            <LoadMoreButton
              transparent
              theme={customColorTheme}
              loading={loading}
              onClick={handleLoadMore}
              style={{ fontSize: '2rem' }}
            />
          </div>
        )}
      </main>
    </div>
  );

  async function onChangeTitle(title: string) {
    if (savingEdit) return;
    setSavingEdit(true);
    await onEditTitle?.(title);
    setOnEdit(false);
    setSavingEdit(false);
  }

  async function handleLoadMore() {
    if (!loading) {
      setLoading(true);
      await onLoadMore?.();
      setLoading(false);
    }
  }
}
