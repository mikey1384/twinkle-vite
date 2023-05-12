import React from 'react';

export default function MediaComponent({
  src,
  alt,
  onLoad,
  ...commonProps
}: {
  src: string;
  alt: string;
  onLoad: () => void;
}) {
  return <img {...commonProps} src={src} alt={alt} onLoad={onLoad} />;
}
