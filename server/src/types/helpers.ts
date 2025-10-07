export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Primitive = string | number | boolean | undefined | null | symbol | bigint;

export type NonVoidFunction<T> = T extends (...args: unknown[]) => infer R ? (R extends void ? never : T) : never;

export type NonVoidReturnType<T> = T extends () => infer R ? (R extends void ? never : R) : never;
