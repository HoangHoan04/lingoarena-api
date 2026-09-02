export const isUuid = (val: string): boolean => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(val);
};

export function isValidCodeField(str) {
  const regex = /^[a-zA-Z0-9_]{1,30}$/;
  return regex.test(str);
}
