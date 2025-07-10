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

/* Per-tracker state */
const instances: Record<TrackerId, Fetcher> = {}; // entities will likely vary by tracker, so each set will need its own fetcher
const handlerRegistry: Record<TrackerId, Record<HandlerId, Handler>> = {}; // handlers can be added/removed for individual trackers
const measurementSettings: Record<TrackerId, Required<MeasurementSettings>> = {}; // currently global and only specified per-plugin instance but may be required in future

/**
 * Create an instance of the Signals Interventions plugin.
 * @param configuration Configuration for the plugin
 * @returns Configured plugin instance
 */
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

/**
 * Tracks an event upon receipt/handling of an intervention unless configured not to.
 * @param settings Measurement settings defining whether an event should fire or not, and configuring custom context
 * @param tracker The tracker to track the event with
 * @param measurement The type of event to track
 * @param intervention The intervention payload in question
 * @param payload An event-specific payload, if required according to `measurement`
 */
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
        data: {
          intervention_id: intervention.intervention_id,
          name: intervention.name,
          version: intervention.version,
          entity: 'targetEntity' in intervention ? intervention.targetEntity : undefined,
          attributes: 'attributes' in intervention ? intervention.attributes : intervention.context.$attributes,
        },
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

/**
 * Called by the `Fetcher` to track receipt of an Intervention and distribute to any handlers
 * @param intervention The intervention payload that was fetched
 * @param tracker The tracker associated with the plugin
 */
const dispatch = (intervention: Intervention, tracker: BrowserTracker): void => {
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

/**
 * Configure the endpoint information for the plugin's `Fetcher` to subscribe to events from
 * @param config Configuration about the endpoint and entity IDs/definitions to configure
 * @param trackers List of tracker IDs that have activated the plugin to configure a `Fetcher` for
 */
export function subscribeToInterventions(
  config: SignalsInterventionConfiguration,
  trackers: TrackerId[] = Object.keys(instances)
): void {
  for (const trackerId of trackers) {
    if (trackerId in instances) {
      instances[trackerId].configure(config);
    }
  }
}

/**
 * Start calling the given handlers when new interventions are received
 * @param handlers Map of handler IDs to handler functions to call with new interventions
 * @param trackers List of tracker IDs that have activated the plugin to add these handlers to
 */
export function addInterventionHandlers(
  handlers: Record<HandlerId, Handler>,
  trackers: TrackerId[] = Object.keys(instances)
): void {
  for (const trackerId of trackers) {
    handlerRegistry[trackerId] = Object.assign(handlerRegistry[trackerId] ?? {}, handlers);
  }
}

/**
 * Stop calling handlers with the given IDs with new interventions
 * @param handlerIds One or more handler IDs to remove
 * @param trackers List of trackers to remove the handlers for; defaults to all trackers that have activated the plugin.
 */
export function removeInterventionHandlers(
  handlerIds: OneOrMore<HandlerId>,
  trackers: TrackerId[] = Object.keys(instances)
): void {
  const toRemove = Array.isArray(handlerIds) ? handlerIds : [handlerIds];
  for (const handlerId of toRemove) {
    for (const trackerId of trackers) {
      delete handlerRegistry[trackerId][handlerId];
    }
  }
}
