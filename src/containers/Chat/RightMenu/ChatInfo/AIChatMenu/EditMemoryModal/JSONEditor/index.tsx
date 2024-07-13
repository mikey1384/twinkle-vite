import React, { useCallback, useState, useEffect } from 'react';
import JSONValueRenderer from './JSONValueRenderer';
import { setValue } from '../helpers';

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
  const [jsonData, setJsonData] = useState<JSONValue>(() =>
    JSON.parse(initialJson)
  );

  useEffect(() => {
    setJsonData(JSON.parse(initialJson));
  }, [initialJson]);

  const handleChange = useCallback(
    (path: string, value: any) => {
      setJsonData((prevData) => {
        const updatedJson = setValue({ ...prevData }, path, value);
        onChange(JSON.stringify(updatedJson, null, 2));
        return updatedJson;
      });
    },
    [onChange]
  );

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

function deCamelCaseAndTitleify(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
