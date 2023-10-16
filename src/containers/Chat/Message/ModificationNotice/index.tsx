import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import Container from './Container';
import { useAppContext } from '~/contexts';

export default function ModificationNotice({
  modificationId,
  username
}: {
  modificationId: number;
  username: string;
}) {
  const loadModificationItem = useAppContext(
    (v) => v.requestHelpers.loadModificationItem
  );
  const [data, setData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    init();
    async function init() {
      const item = await loadModificationItem(modificationId);
      setData({
        action: item.action,
        contentId: item.contentId,
        contentType: item.contentType,
        isRevoked: item.isRevoked
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modificationId]);

  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {data ? <Container data={data} username={username} /> : <Loading />}
    </div>
  );
}
