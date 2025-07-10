import type { BrowserTracker } from '@snowplow/browser-tracker-core';
import type { TrackerCore } from '@snowplow/tracker-core';
import { sources } from 'eventsourcemock';

import { InterventionFetcher } from '../src/fetcher';

const mockTracker = {
  id: 'id',
  getDomainUserInfo() {
    return ['', 'duid', 0, 0, 0, undefined, 'sid', '', '', 0, 0];
  },
  core: {
    track: jest.fn(),
  } as Pick<TrackerCore, 'track'>,
} as BrowserTracker;

const dispatch = jest.fn();

jest.useFakeTimers();

describe('fetcher', () => {
  describe('InterventionFetcher', () => {
    it('initiates sse connections', () => {
      const fetcher = InterventionFetcher.create(mockTracker, dispatch);

      expect(fetcher).toBeDefined();

      const expectedUri = 'https://example.com/api/v1/interventions?domain_userid=duid&domain_sessionid=sid';

      expect(sources[expectedUri]).not.toBeDefined();

      fetcher.configure({ endpoint: 'example.com' });

      expect(sources[expectedUri]).toBeDefined();
    });

    it('reconfigures options', () => {
      const fetcher = InterventionFetcher.create(mockTracker, dispatch);

      fetcher.configure({
        endpoint: 'http://example.com',
        apiPath: '/test',
        entityIds: { test: 'test' },
        connectionTimeoutMs: 1,
      });

      let source = sources['http://example.com/test?domain_userid=duid&domain_sessionid=sid&test=test'];
      expect(source).toBeDefined();

      jest.runOnlyPendingTimers();
      expect(source!.readyState).toBe(2);

      fetcher.configure({ endpoint: 'https://example.com', connectionTimeoutMs: 1 });

      source = sources['https://example.com/api/v1/interventions?domain_userid=duid&domain_sessionid=sid&test=test'];
      expect(source).toBeDefined();
      expect(source!.readyState).toBe(0);
      source!.emit('open');
      source!.emitOpen();

      jest.runOnlyPendingTimers();
      expect(source!.readyState).toBe(1);

      fetcher.configure({ endpoint: 'http://example.com', connectionTimeoutMs: 1 });
      expect(source!.readyState).toBe(2);
    });
  });
});
