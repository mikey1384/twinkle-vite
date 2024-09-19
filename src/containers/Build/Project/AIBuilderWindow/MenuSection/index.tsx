import React from 'react';
import { css } from '@emotion/css';
import GitDiffSection from './GitDiffSection';
import SelectedFilesSection from './SelectedFilesSection';
import SaveRunSection from './SaveRunSection';

export default function MenuSection() {
  return (
    <div
      className={css`
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #f8f9fa;
        padding: 16px;
        overflow-x: hidden;
        overflow-y: auto;
      `}
    >
      <GitDiffSection />
      <SelectedFilesSection />
      <SaveRunSection />
    </div>
  );
}
