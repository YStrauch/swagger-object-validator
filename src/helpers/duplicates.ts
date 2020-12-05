// Adapted from https://stackoverflow.com/a/1144249


type IPrimitive = boolean | undefined | null | number | Number | string;
interface IJSON {
  [key: string]: IComparable;
};
type IComparable = IPrimitive | IJSON | Array<IComparable>;

export function deepEqual(x: IComparable, y: IComparable, xParents?: Array<IComparable>, yParents?: Array<IComparable>) {
  if (!xParents || !yParents) {
    xParents = [];
    yParents = [];
  }

  // remember that NaN === NaN returns false
  // and isNaN(undefined) returns true
  if (isNaN(<any>x) && isNaN(<any>y) && typeof x === 'number' && typeof y === 'number') {
    return true;
  }

  // Compare primitives and complex types by reference.
  // Check if both items link to the same object.
  // Especially useful on the step where we compare prototypes
  if (x === y) {
    return true;
  }

  // Primitives need to enforce type
  if (
    (typeof (x) === 'string' || typeof (y) === 'string') ||
    (typeof (x) === 'boolean' || typeof (y) === 'boolean') ||
    (typeof (x) === 'number' || typeof (y) === 'number') ||
    (x === null || y === null) ||
    (x === undefined || y === undefined)
  ) {
    return false; // primitives were already compared with ===, enforcing type
  }

  // Compare Arrays
  if (Array.isArray(x) || Array.isArray(y)) {
    if ((Array.isArray(x) && Array.isArray(y))) {
      if (x.length === y.length) {
        for (let i = 0; i < x.length; i++) {
          if (deepEqual(x[i], y[i], xParents, yParents) === false) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  }

  if (!(x instanceof Object && y instanceof Object)) {
    throw Error('Object comparison failed, ' + typeof (x) + ' is not an allowed type');
  }

  // Check for infinitive linking loops
  if (xParents.indexOf(x) > -1 || yParents.indexOf(y) > -1) {
    throw Error('Object comparison failed, circular loop detected');
  }

  // Quick checking of one object being a subset of another.
  // todo: cache the structure of items[0] for performance
  for (let p in y) {
    if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
      return false;
    }
    if (typeof (<any>y)[p] !== typeof (<any>x)[p]) {
      return false;
    }
  }

  for (let p in x) {
    if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
      return false;
    }
    if (typeof (<any>y)[p] !== typeof (<any>x)[p]) {
      return false;
    }

    switch (typeof ((<any>x)[p])) {
      case 'object':
      case 'function':

        xParents.push(x);
        yParents.push(y);

        if (!deepEqual((<any>x)[p], (<any>y)[p], xParents, yParents)) {
          return false;
        }

        xParents.pop();
        yParents.pop();
        break;

      default:
        if ((<any>x)[p] !== (<any>y)[p]) {
          return false;
        }
        break;
    }
  }

  return true;
}

export function hasDuplicates(items: Array<IComparable>) {
  for (let i1 = 0; i1 < items.length; i1++) {
    let xParents = [] as IComparable[];

    for (let i2 = i1 + 1; i2 < items.length; i2++) {
      let yParents = [] as IComparable[];
      if (deepEqual(items[i1], items[i2], xParents, yParents)) {
        return true;
      }
    }
  }
  return false;
}
