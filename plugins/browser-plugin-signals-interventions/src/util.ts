import { type Payload } from '@snowplow/browser-tracker-core';

export function extractEntityValues(targets: Record<string, string>, pb: Payload): Record<string, string> {
  // TODO(jethron): Extract found entity information from event payload
  return {};
}
