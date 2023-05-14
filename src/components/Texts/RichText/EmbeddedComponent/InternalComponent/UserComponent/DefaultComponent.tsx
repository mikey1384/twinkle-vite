import React from 'react';

export default function DefaultComponent({
  src,
  profileId
}: {
  src: string;
  profileId: number;
}) {
  return (
    <div>
      <div>default page</div>
      <div>
        {src} {profileId}
      </div>
    </div>
  );
}
