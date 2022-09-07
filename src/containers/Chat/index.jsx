import { Route, Routes } from 'react-router-dom';
import Router from './Router';

export default function Chat() {
  return (
    <Routes>
      <Route path="/:currentPathId/*" element={<Router />} />
      <Route path="/*" element={<Router />} />
    </Routes>
  );
}
