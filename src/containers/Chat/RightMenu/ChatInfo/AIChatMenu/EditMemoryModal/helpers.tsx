export function getValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => {
    if (part.includes('[')) {
      const [arrayKey, indexStr] = part.split(/[[\]]/).filter(Boolean);
      return acc[arrayKey][parseInt(indexStr)];
    } else {
      return acc[part];
    }
  }, obj);
}

export function setValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

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
}
