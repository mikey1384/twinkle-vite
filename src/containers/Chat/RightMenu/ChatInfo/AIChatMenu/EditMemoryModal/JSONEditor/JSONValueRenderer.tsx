import React, { useState, useEffect } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

interface JSONValueRendererProps {
  path: string;
  value: any;
  onEditNested?: (path: string) => void;
  onChange: (path: string, value: any) => void;
  onDelete: (path: string) => void;
}

export default function JSONValueRenderer({
  path,
  value,
  onEditNested,
  onChange,
  onDelete
}: JSONValueRendererProps): JSX.Element {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(path);
  };

  if (Array.isArray(value)) {
    return (
      <div style={{ margin: 0, padding: 0 }}>
        {value.map((item, index) => (
          <div style={{ marginBottom: '1rem' }} key={index}>
            <JSONValueRenderer
              path={`${path}[${index}]`}
              value={item}
              onEditNested={onEditNested}
              onChange={onChange}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div style={{ display: 'flex' }}>
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
        <Button
          style={{ marginLeft: '0.5rem' }}
          color="redOrange"
          transparent
          onClick={handleDeleteClick}
        >
          <Icon icon="times" />
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <input
        value={inputValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setInputValue(e.target.value);
        }}
        onBlur={() => onChange(path, inputValue)}
      />
      <Button
        style={{ marginLeft: '0.5rem' }}
        color="redOrange"
        transparent
        onClick={handleDeleteClick}
      >
        <Icon icon="times" />
      </Button>
    </div>
  );
}
