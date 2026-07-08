import type { Logger } from 'pino';

export type LoggerFields = Record<string, unknown>;

export interface ApplicationLogger {
  fatal: (fields: LoggerFields, message: string) => void;
  error: (fields: LoggerFields, message: string) => void;
  warn: (fields: LoggerFields, message: string) => void;
  info: (fields: LoggerFields, message: string) => void;
  debug: (fields: LoggerFields, message: string) => void;
  trace: (fields: LoggerFields, message: string) => void;
}

export type PinoApplicationLogger = Logger;
