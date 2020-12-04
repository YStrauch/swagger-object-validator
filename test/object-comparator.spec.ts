import { Handler } from '../src/handler';
import { deepEqual, hasDuplicates } from '../src/helpers/duplicates';

import * as chai from 'chai';
const expect = chai.expect;

import { join } from 'path';

let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, { partialsDir: dir });

describe('ObjectComparator', () => {
  // Tests adapted from https://stackoverflow.com/a/16788517
  it('should be able to compare two primitives', () => {
    expect(deepEqual(null, null), 'null===null').to.true;
    expect(deepEqual(null, undefined), 'null!==undefined').to.false;
    expect(deepEqual(true, true), 'true===true').to.true;
    expect(deepEqual(false, false), 'false===false').to.true;
    expect(deepEqual(false, true), 'false!==true').to.false;

    expect(deepEqual('hi', 'hi'), 'hi===hi').to.true;
    expect(deepEqual(5, 5), '5===5').to.true;
    expect(deepEqual(5, 10), '5!==10').to.false;
  });

  it('should be able to compare arrays', () => {
    expect(deepEqual([], []), '[]===[]').to.true;
    expect(deepEqual([], null), '[]!==null').to.false;
    expect(deepEqual([], undefined), '[]!==undefined').to.false;
    expect(deepEqual([], 0), '[]!==0').to.false;
    expect(deepEqual([], false), '[]!==false').to.false;
    expect(deepEqual([1, 2], [1, 2]), '[1, 2]===[1, 2])').to.true;
    expect(deepEqual([1, 2], [2, 1]), '[1, 2]!==[2, 1])').to.false;
    expect(deepEqual([1, 2], [1, 2, 3]), '[1, 2]!==[1, 2, 3])').to.false;

    expect(deepEqual([1, 2, undefined], [1, 2]), 'ArrayLength').to.false;
    expect(deepEqual([1, 2, 3], { 0: 1, 1: 2, 2: 3 }), 'ArrayObject').to.false;
  });



  it('should be able to compare two shallow objects', () => {
    expect(deepEqual({}, {}), '{}==={}').to.true;
    expect(deepEqual({}, null), '{}!==null').to.false;
    expect(deepEqual({}, undefined), '{}!==undefined').to.false;
    expect(deepEqual({}, false), '{}!==false').to.false;

    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), '{ a: 1, b: 2 }==={ a: 1, b: 2 }').to.true;
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), '{ a: 1, b: 2 }==={ b: 2, a: 1 }').to.true;
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 }), '{ a: 1, b: 2 }!=={ a: 1, b: 3 }').to.false;

    expect(deepEqual({ 1: { name: 'mhc', age: 28 }, 2: { name: 'arb', age: 26 } }, { 1: { name: 'mhc', age: 28 }, 2: { name: 'arb', age: 26 } }), 'ComplexObject1').to.true;
    expect(deepEqual({ 1: { name: 'mhc', age: 28 }, 2: { name: 'arb', age: 26 } }, { 1: { name: 'mhc', age: 28 }, 2: { name: 'arb', age: 27 } }), 'ComplexObject2').to.false;

  });

  it('should be able to compare two deep objects', () => {
    const a = { a: 'text', b: [0, 1] };
    const b = { a: 'text', b: [0, 1] };
    const c = { a: 'text', b: 0 };
    const d = { a: 'text', b: false };
    const e = { a: 'text', b: [1, 0] };
    const i = {
      a: 'text',
      c: {
        b: [1, 0]
      }
    };
    const j = {
      a: 'text',
      c: {
        b: [1, 0]
      }
    };
    const k = { a: 'text', b: <any> null };
    const l = { a: 'text', b: <any> undefined };

    expect(deepEqual(a, b), 'a===b').to.true;
    expect(deepEqual(a, c), 'a!==c').to.false;
    expect(deepEqual(c, d), 'c!==d').to.false;
    expect(deepEqual(a, e), 'a!==e').to.false;
    expect(deepEqual(i, j), 'i===j').to.true;
    expect(deepEqual(d, k), 'd!==k').to.false;
    expect(deepEqual(k, l), 'k!==l').to.false;
  });

  it('should be able to handle some circular objects', () => {
    const circular: any = {}
    circular['bar'] = {
      circular: circular
    };

    expect(deepEqual(circular, circular), 'circular===circular').to.true;
    expect(deepEqual(circular, {}), 'circular!=={}').to.false;
  });

  it('should throw exceptions for deep circular objects', () => {
    const circular: any = {}
    circular['bar'] = {
      circular: circular
    };
    const circular2: any = {}
    circular2['bar'] = {
      circular: circular2
    };

    expect(() => deepEqual(circular, circular2), 'Circular3').to.throw('Object comparison failed, circular loop detected');
  });

});
