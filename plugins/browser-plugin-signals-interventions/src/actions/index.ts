import type { BrowserTracker } from '@snowplow/browser-tracker-core';

import type {
  ActionId,
  ActionHandler,
  ActionRegistration,
  BuiltInActionConfiguration,
  SignalsHandlerConfiguration,
} from '../types';
import { logger, LogLevel } from '../logger';

import { domEvent } from './domEvent';
import { log } from './log';
import { snowplowEvent } from './snowplowEvent';

const ACTIONS: Record<keyof NonNullable<SignalsHandlerConfiguration['builtInActions']>, ActionHandler> = {
  domEvent,
  log,
  snowplowEvent,
};

export const setupBuiltInActions = (
  config: Partial<BuiltInActionConfiguration>,
  tracker: BrowserTracker
): Record<ActionId, ActionRegistration> => {
  const actions: Record<ActionId, ActionRegistration> = {};

  for (const [actionId, settings] of Object.entries(config)) {
    if (settings === false) continue;
    if (!(actionId in ACTIONS)) {
      logger(LogLevel.WARN, tracker.id, 'Unrecognized built-in action:', actionId, Object.keys(ACTIONS));
      continue;
    }

    actions[actionId] = {
      id: actionId,
      capabilities: [actionId],
      handler: ACTIONS[actionId as keyof typeof ACTIONS],
    };
  }

  return actions;
};
