import React from 'react';

export default function InterfaceComponent({ src }: { src: string }) {
  return (
    <div>
      <div>internal component {src}</div>
    </div>
  );
}
