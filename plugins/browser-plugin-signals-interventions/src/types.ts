import type { BrowserTracker, Payload } from '@snowplow/browser-tracker-core';

import type { MeasurementEvents } from './schemata';

export type Intervention = InterventionV1 | InterventionV2;

type InterventionV1 = {
  intervention_id: string;
  name: string;
  version: number;
  method: 'clear_attribute' | 'set_attribute' | 'script' | 'computer_use_agent' | 'remote_agent';
  target_agents?: string;
  script_uri?: string;
  context: {
    $attributes: Record<string, OneOrMore<string | number | boolean>>;
    [key: string]: unknown;
  };
};

type InterventionV2 = {
  intervention_id: string;
  name: string;
  version: number;
  attributes: Record<string, OneOrMore<string | number | boolean>>;
  targetEntity?: {
    entityName: string;
    entityId?: string;
  };
};

export type OneOrMore<T> = T | T[];

export type JSONPointer = '' | `/${string}`;
export type JSONPointerList = OneOrMore<JSONPointer>;

export type EntityName = string;
export type EntityId = string;
export type HandlerId = string;
export type TrackerId = string;

export type SignalsInterventionConfiguration = {
  endpoint: string;
  apiPath?: string;
  entityTargets?: Record<EntityName, JSONPointerList>; // map of entity_name => key/path to extract value
  entityIds?: Record<EntityName, EntityId>;
  connectionTimeoutMs?: number;
};

export type MeasurementSettings = Record<MeasurementEvents, boolean | ((_: Intervention) => boolean)>;

export type SignalsHandlerConfiguration = {
  fetcher?: FetcherFactory;
  handlers?: Record<HandlerId, Handler>;
  measurement?: MeasurementSettings;
};

export interface FetcherFactory {
  (tracker: BrowserTracker, dispatch: (intervention: Intervention, tracker: BrowserTracker) => void): Fetcher;
}

export interface Fetcher {
  configure(config: SignalsInterventionConfiguration): void;
  update(payload?: Payload, explicitEntities?: Record<EntityName, EntityId>): void;
}

export type Handler = (intervention: Intervention, tracker: BrowserTracker) => Promise<unknown> | unknown;
