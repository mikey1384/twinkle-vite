import { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import Input from '~/components/Texts/Input';
import { useKeyContext } from '~/contexts';

GrammarCategories.propTypes = {
  style: PropTypes.object
};
export default function GrammarCategories({ style }) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const [categoryText, setCategoryText] = useState('');
  return (
    <ErrorBoundary componentPath="MissionPage/Management/GrammarManager/GrammarCategories">
      <div style={style}>
        <div
          className={css`
            width: 100%;
            display: flex;
            font-size: 1.5rem;
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
          <b>Add a category</b>
          <div
            className={css`
              margin-top: 0.5rem;
              width: 50%;
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
          >
            <Input
              onChange={(text) => setCategoryText(text)}
              placeholder="Enter category..."
              value={categoryText}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginTop: '2rem' }}>
            <ul>
              <li
                className={css`
                  font-size: 1.7rem;
                  color: ${Color[linkColor]()};
                  cursor: pointer;
                  &:hover {
                    text-decoration: underline;
                  }
                `}
              >
                Uncategorized
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
