/**
 * Browser-compatible pg-promise shim
 */
export default function () {
  console.warn('pg-promise is not available in browser environment');
  return {
    query: () => Promise.resolve({ rows: [] }),
    none: () => Promise.resolve(),
    one: () => Promise.resolve({}),
    oneOrNone: () => Promise.resolve(null),
    many: () => Promise.resolve([]),
    manyOrNone: () => Promise.resolve([]),
  };
}
