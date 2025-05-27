import { SelfDescribingJson } from '@snowplow/tracker-core';

export enum Events {
  INTERVENTION_AVAILABLE = 'iglu:com.snowplowanalytics.signals/intervention_available/jsonschema/1-0-0',
}

export enum Entities {}

export type SDJ<S extends Entities | Events, D = Record<string, unknown>> = SelfDescribingJson<D> & {
  schema: S;
};

export type Event<S extends Events = Events, D = Record<string, unknown>> = SDJ<S, D>;
export type Entity<S extends Entities = Entities, D = Record<string, unknown>> = SDJ<S, D>;

export type InterventionAvailableEvent = SDJ<Events.INTERVENTION_AVAILABLE, {}>;
