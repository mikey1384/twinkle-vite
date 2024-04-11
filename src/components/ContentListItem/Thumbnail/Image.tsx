import React, { useState } from 'react';

export default function Image({
  src,
  fileName
}: {
  src: string;
  fileName: string;
}) {
  const [imageWorks, setImageWorks] = useState(true);
  return imageWorks ? (
    <div>
      <img
        loading="lazy"
        src={src}
        rel={fileName}
        onError={() => setImageWorks(false)}
      />
    </div>
  ) : null;
}
