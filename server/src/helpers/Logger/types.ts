export interface TLoggerConstructorParams {
  gameName?: string;
  roomUuid?: string;
  prefix?: string;
  filename?: string;
}

export enum ELogLevel {
  DEBUG = 'DEBUG',
  ERROR = 'ERROR',
  INFO = 'INFO',
  WARN = 'WARN',
}
