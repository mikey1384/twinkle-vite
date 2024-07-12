import React, { useState, useEffect } from 'react';
import JSONValueRenderer from './JSONValueRenderer';
import { setValue } from '../helpers';

interface JSONValue {
  [key: string]: any;
}

function deCamelCaseAndTitleify(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function JSONEditor({
  initialJson,
  onChange,
  onEditNested
}: {
  initialJson: string;
  onChange: (json: string) => void;
  onEditNested?: (path: string) => void;
}): JSX.Element {
  const [jsonData, setJsonData] = useState<JSONValue>(() => {
    try {
      return JSON.parse(initialJson || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(jsonData, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(path: string, value: any) {
    setJsonData((prevData) => {
      const newData = { ...prevData };
      setValue(newData, path, value);
      return newData;
    });
  }

  return (
    <div
      style={{
        minWidth: '70%',
        display: 'flex',
        gap: '1rem',
        flexDirection: 'column'
      }}
    >
      {Object.entries(jsonData).map(([key, value]) => (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
          key={key}
        >
          <span>{deCamelCaseAndTitleify(key)}:</span>
          <div>
            <JSONValueRenderer
              path={key}
              value={value}
              onEditNested={onEditNested}
              handleChange={handleChange}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
