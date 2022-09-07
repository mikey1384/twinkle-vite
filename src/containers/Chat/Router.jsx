import { Route, Routes, useParams } from 'react-router-dom';
import Main from './Main';

export default function Router() {
  const { currentPathId } = useParams();
  return (
    <Routes>
      <Route
        path="/:subchannelPath"
        element={<Main currentPathId={currentPathId} />}
      />
      <Route path="/*" element={<Main currentPathId={currentPathId} />} />
    </Routes>
  );
}
