import React, { useEffect, useRef, useState } from 'react';
import Checkbox from '~/components/Checkbox';
import Link from '~/components/Link';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { isTablet } from '~/helpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const deviceIsTablet = isTablet(navigator);

export default function Categories({
  filter,
  onSetDefaultSearchFilter,
  style
}: {
  filter: string;
  onSetDefaultSearchFilter?: () => void;
  style?: React.CSSProperties;
}) {
  const mounted = useRef(true);
  const setDefaultSearchFilter = useAppContext(
    (v) => v.requestHelpers.setDefaultSearchFilter
  );
  const onChangeDefaultSearchFilter = useAppContext(
    (v) => v.user.actions.onChangeDefaultSearchFilter
  );
  const defaultSearchFilter = useKeyContext((v) => v.myState.searchFilter);
  const searchColor = useKeyContext((v) => v.theme.search.color);
  const searchShadowColor = useKeyContext((v) => v.theme.search.shadow);
  const [changingDefaultFilter, setChangingDefaultFilter] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return function cleanUp() {
      mounted.current = false;
    };
  }, []);

  return (
    <ErrorBoundary componentPath="Explore/Categories">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          alignItems: 'center',
          ...style
        }}
      >
        <div
          className={css`
            width: 80%;
            color: ${Color[searchColor]()};
            > nav {
              width: 100%;
              text-align: center;
              > p {
                cursor: default;
                font-weight: bold;
                text-transform: capitalize;
                font-size: 3.5rem;
                text-shadow: ${searchShadowColor
                  ? `0.05rem 0.05rem ${Color[searchShadowColor]()}`
                  : 'none'};
                > svg {
                  font-size: 3.2rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 2.2rem;
                  }
                }
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 2.5rem;
                }
              }
              > a {
                line-height: 1.8;
                font-size: 2.7rem;
                cursor: pointer;
                text-transform: capitalize;
                color: ${Color.gray()};
                transition: color 0.1s;
                &:hover {
                  text-decoration: none;
                  color: ${Color[searchColor]()};
                }
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.7rem;
                }
              }
              span {
                font-size: 1.5rem;
              }
            }
          `}
        >
          {['ai-cards', 'subjects', 'videos', 'links'].map((contentType) => {
            const displayedContentType =
              contentType === 'ai-cards' ? 'AI Cards' : contentType;
            const exploreLabel =
              SELECTED_LANGUAGE === 'kr' ? (
                <>{localize(displayedContentType.slice(0, -1))} 탐색</>
              ) : (
                <>
                  {deviceIsTablet ? '' : `Explore `}
                  {displayedContentType}
                </>
              );
            const alwaysExploreFirstLabel =
              SELECTED_LANGUAGE === 'kr'
                ? `항상 ${localize(
                    displayedContentType.slice(0, -1)
                  )} 먼저 탐색하기:`
                : `Always explore ${displayedContentType} first:`;

            let icon = '';
            if (contentType === 'ai-cards') {
              icon = 'cards-blank';
            }
            if (contentType === 'subjects') {
              icon = 'bolt';
            }
            if (contentType === 'videos') {
              icon = 'film';
            }
            if (contentType === 'links') {
              icon = 'book';
            }
            const DisplayedIcon = (
              <Icon style={{ marginRight: '1.5rem' }} icon={icon} />
            );

            return filter === contentType ? (
              <ErrorBoundary
                key={`${contentType}-active`}
                componentPath="Explore/Categories/Active"
              >
                <nav
                  style={{
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  <p>
                    {DisplayedIcon}
                    {exploreLabel}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      opacity: changingDefaultFilter ? 0.5 : 1
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Checkbox
                        backgroundColor="#fff"
                        label={alwaysExploreFirstLabel}
                        textIsClickable
                        style={{
                          width: 'auto',
                          marginBottom: '0.5rem'
                        }}
                        className={css`
                          > p {
                            font-size: 1.7rem;
                            @media (max-width: ${mobileMaxWidth}) {
                              font-size: 1.3rem;
                            }
                          }
                        `}
                        checked={filter === defaultSearchFilter}
                        onClick={handleSetDefaultSearchFilter}
                      />
                      {changingDefaultFilter && (
                        <Icon
                          style={{ marginLeft: '0.5rem' }}
                          icon="spinner"
                          pulse
                        />
                      )}
                    </div>
                  </div>
                </nav>
              </ErrorBoundary>
            ) : (
              <ErrorBoundary
                key={contentType}
                componentPath="Explore/Categories/Inactive"
              >
                <nav>
                  <Link to={`/${contentType}`}>
                    {DisplayedIcon}
                    {exploreLabel}
                  </Link>
                </nav>
              </ErrorBoundary>
            );
          })}
        </div>
      </div>
    </ErrorBoundary>
  );

  async function handleSetDefaultSearchFilter() {
    if (filter === defaultSearchFilter) return;
    onChangeDefaultSearchFilter(filter);
    setChangingDefaultFilter(true);
    try {
      await setDefaultSearchFilter(filter);
      if (!mounted.current) return;
    } catch (error) {
      console.error(error);
    } finally {
      setChangingDefaultFilter(false);
      onSetDefaultSearchFilter?.();
    }
  }
}
