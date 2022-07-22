import React from 'react';
import Content from './Content';
import { Routes, Route } from 'react-router-dom';
import InvalidPage from '~/components/InvalidPage';

export default function ResetPassword() {
  return (
    <Routes>
      <Route path="password/:token" element={<Content />} />
      <Route path="*" element={<InvalidPage />} />
    </Routes>
  );
}
