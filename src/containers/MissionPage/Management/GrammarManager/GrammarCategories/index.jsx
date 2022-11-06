import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import CategoryInput from './CategoryInput';
import CategoryModal from './CategoryModal';

GrammarCategories.propTypes = {
  style: PropTypes.object
};
export default function GrammarCategories({ style }) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const uploadGrammarCategory = useAppContext(
    (v) => v.requestHelpers.uploadGrammarCategory
  );
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryText, setCategoryText] = useState('');
  const [categories, setCategories] = useState([]);
  const loadGrammarCategories = useAppContext(
    (v) => v.requestHelpers.loadGrammarCategories
  );
  useEffect(() => {
    init();
    async function init() {
      const categories = await loadGrammarCategories();
      setCategories(categories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ErrorBoundary componentPath="MissionPage/Management/GrammarManager/GrammarCategories">
      <div style={style}>
        <div
          className={css`
            font-size: 1.5rem;
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
              width: 60%;
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
          >
            <CategoryInput
              onChange={(text) => setCategoryText(text)}
              categoryText={categoryText}
              onSubmit={handleCategorySubmit}
              uploading={uploading}
            />
          </div>
          <div
            style={{
              marginTop: '3rem',
              width: 'auto',
              display: 'inline-block'
            }}
          >
            <ul
              className={css`
                > li {
                  text-transform: capitalize;
                  font-size: 1.7rem;
                  color: ${Color[linkColor]()};
                  cursor: pointer;
                  &:hover {
                    text-decoration: underline;
                  }
                }
              `}
            >
              <li>Uncategorized</li>
              {categories.map((category, index) => (
                <li
                  onClick={() => setSelectedCategory(category)}
                  key={index}
                  style={{ marginTop: '1rem' }}
                >
                  {category}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          onHide={() => setSelectedCategory('')}
        />
      )}
    </ErrorBoundary>
  );

  async function handleCategorySubmit() {
    setUploading(true);
    await uploadGrammarCategory(categoryText);
    setCategories((categories) => [...categories, categoryText]);
    setCategoryText('');
    setUploading(false);
  }
}
