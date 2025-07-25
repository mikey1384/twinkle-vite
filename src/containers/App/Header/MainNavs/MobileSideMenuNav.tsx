import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';

export default function MobileSideMenuNav({
  alert,
  onClick
}: {
  alert: boolean;
  onClick: () => void;
}) {
  const alertColor = useKeyContext((v) => v.theme.alert.color);
  const highlightColor = useMemo(
    () => (alert ? Color[alertColor]() : Color.darkGray()),
    [alert, alertColor]
  );

  return (
    <div
      onClick={onClick}
      className={`mobile ${css`
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        .chat {
          color: ${Color.lightGray()};
        }
        nav {
          text-decoration: none;
          font-weight: bold;
          color: ${Color.lightGray()};
          align-items: center;
          line-height: 1;
        }
        > nav.active {
          color: ${highlightColor}!important;
          > svg {
            color: ${highlightColor}!important;
          }
        }
        @media (min-width: ${desktopMinWidth}) {
          &:hover {
            > nav {
              > svg {
                color: ${highlightColor};
              }
              color: ${highlightColor};
            }
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          justify-content: center;
          font-size: 3rem;
          nav {
            .nav-label {
              display: none;
            }
          }
          > nav.active {
            > svg {
              color: ${highlightColor};
            }
          }
        }
      `}`}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          ...(alert ? { color: Color[alertColor]() } : {})
        }}
      >
        <Icon icon="bars" />
      </nav>
    </div>
  );
}
