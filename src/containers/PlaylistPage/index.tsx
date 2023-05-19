import React from 'react';
import { Route, Routes } from 'react-router-dom';
import InvalidPage from '~/components/InvalidPage';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Content from './Content';

export default function PlaylistPage() {
  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        justify-content: center;
        margin-top: 1rem;
        margin-bottom: 1rem;
        padding-bottom: 20rem;
        @media (max-width: ${mobileMaxWidth}) {
          margin-top: 0;
        }
      `}
    >
      <section
        className={css`
          width: 65%;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
            min-height: 100vh;
          }
        `}
      >
        <Routes>
          <Route path={'/:contentId'} element={<Content />} />
          <Route path="*" element={<InvalidPage />} />
        </Routes>
      </section>
    </div>
  );
}
