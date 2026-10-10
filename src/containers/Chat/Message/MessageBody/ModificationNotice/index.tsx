import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import Container from './Container';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';

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
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      try {
        const item = await loadModificationItem(modificationId);
        setData({
          action: item.action,
          contentId: item.contentId,
          contentType: item.contentType,
          isRevoked: item.isRevoked
        });
      } catch (error) {
        // The record is not visible to this viewer (or is gone): render
        // nothing rather than an endless spinner.
        console.error(error);
        setUnavailable(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modificationId]);

  useEffect(() => {
    socket.on('content_modification_revoked', handleContentModificationRevoked);

    function handleContentModificationRevoked({
      contentType,
      contentId
    }: {
      contentType: string;
      contentId: number;
    }) {
      if (contentType === data?.contentType && contentId === data?.contentId) {
        setData((data) => ({ ...data, isRevoked: true }));
      }
    }

    return function cleanUp() {
      socket.off(
        'content_modification_revoked',
        handleContentModificationRevoked
      );
    };
  });

  if (unavailable) return null;

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
