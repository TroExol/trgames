// https://stackoverflow.com/questions/58277973/how-to-type-check-i18n-dictionaries-with-typescript
// type Concat<K extends string, P extends string> =
//     `${K}${'' extends P ? '' : '.'}${P}`;

// export type GetDictValue<T extends string, O> =
//     T extends `${infer A}.${infer B}` ?
//       A extends keyof O ? GetDictValue<B, O[A]> : never
//       : T extends keyof O ? O[T] : never;

// type DeepKeys<T> = T extends object ? {
//   [K in keyof T]-?: `${K & string}` | Concat<K & string, DeepKeys<T[K]>>
// }[keyof T] : '';

// export type DeepLeafKeys<T> = T extends object ?
//     { [K in keyof T]-?: Concat<K & string, DeepKeys<T[K]>> }[keyof T] : '';

// export type Keys<S extends string> = S extends '' ? [] :
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   S extends `${infer _}%{${infer B}}${infer C}` ? [B, ...Keys<C>] : [];

// export type Interpolate<S extends string, I extends Record<Keys<S>[number], string>> =
//     S extends '' ? '' :
//       S extends `${infer A}%{${infer B}}${infer C}` ?
//     `${A}${I[Extract<B, keyof I>]}${Interpolate<C, I>}`
//         : S;

export type DeepKeys<S extends string, T> =
    T extends object
      ? S extends `${infer I1}.${infer I2}`
        ? I1 extends keyof T
        // fix issue allowed last dot
          ? T[I1] extends object
            ? `${I1}.${DeepKeys<I2, T[I1]>}`
            : keyof T & string
          : keyof T & string
        : S extends keyof T
          ? `${S}`
          : keyof T & string
      : '';
