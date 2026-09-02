const getKeyEnumByValue = <T = any>(targetEnum: T, valueFind: any) => {
  return Object.keys(targetEnum)[Object.values(targetEnum).indexOf(valueFind)] || '';
};
const deepResolvePromises = async (input: any) => {
  if (input instanceof Promise) {
    return await input;
  }

  if (Array.isArray(input)) {
    const resolvedArray = await Promise.all(input.map(deepResolvePromises));
    return resolvedArray;
  }

  if (input instanceof Date) {
    return input;
  }

  if (typeof input === 'object' && input !== null) {
    const keys = Object.keys(input);
    const resolvedObject = {};

    for (const key of keys) {
      const resolvedValue = await deepResolvePromises(input[key]);
      resolvedObject[key] = resolvedValue;
    }

    return resolvedObject;
  }

  return input;
};

export interface DataCompare {
  keyCompare: string;
  dataCompare: any[];
}
const transformDataUpdate = (
  currentData: DataCompare,
  updateData: DataCompare,
): {
  UPDATE: any[];
  CREATE: any[];
  DELETE: any[];
} => {
  let data = {
    UPDATE: [] as any[],
    CREATE: [] as any[],
    DELETE: [] as any[],
  };
  if (updateData.dataCompare !== null) {
    currentData.dataCompare.forEach(cd => {
      const exists = updateData.dataCompare.find(
        ud => ud[updateData.keyCompare || 'id'] === cd[currentData.keyCompare || 'id'],
      );
      if (!exists) {
        data.DELETE.push(cd);
      }
    });

    updateData.dataCompare.forEach(ud => {
      const exists = currentData.dataCompare.find(
        cd => cd[currentData.keyCompare || 'id'] === ud[updateData.keyCompare || 'id'],
      );
      if (exists) {
        data.UPDATE.push(ud);
      } else {
        data.CREATE.push(ud);
      }
    });
  }

  return data;
};

export { deepResolvePromises, getKeyEnumByValue, transformDataUpdate };
