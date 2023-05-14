import React from 'react';

export default function UserComponent({ src }: { src: string }) {
  return (
    <div>
      <div>this is a user profile! {src}</div>
    </div>
  );
}
