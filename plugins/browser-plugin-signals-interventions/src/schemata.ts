import type { SelfDescribingJson } from '@snowplow/tracker-core';

export const Events = {
  INTERVENTION_RECEIVED: 'iglu:com.snowplowanalytics.signals/intervention_receive/jsonschema/1-0-0',
  INTERVENTION_DISPATCHED: 'iglu:com.snowplowanalytics.signals/intervention_dispatch/jsonschema/1-0-0',
  INTERVENTION_HANDLE: 'iglu:com.snowplowanalytics.signals/intervention_handle/jsonschema/1-0-0',
  INTERVENTION_HANDLE_ERROR: 'iglu:com.snowplowanalytics.signals/intervention_handle_error/jsonschema/1-0-0',
} as const;

export const Entities = {
  INTERVENTION: 'iglu:com.snowplowanalytics.signals/intervention_instance/jsonschema/1-0-0',
} as const;

export type SDJ<
  S extends (typeof Entities)[keyof typeof Entities] | (typeof Events)[keyof typeof Events],
  D = Record<string, unknown>
> = SelfDescribingJson<D> & {
  schema: S;
};

export type Event<S extends keyof typeof Events = keyof typeof Events, D = Record<string, unknown>> = SDJ<
  (typeof Events)[S],
  D
>;
export type Entity<S extends keyof typeof Entities = keyof typeof Entities, D = Record<string, unknown>> = SDJ<
  (typeof Entities)[S],
  D
>;

export const MEASUREMENT_EVENTS = {
  delivery: Events.INTERVENTION_RECEIVED,
  dispatch_accept: Events.INTERVENTION_HANDLE,
  dispatch_error: Events.INTERVENTION_HANDLE_ERROR,
} as const;

export type MeasurementEvents = keyof typeof MEASUREMENT_EVENTS;
