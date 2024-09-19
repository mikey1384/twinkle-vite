import React from 'react';
import { css } from '@emotion/css';
import GitDiffSection from './GitDiffSection';
import SelectedFilesSection from './SelectedFilesSection';
import SaveRunSection from './SaveRunSection';

export default function MenuSection() {
  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        flex-direction: column;
        background-color: #f8f9fa;
        padding: 16px;
      `}
    >
      <GitDiffSection />
      <SelectedFilesSection />
      <SaveRunSection />
    </div>
  );
}
