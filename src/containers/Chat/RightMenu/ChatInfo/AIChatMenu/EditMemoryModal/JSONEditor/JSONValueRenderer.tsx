import React from 'react';
import Button from '../Button';

interface JSONValueRendererProps {
  path: string;
  value: any;
  onEditNested?: (path: string) => void;
  handleChange: (path: string, value: any) => void;
}

export default function JSONValueRenderer({
  path,
  value,
  onEditNested,
  handleChange
}: JSONValueRendererProps): JSX.Element {
  if (Array.isArray(value)) {
    return (
      <ol>
        {value.map((item, index) => (
          <li key={index}>
            <JSONValueRenderer
              path={`${path}[${index}]`}
              value={item}
              onEditNested={onEditNested}
              handleChange={handleChange}
            />
          </li>
        ))}
      </ol>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <Button
        onClick={() => {
          onEditNested?.(path);
        }}
      >
        Edit Object
      </Button>
    );
  }

  return (
    <input
      value={String(value)}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        handleChange(path, e.target.value)
      }
    />
  );
}
