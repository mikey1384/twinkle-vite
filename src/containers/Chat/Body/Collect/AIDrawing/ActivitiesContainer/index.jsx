import { useEffect } from 'react';

export default function ActivitiesContainer() {
  useEffect(() => {}, []);
  return (
    <div
      style={{
        zIndex: 5,
        width: '100%',
        height: 'CALC(100% - 6.5rem)'
      }}
    >
      Images go here!!
    </div>
  );
}
