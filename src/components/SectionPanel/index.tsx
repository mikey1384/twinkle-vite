import React, { useMemo, useRef, useState } from 'react';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Body from './Body';
import SearchInput from '~/components/Texts/SearchInput';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import { addEmoji, stringIsEmpty } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { useOutsideClick } from '~/helpers/hooks';
import localize from '~/constants/localize';
import ScopedTheme from '~/theme/ScopedTheme';
import { useSectionPanelVars } from '~/theme/useSectionPanelVars';

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
  title,
  elevated
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
  elevated?: boolean;
}) {
  const [savingEdit, setSavingEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [onEdit, setOnEdit] = useState(false);
  const [editedTitle, setEditedTitle] = useState(
    typeof title === 'string' ? title : ''
  );
  const {
    themeName,
    accentColorKey: sectionPanelColorKey,
    headerTextColor,
    headerTextShadow,
    successColor,
    styleVars
  } = useSectionPanelVars({
    customThemeName: customColorTheme
  });

  const TitleInputRef = useRef(null);

  useOutsideClick(TitleInputRef, () => {
    setOnEdit(false);
    setEditedTitle(typeof title === 'string' ? title : '');
  });

  const paddingTop = useMemo(() => {
    return inverted ? '1.7rem' : '1rem';
  }, [inverted]);

  return (
    <ScopedTheme theme={themeName} roles={['sectionPanel', 'sectionPanelText']}>
      <div
        style={{ ...(style || {}), ...styleVars }}
        className={css`
          border: 1px solid var(--section-panel-border-color);
          width: 100%;
          background: var(--section-panel-bg, transparent);
          border-radius: ${wideBorderRadius};
          box-shadow: ${elevated
            ? '0 22px 38px -28px rgba(15, 23, 42, 0.24), 0 1px 3px rgba(15, 23, 42, 0.12)'
            : 'none'};
          overflow: hidden;
          margin-bottom: 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          > header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 1.2rem;
            width: 100%;
            background: var(--section-panel-header-bg, transparent);
            color: var(--role-sectionPanelText-color, ${headerTextColor});
            text-shadow: var(
              --role-sectionPanelText-shadow,
              ${headerTextShadow}
            );
            border-bottom: none;
            padding: 1.2rem 1.8rem;
            padding-top: ${paddingTop};
            font-weight: 700;
            font-size: 2.3rem;
          }
          > main {
            position: relative;
            display: flex;
            flex-direction: column;
            padding: 1.6rem 1.8rem;
            width: 100%;
            justify-content: center;
            min-height: 15rem;
            background: var(--section-panel-body-bg, transparent);
          }
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            box-shadow: none;
            /* Mobile: remove side/bottom borders, keep a subtle top divider */
            border-left: 0;
            border-right: 0;
            border-bottom: 0;
            border-top: 1px solid var(--section-panel-border-color);
            > header {
              font-size: 2rem;
              padding: 1.1rem 1.4rem;
              gap: 0.8rem;
            }
            > main {
              padding: 1.2rem 1.4rem;
            }
          }
        `}
      >
        <header
          ref={innerRef}
          className={css`
            width: 100%;
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              width: 100%;
              min-width: 18rem;
              flex: 1 1 260px;
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
                  className={css`
                    width: 100%;
                    display: flex;
                    align-items: center;
                  `}
                >
                  <Input
                    inputRef={TitleInputRef as any}
                    style={{ width: '100%' }}
                    maxLength={100}
                    placeholder={placeholder}
                    autoFocus
                    onChange={(text) => setEditedTitle(addEmoji(text))}
                    onKeyPress={(event: { key: string }) => {
                      if (
                        !stringIsEmpty(editedTitle) &&
                        event.key === 'Enter'
                      ) {
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
              addonColor={sectionPanelColorKey}
              borderColor={sectionPanelColorKey}
              style={{
                color: Color.darkerGray(),
                flex: '1 1 240px',
                minWidth: '220px',
                maxWidth: '360px',
                width: '100%',
                alignSelf: 'stretch',
                zIndex: 0,
                background: 'rgba(255,255,255,0.95)',
                boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.35)',
                borderRadius: '12px'
              }}
              onChange={onSearch}
              placeholder={searchPlaceholder}
              value={searchQuery}
            />
          )}
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: flex-end;
              margin-left: auto;
              gap: 0.8rem;
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
                variant="ghost"
                theme={customColorTheme}
                loading={loading}
                onClick={handleLoadMore}
                style={{ fontSize: '2rem' }}
              />
            </div>
          )}
        </main>
      </div>
    </ScopedTheme>
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
