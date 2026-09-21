// Минимальные типы для node:sqlite: установленный @types/node (20.x) их ещё не содержит,
// хотя рантайм — Node 22, где модуль уже есть (экспериментальный).
// Описаны только сигнатуры, которые реально используются в проекте.
declare module 'node:sqlite' {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
