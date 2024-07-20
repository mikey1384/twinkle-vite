import React, { useCallback, useState, useEffect } from 'react';
import JSONValueRenderer from './JSONValueRenderer';
import { setValue, deleteValue } from '../helpers';

interface JSONValue {
  [key: string]: any;
}

export default function JSONEditor({
  initialJson,
  onChange,
  onTextEdit,
  onEditNested
}: {
  initialJson: string;
  onChange: (json: string) => void;
  onTextEdit?: (path: string, value: any) => void;
  onEditNested?: (path: string) => void;
}): JSX.Element {
  const [jsonData, setJsonData] = useState<JSONValue>(() => {
    try {
      return JSON.parse(initialJson);
    } catch {
      return {};
    }
  });
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    try {
      setJsonData(JSON.parse(initialJson));
    } catch {
      setJsonData({});
    }
  }, [initialJson]);

  useEffect(() => {
    if (deletePath !== null && !isDeleting) {
      setIsDeleting(true);
      setJsonData((prevData) => {
        const updatedJson = deleteValue({ ...prevData }, deletePath);
        return updatedJson;
      });
      setDeletePath(null);
    }
  }, [deletePath, isDeleting]);

  useEffect(() => {
    if (isDeleting) {
      const timer = setTimeout(() => {
        onChange(JSON.stringify(jsonData, null, 2));
        setIsDeleting(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isDeleting, jsonData, onChange]);

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

  const handleDelete = useCallback((path: string) => {
    setDeletePath(path);
  }, []);

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
          <JSONValueRenderer
            path={key}
            value={value}
            onEditNested={onEditNested}
            onChange={handleChange}
            onDelete={handleDelete}
            onTextEdit={onTextEdit}
          />
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
