export function getTypeName(test: any) {
  if (test === null) {
    return 'null';
  }

  if (Array.isArray(test)) {
    return 'array';
  }

  return typeof (test);
}
