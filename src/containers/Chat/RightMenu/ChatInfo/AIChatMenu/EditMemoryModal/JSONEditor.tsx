import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import Button from './Button';

export default function JSONEditor({
  initialJson,
  onChange,
  onEditNested
}: {
  initialJson: string | null;
  onChange: (newJson: string) => void;
  onEditNested?: (key: string) => void;
}) {
  const [jsonData, setJsonData] = useState(JSON.parse(initialJson || '{}'));

  const handleAddProperty = useCallback(() => {
    const key = prompt('Enter property name:');
    if (key && !Object.prototype.hasOwnProperty.call(jsonData, key)) {
      setJsonData((prev: any) => ({ ...prev, [key]: '' }));
    }
  }, [jsonData]);

  const handleRemoveProperty = useCallback((key: any) => {
    setJsonData((prev: any) => {
      const updatedData = { ...prev };
      delete updatedData[key];
      return updatedData;
    });
  }, []);

  const handleChange = useCallback((key: any, value: any) => {
    setJsonData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  useEffect(() => {
    onChange(JSON.stringify(jsonData, null, 2));
  }, [jsonData, onChange]);

  const renderInput = useCallback(
    (key: any, value: any) => {
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
    },
    [handleChange, onEditNested]
  );

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
