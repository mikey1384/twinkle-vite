import React from 'react';

export default function ButtonContainer({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="label">{label}</div>
      <div style={{ marginTop: '0.5rem' }}>{children}</div>
    </div>
  );
}
