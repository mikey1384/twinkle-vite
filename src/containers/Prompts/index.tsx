import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { promptListTabRoutes } from './helpers/url';

const PromptList = lazyWithRetry(() => import('./PromptList'));

export default function Prompts() {
  return (
    <ErrorBoundary componentPath="Prompts">
      <div
        className={css`
          height: 100%;
          min-height: 0;
        `}
      >
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<PromptList />} />
            {promptListTabRoutes.map(({ path, tab, browseMode }) => (
              <Route
                key={path}
                path={path}
                element={<PromptList tab={tab} browseMode={browseMode} />}
              />
            ))}
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
