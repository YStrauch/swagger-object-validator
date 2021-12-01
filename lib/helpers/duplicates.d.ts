declare type IPrimitive = boolean | undefined | null | number | Number | string;
interface IJSON {
    [key: string]: IComparable;
}
declare type IComparable = IPrimitive | IJSON | Array<IComparable>;
export declare function deepEqual(x: IComparable, y: IComparable, xParents?: Array<IComparable>, yParents?: Array<IComparable>): boolean;
export declare function hasDuplicates(items: Array<IComparable>): boolean;
export {};
