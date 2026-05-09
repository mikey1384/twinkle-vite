import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';

const Email = lazyWithRetry(() => import('./Email'));

export default function Verify() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="email/:token" element={<Email />} />
        <Route path="*" element={<InvalidPage />} />
      </Routes>
    </Suspense>
  );
}
