import { logger, LogLevel } from '../logger';
import { ActionHandler } from '../types';

export const log: ActionHandler = function (tracker, action) {
  logger(LogLevel.INFO, tracker.id, '[log] Handling action: ', action);
};
