export const stringToBoolean = (value: string | boolean) => {
  try {
    return Boolean(JSON.parse(`${value}`));
  } catch (error) {
    console.error(`Error parsing value to boolean: ${value}`, error);
    return false;
  }
};
