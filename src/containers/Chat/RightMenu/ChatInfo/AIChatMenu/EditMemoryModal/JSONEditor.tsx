// components/JSONEditor.tsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import Button from './Button';

export default function JSONEditor({
  json,
  onChange
}: {
  json: string;
  onChange: (newJson: string) => void;
}) {
  const [jsonData, setJsonData] = useState(JSON.parse(json));

  function handleAddProperty() {
    const key = prompt('Enter property name:');
    if (key && !Object.prototype.hasOwnProperty.call(jsonData, key)) {
      setJsonData((prev: object) => ({ ...prev, [key]: '' }));
    }
  }

  function handleRemoveProperty(key: string) {
    const updatedData = { ...jsonData };
    delete updatedData[key];
    setJsonData(updatedData);
  }

  function handleChange(key: string, value: string) {
    setJsonData((prev: { [key: string]: string }) => ({
      ...prev,
      [key]: value
    }));
  }

  useEffect(() => {
    onChange(JSON.stringify(jsonData, null, 2));
  }, [jsonData, onChange]);

  function renderInput(key: string, value: unknown) {
    if (typeof value === 'object') {
      return (
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => handleChange(key, JSON.parse(e.target.value))}
          style={{ width: '60%', height: '4rem' }}
        />
      );
    }
    return (
      <input
        value={String(value)}
        onChange={(e) => handleChange(key, e.target.value)}
        style={{ width: '60%' }}
      />
    );
  }

  return (
    <div>
      {Object.entries(jsonData).map(([key, value]) => (
        <div
          key={key}
          className={css`
            margin-bottom: 0.5rem;
          `}
        >
          <input
            className={css`
              margin-right: 0.5rem;
            `}
            value={key}
            readOnly
            style={{ width: '30%' }}
          />
          {renderInput(key, value)}
          <Button
            transparent
            onClick={() => handleRemoveProperty(key)}
            style={{ marginLeft: '0.5rem' }}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button onClick={handleAddProperty}>Add Property</Button>
    </div>
  );
}
