import type { Logger } from '@snowplow/tracker-core';

import type { TrackerId } from './types';

export enum LogLevel {
  DEBUG = 'debug',
  ERROR = 'error',
  INFO = 'info',
  WARN = 'warn',
}

let name: string;
let LOG: Logger;

export const logger = <L extends keyof Omit<Logger, 'setLogLevel'>>(
  level: L,
  trackerId: TrackerId,
  ...args: Parameters<Logger[L]>
) => {
  if (!name || !LOG) return;

  const prefix = `[${name}:${trackerId}] `;
  if (typeof args[0] === 'string') {
    const msg = prefix + args.unshift();
    LOG[level](msg, ...args);
  } else {
    LOG[level](prefix, ...args);
  }
};

export const setLogger = (plugin: string, log: Logger) => {
  name = plugin;
  LOG = log;
};
