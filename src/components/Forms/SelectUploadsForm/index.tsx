import React from 'react';
import Selectable from './Selectable';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';

export default function SelectUploadsForm({
  contentObjs,
  contentType = 'video',
  loaded = true,
  loading,
  loadingMore,
  loadMoreUploads = () => null,
  loadMoreButton,
  onSelect,
  onDeselect,
  selectedUploads,
  uploads
}: {
  contentObjs: any;
  contentType?: string;
  loaded?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  loadMoreUploads?: () => void;
  loadMoreButton?: boolean;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  selectedUploads: any[];
  uploads: any[];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        width: '100%'
      }}
    >
      {loading || !loaded ? (
        <Loading />
      ) : uploads.length === 0 ? (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '2.5rem',
            padding: '3rem'
          }}
        >
          No Results
        </div>
      ) : (
        uploads.map((uploadId) => {
          return (
            <Selectable
              key={uploadId}
              item={contentObjs[uploadId]}
              selected={selectedUploads.includes(uploadId)}
              onSelect={onSelect}
              onDeselect={onDeselect}
              contentType={contentType}
            />
          );
        })
      )}
      {loadMoreButton && !loading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          <LoadMoreButton
            style={{ fontSize: '2rem', marginTop: '1rem' }}
            transparent
            loading={loadingMore}
            onClick={loadMoreUploads}
          />
        </div>
      )}
    </div>
  );
}
