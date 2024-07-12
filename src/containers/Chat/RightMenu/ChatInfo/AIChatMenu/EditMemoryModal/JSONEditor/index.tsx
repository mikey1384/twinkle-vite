import React, { useState, useEffect } from 'react';
import JSONValueRenderer from './JSONValueRenderer';

interface JSONValue {
  [key: string]: any;
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
      const keys = path.split('.');
      let current = newData;

      keys.slice(0, -1).forEach((key) => {
        if (key.includes('[')) {
          const [arrayKey, indexStr] = key.split(/[[\]]/).filter(Boolean);
          current = current[arrayKey][parseInt(indexStr)];
        } else {
          current = current[key];
        }
      });

      const lastKey = keys[keys.length - 1];
      if (lastKey.includes('[')) {
        const [arrayKey, indexStr] = lastKey.split(/[[\]]/).filter(Boolean);
        current[arrayKey][parseInt(indexStr)] = value;
      } else {
        current[lastKey] = value;
      }

      return newData;
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%'
      }}
    >
      {Object.entries(jsonData).map(([key, value]) => (
        <div key={key}>
          <span>{key}:</span>
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
