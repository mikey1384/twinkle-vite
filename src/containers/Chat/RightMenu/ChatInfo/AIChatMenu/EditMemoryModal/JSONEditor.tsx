import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import Button from './Button';

interface JSONData {
  [key: string]: any;
}

export default function JSONEditor({
  initialJson,
  onChange,
  onEditNested
}: {
  initialJson: string | null;
  onChange: (newJson: string) => void;
  onEditNested?: (key: string) => void;
}) {
  const [jsonData, setJsonData] = useState<JSONData>(
    JSON.parse(initialJson || '{}')
  );

  useEffect(() => {
    onChange(JSON.stringify(jsonData, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {Object.entries(jsonData).map(([key, value]) => (
        <div
          key={key}
          className={css`
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
          `}
        >
          <span
            className={css`
              margin-right: 0.5rem;
              width: 30%;
            `}
          >
            {toProperCase(key)}
          </span>
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

  function handleAddProperty(): void {
    const key = prompt('Enter property name:');
    if (key && !Object.prototype.hasOwnProperty.call(jsonData, key)) {
      setJsonData((prev) => ({ ...prev, [key]: '' }));
    }
  }

  function handleRemoveProperty(key: string): void {
    setJsonData((prev) => {
      const updatedData = { ...prev };
      delete updatedData[key];
      return updatedData;
    });
  }

  function handleChange(key: string, value: string): void {
    setJsonData((prev) => ({
      ...prev,
      [key]: value
    }));
    onChange(JSON.stringify({ ...jsonData, [key]: value }, null, 2));
  }

  function renderInput(key: string, value: any): JSX.Element {
    if (Array.isArray(value)) {
      return (
        <ol>
          {value.map((item, index) => (
            <li key={index}>{renderInput(`${key}[${index}]`, item)}</li>
          ))}
        </ol>
      );
    }
    if (typeof value === 'object' && value !== null) {
      return <Button onClick={() => onEditNested?.(key)}>Edit Object</Button>;
    }
    return (
      <input
        value={String(value)}
        onChange={(e) => handleChange(key, e.target.value)}
        style={{ width: '60%' }}
      />
    );
  }

  function toProperCase(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase());
  }
}
