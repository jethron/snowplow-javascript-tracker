import { buildSelfDescribingEvent, isSelfDescribingJson } from '@snowplow/tracker-core';

import { ActionHandler } from '../types';
import { objWithKey } from '../util';

export const snowplowEvent: ActionHandler = function (tracker, action) {
  if (!('context' in action)) throw Error('Only v1 supported for snowplowEvent');

  if (objWithKey(action.context, 'event')) {
    const event = action.context.event;
    const context = objWithKey(action.context, 'entities') ? action.context.context : [];

    if (!isSelfDescribingJson(event)) throw Error('Invalid entities');
    if (!Array.isArray(context) || !context.every(isSelfDescribingJson)) throw Error('Invalid entities found');

    tracker.core.track(buildSelfDescribingEvent({ event }), context);
  }
};
