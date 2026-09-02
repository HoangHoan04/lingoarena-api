export function toSelectBox(
  rows: Array<{ id?: string; name?: string; code?: string; label?: string }>,
) {
  return rows.map(item => ({
    id: item.id,
    label: item.label || item.name,
    value: item.id,
    name: item.name,
    code: item.code,
  }));
}
