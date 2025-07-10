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

/**
 * Wrap the passed logger so that it's clear which plugin/tracker instance log messages refer to
 * @param level Log level for the logged message
 * @param trackerId Tracker ID logging the event
 * @param args Log message and other arguments
 */
export const logger = <L extends keyof Omit<Logger, 'setLogLevel'>>(
  level: L,
  trackerId: TrackerId,
  ...args: Parameters<Logger[L]>
): void => {
  if (!name || !LOG) return;

  const prefix = `[${name}:${trackerId}] `;
  if (typeof args[0] === 'string') {
    const msg = prefix + args.shift();
    LOG[level](msg, ...args);
  } else {
    LOG[level](prefix, ...args);
  }
};

export const setLogger = (plugin: string, log: Logger): void => {
  name = plugin;
  LOG = log;
};
