import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InvalidPage from '~/components/InvalidPage';
import Email from './Email';

export default function Verify() {
  return (
    <Routes>
      <Route path="email/:token" element={<Email />} />
      <Route path="*" element={<InvalidPage />} />
    </Routes>
  );
}
