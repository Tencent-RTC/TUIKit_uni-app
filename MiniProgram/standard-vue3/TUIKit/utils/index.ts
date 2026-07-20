
export function removeC2C(str: string): string {
  return str.replace(/C2C/g, '');
}

export function isJSON(str: string) {
  if (typeof str === 'string') {
    try {
      const data = JSON.parse(str);
      if (data) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  return false;
}

export function JSONToObject(str: string) {
  if (!str || !isJSON(str)) {
    return str;
  }
  return JSON.parse(str);
};

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return [
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

export function deepCopy(data: any, hash = new WeakMap()) {
  if (typeof data !== 'object' || data === null || data === undefined) {
    return data;
  }
  if (hash.has(data)) {
    return hash.get(data);
  }
  const newData: any = Object.create(Object.getPrototypeOf(data));
  const dataKeys = Object.keys(data);
  dataKeys.forEach((value) => {
    const currentDataValue = data[value];
    if (typeof currentDataValue !== 'object' || currentDataValue === null) {
      newData[value] = currentDataValue;
    } else if (Array.isArray(currentDataValue)) {
      newData[value] = [...currentDataValue];
    } else if (currentDataValue instanceof Set) {
      newData[value] = new Set([...currentDataValue]);
    } else if (currentDataValue instanceof Map) {
      newData[value] = new Map([...currentDataValue]);
    } else {
      hash.set(data, data);
      newData[value] = deepCopy(currentDataValue, hash);
    }
  });
  return newData;
}

export function shallowCopyMessage(message) {
  return Object.assign({}, message);
}
