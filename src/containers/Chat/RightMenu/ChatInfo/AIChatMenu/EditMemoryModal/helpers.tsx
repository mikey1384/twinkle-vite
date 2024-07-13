export function getValue(obj: any, path: string): any {
  if (obj === undefined) return undefined;
  return path.split('.').reduce((acc, part) => {
    if (acc === undefined) return undefined;
    if (part.includes('[')) {
      const [arrayKey, indexStr] = part.split(/[[\]]/).filter(Boolean);
      return acc[arrayKey]?.[parseInt(indexStr, 10)];
    } else {
      return acc[part];
    }
  }, obj);
}

export function setValue(obj: any, path: string, value: any): any {
  if (obj === undefined) {
    obj = {};
  }
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key.includes('[')) {
      const [arrayKey, indexStr] = key.split(/[[\]]/).filter(Boolean);
      const index = parseInt(indexStr, 10);
      if (!current[arrayKey]) current[arrayKey] = [];
      if (!current[arrayKey][index]) current[arrayKey][index] = {};
      current = current[arrayKey][index];
    } else {
      if (!(key in current)) current[key] = {};
      current = current[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey.includes('[')) {
    const [arrayKey, indexStr] = lastKey.split(/[[\]]/).filter(Boolean);
    const index = parseInt(indexStr, 10);
    if (!current[arrayKey]) current[arrayKey] = [];
    current[arrayKey][index] = value;
  } else {
    current[lastKey] = value;
  }

  return obj;
}
