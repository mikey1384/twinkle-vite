import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import CategoryInput from './CategoryInput';
import CategoryModal from './CategoryModal';
import { useRoleColor } from '~/theme/useRoleColor';

export default function GrammarCategories({
  style
}: {
  style?: React.CSSProperties;
}) {
  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const linkColor = useMemo(
    () => linkRole.getColor() || Color.logoBlue(),
    [linkRole]
  );
  const uploadGrammarCategory = useAppContext(
    (v) => v.requestHelpers.uploadGrammarCategory
  );
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryText, setCategoryText] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryObj, setCategoryObj] = useState<Record<string, any>>({});
  const loadGrammarCategories = useAppContext(
    (v) => v.requestHelpers.loadGrammarCategories
  );
  useEffect(() => {
    init();
    async function init() {
      const { categories, categoryObj } = await loadGrammarCategories();
      setCategories(categories);
      setCategoryObj(categoryObj);
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
            border: 1px solid var(--ui-border);
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
                  color: ${linkColor};
                  cursor: pointer;
                  &:hover {
                    text-decoration: underline;
                  }
                }
              `}
            >
              <li onClick={() => setSelectedCategory('uncategorized')}>
                Uncategorized
              </li>
              {categories.map((category, index) => (
                <li
                  onClick={() => setSelectedCategory(category)}
                  key={index}
                  style={{ marginTop: '1rem' }}
                >
                  {category}
                  {categoryObj[category] ? ` (${categoryObj[category]})` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          categories={categories}
          onHide={() => setSelectedCategory('')}
          onEditGrammarCategory={handleEditGrammarCategory}
          onSetCategories={setCategories}
          onMoveQuestion={async () => {
            const { categories, categoryObj } = await loadGrammarCategories();
            setCategories(categories);
            setCategoryObj(categoryObj);
          }}
        />
      )}
    </ErrorBoundary>
  );

  function handleEditGrammarCategory({
    category,
    newCategory: editiedCategory
  }: {
    category: string;
    newCategory: string;
  }) {
    setCategories((categories) => {
      const index = categories.indexOf(category);
      categories.splice(index, 1, editiedCategory);
      return [...categories];
    });
    setCategoryObj((categoryObj) => {
      categoryObj[editiedCategory] = categoryObj[category];
      delete categoryObj[category];
      return { ...categoryObj };
    });
    setSelectedCategory(editiedCategory);
  }

  async function handleCategorySubmit() {
    setUploading(true);
    await uploadGrammarCategory(categoryText);
    setCategories((categories) => [...categories, categoryText]);
    setCategoryText('');
    setUploading(false);
  }
}
