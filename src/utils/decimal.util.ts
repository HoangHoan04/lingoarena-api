export const transformer = {
  to(value: any) {
    return value;
  },
  from(value: any) {
    return +value || 0;
  },
};
