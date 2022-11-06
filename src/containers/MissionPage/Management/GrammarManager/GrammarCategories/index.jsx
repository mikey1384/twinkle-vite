import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

GrammarCategories.propTypes = {
  style: PropTypes.object
};
export default function GrammarCategories({ style }) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  return (
    <ErrorBoundary componentPath="MissionPage/Management/GrammarManager/GrammarCategories">
      <div style={style}>
        <div
          className={css`
            width: 100%;
            display: flex;
            font-size: 2rem;
            flex-direction: column;
            background: #fff;
            padding: 1rem 1rem 1.5rem 1rem;
            border: 1px solid ${Color.borderGray()};
            border-radius: ${borderRadius};
            @media (max-width: ${mobileMaxWidth}) {
              border-radius: 0;
              border-left: 0;
              border-right: 0;
            }
          `}
        >
          <p
            className={css`
              color: ${Color[linkColor]()};
              cursor: pointer;
              &:hover {
                text-decoration: underline;
              }
            `}
          >
            Uncategorized
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}
