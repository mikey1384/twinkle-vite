import React, { useState, useEffect } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

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
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  if (Array.isArray(value)) {
    return (
      <ol style={{ margin: 0, padding: 0 }}>
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
        filled
        color="logoBlue"
        style={{ padding: '0.5rem 1rem' }}
        onClick={() => {
          onEditNested?.(path);
        }}
      >
        <Icon icon="pencil" />
        <span style={{ marginLeft: '0.7rem' }}>Edit</span>
      </Button>
    );
  }

  return (
    <input
      value={inputValue}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
      }}
      onBlur={() => handleChange(path, inputValue)}
    />
  );
}
