import { type BrowserPlugin, type BrowserTracker } from '@snowplow/browser-tracker-core';
import { type Logger, buildSelfDescribingEvent } from '@snowplow/tracker-core';

import {} from './schemata';
import { Intervention } from './types';
import { extractEntityValues } from './util';

export type SignalsInterventionConfiguration = {
  endpoint: string;
  apiPath?: string;
  builtInAgents?: {
    /* TODO: what should be built in? */
    scriptRunner?: boolean; // run JS, dangerous
    eventDispatch?: boolean; // create DOM events for app to handle?
    actionSimulator?: boolean; // interact with the page on behalf of the user? e.g. clippy demo
    pixelRequest?: boolean; // request an image from the client user to e.g. set cookies
    store?: boolean; // store data in localStorage or something
    track?:
      | boolean
      | {
          // track as snowplow events
          shouldTrack?: (iv: Intervention) => boolean;
        };
  };
  entityTargets?: Record<string, string>; // map of entity_name => key/path to extract value
};

const DEFAULT_PULL_API_PATH = '/api/v1/interventions';
const DEFAULT_ENTITY_TARGETS = {
  domain_userid: 'domain_userid',
  domain_sessionid: 'domain_sessionid',
  pageview_id: 'com.snowplowanalytics.snowplow/web_page.id',
  tab_id: 'com.snowplowanalytics.snowplow/browser_context.tabId',
};
const DEFAULT_AGENT_CONFIG: NonNullable<SignalsInterventionConfiguration['builtInAgents']> = {
  scriptRunner: false,
  track: true,
};

const trackers: Record<string, BrowserTracker> = {};
const customAgents: Record<string, Record<string, (iv: Intervention) => void>> = {};
let LOG: Logger | undefined = undefined;

/**
 * Plugin for tracking the addition and removal of elements to a page and the visibility of those elements.
 * @param param0 Plugin configuration.
 * @param param0.ignoreNextPageView Only required when use per-pageview frequency configurations and the ordering vs the pageview event matters. Defaults to `true`, which means the next pageview event will be ignored and not count as resetting the per-pageview state; this is correct if you're calling startElementTracking before calling trackPageView.
 * @returns
 */
export function SignalsInterventionsPlugin({
  endpoint,
  apiPath = DEFAULT_PULL_API_PATH,
  entityTargets = DEFAULT_ENTITY_TARGETS,
  builtInAgents = DEFAULT_AGENT_CONFIG,
}: SignalsInterventionConfiguration): BrowserPlugin {
  const fullEndpoint = endpoint + apiPath;

  const entityValues = {};
  let params = '';
  let aborter = new AbortController();

  return {
    activateBrowserPlugin(tracker) {
      LOG?.info(`SignalsInterventionPlugin activating for tracker: ${tracker.id}`);
      trackers[tracker.id] = tracker;
      // TODO(jethron): Can we get some default entity IDs like domain_userid/pageview id/tab id straight away at this point?
    },
    afterTrack(payload) {
      const trackerName = payload['tna'];
      if (typeof trackerName === 'string' && trackerName in trackers) {
        Object.assign(entityValues, extractEntityValues(entityTargets, payload));
        const newParams = new URLSearchParams(entityValues).toString();
        if (newParams != params) {
          params = newParams;
          aborter.abort();
          aborter = subscribeToInterventions(
            `${fullEndpoint}?${params}`,
            trackers[trackerName],
            builtInAgents,
            customAgents[trackerName]
          );
        }
      }
    },
    logger(logger) {
      LOG = logger;
    },
  };
}

function subscribeToInterventions(
  url: string,
  tracker: BrowserTracker,
  builtins: NonNullable<SignalsInterventionConfiguration['builtInAgents']>,
  customs: (typeof customAgents)[string],
  timeoutMs: number = 500
): AbortController {
  const stream = new EventSource(url);
  const abort = new AbortController();

  abort.signal.addEventListener('abort', () => stream.close());
  const timeout = setTimeout(() => abort.abort('timeout'), timeoutMs);
  stream.addEventListener('open', () => clearTimeout(timeout));

  stream.addEventListener('message', (ev: MessageEvent<Intervention>) => {
    /* TODO(jethron): Dispatch message to builtin/custom handlers */
    /* TODO(jethron): Store state in LS and coordinate concurrent listeners via onstorage event/session storage */
    const { track } = builtins;

    if (track) {
      if (typeof track === 'object' && track.shouldTrack && track.shouldTrack(ev.data)) {
        /* TODO(jethron): construct proper event */
        const event = buildSelfDescribingEvent({
          event: {
            schema: 'iglu:signals/intervention_received/jsonschema/1-0-0',
            data: ev.data,
          },
        });
        tracker.core.track(event);
      }
    }

    Object.entries(customs).forEach(([agent, handler]) => {
      if (ev.data.agent_ids == null || ev.data.agent_ids.includes(agent)) {
        setTimeout(handler, 0, ev.data);
      }
    });
  });

  stream.addEventListener('error', (ev) => LOG?.error(`Error fetching interventions: ${ev}`));

  return abort;
}

export function registerAgent(
  agentId: string,
  handler: (iv: Intervention) => void,
  trackerList: Array<string> = Object.keys(trackers)
) {
  trackerList.forEach((tracker) => {
    const handlers = (customAgents[tracker] = customAgents[tracker] || {});
    handlers[agentId] = handler;
  });
}

export function deregisterAgent(
  agentId: string,
  handler?: (iv: Intervention) => void,
  trackerList: Array<string> = Object.keys(trackers)
) {
  trackerList.forEach((tracker) => {
    const handlers = (customAgents[tracker] = customAgents[tracker] || {});
    if (handler && handlers[agentId] !== handler) return;
    delete handlers[agentId];
  });
}
