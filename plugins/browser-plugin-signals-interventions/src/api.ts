import type { BrowserPlugin, BrowserTracker } from '@snowplow/browser-tracker-core';
import { buildSelfDescribingEvent, DynamicContext, resolveDynamicContext } from '@snowplow/tracker-core';

import { InterventionFetcher } from './fetcher';
import { logger, setLogger, LogLevel } from './logger';
import { Entity, Entities, MeasurementPayload, MEASUREMENT_EVENTS } from './schemata';
import type {
  Fetcher,
  HandlerId,
  Handler,
  Intervention,
  MeasurementSettings,
  OneOrMore,
  SignalsHandlerConfiguration,
  SignalsInterventionConfiguration,
  TrackerId,
} from './types';
import { objWithKey } from './util';

const DEFAULT_MEASUREMENT_SETTINGS: Required<MeasurementSettings> = {
  delivery: true,
  dispatch_accept: true,
  dispatch_error: true,
};

const instances: Record<TrackerId, Fetcher> = {};
const handlerRegistry: Record<TrackerId, Record<HandlerId, Handler>> = {};
const measurementSettings: Record<TrackerId, Required<MeasurementSettings>> = {};

export function SignalsInterventionsPlugin(
  { fetcher, measurement = DEFAULT_MEASUREMENT_SETTINGS, handlers = {} }: SignalsHandlerConfiguration = {
    measurement: DEFAULT_MEASUREMENT_SETTINGS,
    handlers: {},
  }
): BrowserPlugin {
  return {
    activateBrowserPlugin(tracker) {
      logger(LogLevel.INFO, tracker.id, 'Activating plugin for tracker');
      instances[tracker.id] = fetcher ? fetcher(tracker, dispatch) : InterventionFetcher.create(tracker, dispatch);
      measurementSettings[tracker.id] = Object.assign({}, DEFAULT_MEASUREMENT_SETTINGS, measurement);
      handlerRegistry[tracker.id] = Object.assign(handlerRegistry[tracker.id] ?? {}, handlers);
    },
    afterTrack(payload) {
      const trackerName = payload['tna'];
      if (typeof trackerName === 'string' && trackerName in instances) {
        instances[trackerName].update(payload);
      }
    },
    logger(LOG) {
      setLogger(SignalsInterventionsPlugin.name, LOG);
    },
  };
}

const measure = <M extends keyof MeasurementSettings, ME extends MeasurementPayload<M>, PL extends ME['data']>(
  settings: MeasurementSettings & { context?: DynamicContext },
  tracker: BrowserTracker,
  measurement: M,
  intervention: Intervention,
  payload: PL
) => {
  const filter = settings[measurement];
  if (filter && (typeof filter !== 'function' || filter(intervention))) {
    const entities: Entity[] = [
      {
        schema: Entities.INTERVENTION,
        data: intervention,
      },
    ];

    tracker.core.track(
      buildSelfDescribingEvent<Record<string, unknown>>({
        event: {
          schema: MEASUREMENT_EVENTS[measurement],
          data: payload,
        },
      }),
      resolveDynamicContext([...entities, ...(settings.context ?? [])], measurement, intervention, payload)
    );
  }
};

const dispatch = (intervention: Intervention, tracker: BrowserTracker) => {
  const measurement = measurementSettings[tracker.id] ?? DEFAULT_MEASUREMENT_SETTINGS;
  const handlers = handlerRegistry[tracker.id] ?? {};

  const handlerIds = Object.keys(handlers);

  if (!handlerIds.length)
    return logger(LogLevel.WARN, tracker.id, 'No handlers registered for intervention', intervention);
  logger(LogLevel.INFO, tracker.id, 'Attempting dispatch for intervention', intervention, handlerIds);
  measure(measurement, tracker, 'delivery', intervention, { handlers: handlerIds });

  for (const [handlerId, handler] of Object.entries(handlers)) {
    setTimeout(
      (handlerId: HandlerId, handler: Handler, intervention: Intervention, tracker: BrowserTracker) => {
        const success = () => {
          logger(LogLevel.INFO, tracker.id, 'Intervention handled', handlerId, intervention);
          measure(measurement, tracker, 'dispatch_accept', intervention, {
            handler: handlerId,
          });
        };
        const failure = (err?: unknown) => {
          logger(LogLevel.ERROR, tracker.id, 'Handler failed processing intervention', err, handlerId, intervention);
          measure(measurement, tracker, 'dispatch_error', intervention, {
            handler: handlerId,
            error: err ? String(err) : undefined,
          });
        };

        try {
          const result = handler(intervention, tracker);

          if (result instanceof Promise) {
            result.then(success, failure);
          } else if (objWithKey(result, 'then') && typeof result.then === 'function') {
            result.then(success, failure);
          } else success();
        } catch (e: unknown) {
          failure(e);
        }
      },
      0,
      handlerId,
      handler,
      intervention,
      tracker
    );
  }
};

export function subscribeToInterventions(
  config: SignalsInterventionConfiguration,
  trackers: TrackerId[] = Object.keys(instances)
) {
  for (const trackerId of trackers) {
    if (trackerId in instances) {
      instances[trackerId].configure(config);
    }
  }
}

export function addInterventionHandlers(
  handlers: Record<HandlerId, Handler>,
  trackers: TrackerId[] = Object.keys(instances)
) {
  for (const trackerId of trackers) {
    handlerRegistry[trackerId] = Object.assign(handlerRegistry[trackerId] ?? {}, handlers);
  }
}

export function removeInterventionHandlers(
  handlerId: OneOrMore<HandlerId>,
  trackers: TrackerId[] = Object.keys(instances)
) {
  const toRemove = Array.isArray(handlerId) ? handlerId : [handlerId];
  for (const handlerId of toRemove) {
    for (const trackerId of trackers) {
      delete handlerRegistry[trackerId][handlerId];
    }
  }
}
