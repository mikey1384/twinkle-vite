import { useState } from 'react';
import PropTypes from 'prop-types';
import Checkbox from '~/components/Checkbox';
import Link from '~/components/Link';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

Categories.propTypes = {
  filter: PropTypes.string.isRequired,
  onSetDefaultSearchFilter: PropTypes.func,
  style: PropTypes.object
};

export default function Categories({
  filter,
  onSetDefaultSearchFilter,
  style
}) {
  const setDefaultSearchFilter = useAppContext(
    (v) => v.requestHelpers.setDefaultSearchFilter
  );
  const onChangeDefaultSearchFilter = useAppContext(
    (v) => v.user.actions.onChangeDefaultSearchFilter
  );
  const { searchFilter: defaultSearchFilter } = useKeyContext((v) => v.myState);
  const {
    search: { color: searchColor, shadow: searchShadowColor }
  } = useKeyContext((v) => v.theme);
  const [changingDefaultFilter, setChangingDefaultFilter] = useState(false);

  return (
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
        {['subjects', 'videos', 'links'].map((contentType) => {
          const exploreLabel =
            SELECTED_LANGUAGE === 'kr' ? (
              <>{localize(contentType.slice(0, -1))} 탐색</>
            ) : (
              <>Explore {contentType}</>
            );
          const alwaysExploreFirstLabel =
            SELECTED_LANGUAGE === 'kr'
              ? `항상 ${localize(contentType.slice(0, -1))} 먼저 탐색하기:`
              : `Always explore ${contentType} first:`;

          return filter === contentType ? (
            <nav
              style={{
                width: '100%',
                textAlign: 'center'
              }}
              key={contentType}
            >
              <p>
                {returnIcon(contentType)}
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
          ) : (
            <nav key={contentType}>
              <Link to={`/${contentType}`}>
                {returnIcon(contentType)}
                {exploreLabel}
              </Link>
            </nav>
          );
        })}
      </div>
    </div>
  );

  function returnIcon(contentType) {
    let icon = '';
    if (contentType === 'subjects') {
      icon = 'bolt';
    }
    if (contentType === 'videos') {
      icon = 'film';
    }
    if (contentType === 'links') {
      icon = 'book';
    }
    return <Icon style={{ marginRight: '1.5rem' }} icon={icon} />;
  }

  async function handleSetDefaultSearchFilter() {
    if (filter === defaultSearchFilter) return;
    onChangeDefaultSearchFilter(filter);
    setChangingDefaultFilter(true);
    await setDefaultSearchFilter(filter);
    setChangingDefaultFilter(false);
    onSetDefaultSearchFilter?.();
  }
}
