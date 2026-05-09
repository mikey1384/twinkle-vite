import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';

const Content = lazyWithRetry(() => import('./Content'));

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
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path={'/:contentId'} element={<Content />} />
            <Route path="*" element={<InvalidPage />} />
          </Routes>
        </Suspense>
      </section>
    </div>
  );
}
