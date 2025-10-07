import path from 'path';
import fs from 'fs';

import { ELogLevel, type TLoggerConstructorParams } from './types';

export class Logger {
  private readonly prefix?: string;
  private readonly roomUuid?: string;
  private readonly gameName?: string;
  private readonly filename: string;
  private readonly ext = '.log';

  constructor({ roomUuid, gameName, prefix, filename }: TLoggerConstructorParams = {}) {
    this.prefix = prefix;
    this.roomUuid = roomUuid;
    this.gameName = gameName;
    this.filename = filename ?? 'all';
  }

  private readonly log = (level: ELogLevel, message: string) => {
    try {
      let formattedMessage = `[${level}] [UTC ${new Date().toLocaleString('ru', { timeZone: 'UTC' })}] `;
      if (this.gameName) {
        formattedMessage += `[Игра: ${this.gameName}] `;
      }
      if (this.roomUuid) {
        formattedMessage += `[Комната: ${this.roomUuid}] `;
      }
      if (this.prefix) {
        formattedMessage += `[${this.prefix}] `;
      }
      formattedMessage += message;

      let dirPath = __dirname;
      if (this.gameName) {
        dirPath = path.resolve(dirPath, this.gameName);
      }
      if (this.roomUuid) {
        dirPath = path.resolve(dirPath, this.roomUuid);
      }

      fs.mkdirSync(dirPath, { recursive: true });
      void fs.promises.appendFile(path.resolve(dirPath, this.filename + this.ext), formattedMessage + '\n', 'utf8')
        .catch(error => console.log('Не удалось записать логи комнаты', error));
      void fs.promises.appendFile(path.resolve(__dirname, this.filename + this.ext), formattedMessage + '\n', 'utf8')
        .catch(error => console.log('Не удалось записать логи комнаты', error));
    } catch (error) {
      console.error('Ошибка записи в лог:', error);
    }
  };

  public info = (message: string): void => {
    this.log(ELogLevel.INFO, message);
  };

  public error = (message: string): void => {
    this.log(ELogLevel.ERROR, message);
  };

  public debug = (message: string): void => {
    this.log(ELogLevel.DEBUG, message);
  };

  public warn = (message: string): void => {
    this.log(ELogLevel.WARN, message);
  };
}
