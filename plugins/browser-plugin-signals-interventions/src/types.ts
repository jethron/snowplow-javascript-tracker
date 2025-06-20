import type { BrowserTracker } from '@snowplow/browser-tracker-core';

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
  target_agents?: OneOrMore<AgentId>;
  actions: {}[];
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
export type TrackerId = string;
export type AgentId = string;
export type ActionId = string;

export type SignalsInterventionConfiguration = {
  endpoint: string;
  apiPath?: string;
  entityTargets?: Record<EntityName, JSONPointerList>; // map of entity_name => key/path to extract value
  entityIds?: Record<EntityName, EntityId>;
  connectionTimeoutMs?: number;
  idleTimeoutMs?: number;
};

export type MeasurementSettings = Record<MeasurementEvents, boolean | ((_: Intervention) => boolean)>;

export type SignalsHandlerConfiguration = {
  agent?: Agent;
  builtInActions?: Partial<BuiltInActionConfiguration>;
  measurement?: MeasurementSettings;
};

export type Agent = {
  id: AgentId;
  capabilities?: string[];
  handleAll?: boolean;
  handler: (
    tracker: BrowserTracker,
    intervention: Intervention,
    actionSpace: Record<ActionId, ActionRegistration>
  ) => Promise<unknown> | unknown;
};

export type ActionHandler = (
  tracker: BrowserTracker,
  action: InterventionV1 | InterventionV2['actions'][number]
) => Promise<unknown> | unknown;

export type ActionRegistration = {
  id: ActionId;
  capabilities?: string[];
  handleAll?: boolean;
  handler: ActionHandler;
};

export type BuiltInActionConfiguration = {
  /* TODO: what should be built in? */
  // actionSimulator: boolean; // interact with the page on behalf of the user? e.g. clippy demo
  domEvent: boolean | string; // create DOM events for app to handle
  log: boolean;
  // pixelRequest: boolean; // request an image from the client user to e.g. set cookies
  // scriptRunner: boolean; // run JS, dangerous
  snowplowEvent:
    | boolean
    | {
        // track as snowplow events
        shouldTrack?: (iv: Intervention) => boolean;
      };
  //store: boolean; // store data in localStorage or something
};
