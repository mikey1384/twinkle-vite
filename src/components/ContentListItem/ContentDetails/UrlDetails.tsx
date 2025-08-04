import React from 'react';
import Embedly from '~/components/Embedly';

export default function UrlDetails({
  contentId,
  title,
  thumbUrl,
  actualTitle,
  actualDescription,
  siteUrl
}: {
  contentId: number;
  title: string;
  thumbUrl: string;
  actualTitle: string;
  actualDescription: string;
  siteUrl: string;
}) {
  return (
    <>
      <div
        className="title"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <p>{title}</p>
      </div>
      <div className="description" style={{ height: '100%' }}>
        <Embedly
          small
          noLink
          contentId={contentId}
          defaultThumbUrl={thumbUrl}
          defaultActualTitle={actualTitle}
          defaultActualDescription={actualDescription}
          defaultSiteUrl={siteUrl}
        />
      </div>
    </>
  );
}
