import type { BrowserPlugin, BrowserTracker } from '@snowplow/browser-tracker-core';
import { buildSelfDescribingEvent } from '@snowplow/tracker-core';

import { setupBuiltInActions } from './actions';
import { DefaultAgent } from './agent';
import { InterventionFetcher } from './fetcher';
import { logger, setLogger, LogLevel } from './logger';
import { Event, Entity, Entities, MEASUREMENT_EVENTS } from './schemata';
import type {
  ActionId,
  ActionRegistration,
  Agent,
  Intervention,
  MeasurementSettings,
  SignalsHandlerConfiguration,
  SignalsInterventionConfiguration,
  TrackerId,
} from './types';
import { objWithKey } from './util';

const DEFAULT_ACTION_CONFIG: NonNullable<SignalsHandlerConfiguration['builtInActions']> = {
  // actionSimulator: false,
  domEvent: false,
  log: false,
  // pixelRequest: false,
  // scriptRunner: false,
  snowplowEvent: false,
  // store: false,
};

const DEFAULT_MEASUREMENT_SETTINGS: Required<MeasurementSettings> = {
  delivery: true,
  dispatch_accept: true,
  dispatch_error: true,
};

const instances: Record<TrackerId, InterventionFetcher> = {};
const agentRegistry: Record<TrackerId, Agent> = {};
const builtInActionRegistry: Record<TrackerId, Record<ActionId, ActionRegistration>> = {};
const customActionRegistry: Record<TrackerId, Record<ActionId, ActionRegistration>> = {};
const measurementSettings: Record<TrackerId, Required<MeasurementSettings>> = {};

export function SignalsInterventionsPlugin({
  agent,
  builtInActions = DEFAULT_ACTION_CONFIG,
  measurement = DEFAULT_MEASUREMENT_SETTINGS,
}: SignalsHandlerConfiguration): BrowserPlugin {
  return {
    activateBrowserPlugin(tracker) {
      logger(LogLevel.INFO, tracker.id, 'Activating plugin for tracker');
      instances[tracker.id] = new InterventionFetcher(tracker, dispatch);
      measurementSettings[tracker.id] = Object.assign({}, DEFAULT_MEASUREMENT_SETTINGS, measurement);
      agentRegistry[tracker.id] = agent ?? DefaultAgent;
      builtInActionRegistry[tracker.id] = setupBuiltInActions(builtInActions, tracker);
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

const measure = (
  settings: MeasurementSettings,
  tracker: BrowserTracker,
  measurement: keyof MeasurementSettings,
  intervention: Intervention,
  payload?: Event['data']
) => {
  let event: Event | undefined = undefined;
  const entities: Entity[] = [
    {
      schema: Entities.INTERVENTION,
      data: intervention,
    },
  ];

  const filter = settings[measurement];
  if (filter) {
    if (typeof filter !== 'function' || filter(intervention)) {
      event = {
        schema: MEASUREMENT_EVENTS[measurement],
        data: payload ?? {},
      };
    }
  }

  if (event) {
    tracker.core.track(buildSelfDescribingEvent({ event }), entities);
  }
};

const dispatch = (intervention: Intervention, tracker: BrowserTracker) => {
  /* TODO(jethron): Store state in LS and coordinate concurrent listeners via onstorage event/session storage */
  const measurement = measurementSettings[tracker.id] ?? DEFAULT_MEASUREMENT_SETTINGS;
  const agent = agentRegistry[tracker.id];
  const actionSpace = {
    ...builtInActionRegistry[tracker.id],
    ...customActionRegistry[tracker.id],
  };

  measure(measurement, tracker, 'delivery', intervention);
  logger(LogLevel.INFO, tracker.id, 'Attempting dispatch for intervention', intervention, agent);

  const isTargeted =
    intervention.target_agents == null ||
    (Array.isArray(intervention.target_agents)
      ? intervention.target_agents.includes(agent.id)
      : intervention.target_agents == agent.id);

  if (!isTargeted && !agent.handleAll) {
    logger(LogLevel.WARN, tracker.id, 'Agent ineligible for intervention targeting', intervention, agent);
    return;
  }

  setTimeout(
    (intervention: Intervention, tracker: BrowserTracker, agent: Agent) => {
      const success = () => {
        logger(LogLevel.INFO, tracker.id, 'Agent accepted intervention', agent, intervention);
        measure(measurement, tracker, 'dispatch_accept', intervention, {
          agent: agent.id,
        });
      };
      const failure = (err?: unknown) => {
        logger(LogLevel.ERROR, tracker.id, 'Agent failed handling intervention', err, agent, intervention);
        measure(measurement, tracker, 'dispatch_error', intervention, {
          agent: agent.id,
          error: err ? String(err) : undefined,
        });
      };

      try {
        const result = agent.handler(tracker, intervention, actionSpace);

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
    intervention,
    tracker,
    agent
  );
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

export function registerAction(agent: ActionRegistration, trackerList: TrackerId[] = Object.keys(instances)) {
  trackerList.forEach((tracker) => {
    const handlers = (customActionRegistry[tracker] = customActionRegistry[tracker] || {});
    handlers[agent.id] = agent;
  });
}

export function deregisterAction(actionId: string, trackerList: TrackerId[] = Object.keys(instances)) {
  trackerList.forEach((tracker) => {
    const handlers = (customActionRegistry[tracker] = customActionRegistry[tracker] || {});
    delete handlers[actionId];
  });
}
