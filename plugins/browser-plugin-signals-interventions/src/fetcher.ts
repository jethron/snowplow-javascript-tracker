import type { BrowserTracker, Payload } from '@snowplow/browser-tracker-core';

import { logger, LogLevel } from './logger';
import type { EntityId, EntityName, JSONPointerList, Intervention, SignalsInterventionConfiguration } from './types';
import { extractEntityValues } from './util';

const DEFAULT_PULL_API_PATH = '/api/v1/interventions';
const DEFAULT_ENTITY_TARGETS: Record<EntityName, JSONPointerList> = {
  domain_userid: '/domain_userid',
  domain_sessionid: '/domain_sessionid',
  //pageview_id: '/co/com.snowplowanalytics.snowplow/web_page/id', // not a default entity seed
  //tab_id: '/co/com.snowplowanalytics.snowplow/browser_context/tabId', // not a default entity seed
};
const DEFAULT_CONNECTION_TIMEOUT_MS = 2500;

export class InterventionFetcher {
  private readonly entityValues: Record<EntityName, EntityId> = {};
  private readonly aborter = new AbortController();
  private timeoutMs = DEFAULT_CONNECTION_TIMEOUT_MS;
  private endpoint?: string;
  private newEndpoint: boolean = false;
  private currentParams: string = '';
  private entitySelectors: Record<EntityName, JSONPointerList> = DEFAULT_ENTITY_TARGETS;

  constructor(
    private readonly tracker: BrowserTracker,
    private readonly dispatch: (intervention: Intervention, tracker: BrowserTracker) => void
  ) {
    const info = tracker.getDomainUserInfo();

    this.update({
      duid: info[1],
      vid: info[6],
    });
  }

  configure({
    endpoint,
    apiPath = DEFAULT_PULL_API_PATH,
    entityTargets = DEFAULT_ENTITY_TARGETS,
    entityIds = {},
    connectionTimeoutMs = DEFAULT_CONNECTION_TIMEOUT_MS,
  }: SignalsInterventionConfiguration) {
    this.entitySelectors = Object.assign({}, this.entitySelectors, entityTargets);
    this.timeoutMs = connectionTimeoutMs;

    const prevEndpoint = this.endpoint;
    this.endpoint = `${/\/\//.test(endpoint) ? endpoint : 'https://' + endpoint}${apiPath}`;
    this.newEndpoint = prevEndpoint != this.endpoint;

    this.update(undefined, entityIds);
  }

  update(payload?: Payload, explicitEntities: Record<EntityName, EntityId> = {}) {
    if (payload) Object.assign(this.entityValues, extractEntityValues(this.entitySelectors, payload));
    Object.assign(this.entityValues, explicitEntities);

    const newParams = new URLSearchParams(this.entityValues).toString();
    if (this.endpoint && (newParams != this.currentParams || this.newEndpoint)) {
      logger(LogLevel.DEBUG, this.tracker.id, 'Entity IDs updated', this.entityValues);
      this.currentParams = newParams;
      this.requestInterventions();
    }
  }

  requestInterventions() {
    const aborter = this.aborter;
    aborter.abort();

    if (!this.endpoint) {
      logger(LogLevel.ERROR, this.tracker.id, 'Requested interventions from undefined endpoint');
      return;
    }

    const url = `${this.endpoint}?${this.currentParams}`;
    const stream = new EventSource(url);

    aborter.signal.addEventListener('abort', stream.close.bind(stream), { once: true });

    const timeout = setTimeout(() => aborter.abort('timeout'), this.timeoutMs);
    stream.addEventListener('open', () => clearTimeout(timeout), { once: true });
    stream.addEventListener('error', (ev) =>
      logger(LogLevel.ERROR, this.tracker.id, 'Error fetching interventions:', ev)
    );

    stream.addEventListener('message', (ev: MessageEvent<string>) => {
      this.dispatch(JSON.parse(ev.data), this.tracker);
    });
  }
}
