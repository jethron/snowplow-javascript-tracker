import type { BrowserTracker } from '@snowplow/browser-tracker-core';
import type { Logger, TrackerCore } from '@snowplow/tracker-core';
import { sources } from 'eventsourcemock';

import {
  SignalsInterventionsPlugin,
  subscribeToInterventions,
  addInterventionHandlers,
  removeInterventionHandlers,
} from '../src';
import type { Fetcher, FetcherFactory, Intervention, SignalsInterventionConfiguration } from '../src/types';

const TEST_ENDPOINT = 'http://example.com';

const mockFetcher = jest.mocked<Fetcher>(
  {
    configure: jest.fn(),
    update: jest.fn(),
  },
  true
);

const mockFetcherFactory: FetcherFactory = jest.fn((tracker, dispatch) => {
  mockFetcher.configure.mockImplementation((config) => {
    const sse = new EventSource(`${config.endpoint}/api/v1/interventions`);

    sse.addEventListener('message', (e) => {
      dispatch(JSON.parse(e.data), tracker);
    });
  });

  return mockFetcher;
});

const mockLogger: Logger = {
  setLogLevel: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockTracker = {
  id: 'id',
  core: {
    track: jest.fn(),
  } as Pick<TrackerCore, 'track'>,
} as BrowserTracker;

const mockHandler = jest.fn();
const mockHandler2 = jest.fn(async () => Promise.reject());

const intervention: Intervention = {
  name: 'name',
  intervention_id: 'intervention_id',
  version: 1,
  method: 'computer_use_agent',
  script_uri: 'log',
  context: {
    $attributes: {},
  },
};

const contextGenerator = jest.fn();

const plugin = SignalsInterventionsPlugin({
  fetcher: mockFetcherFactory,
  handlers: { mockHandler },
  measurement: {
    delivery: true,
    dispatch_accept: () => true,
    context: [contextGenerator],
  },
});

jest.useFakeTimers();

plugin.logger!(mockLogger);
plugin.activateBrowserPlugin!(mockTracker);

describe('api', () => {
  describe('plugin', () => {
    it('initialized logger', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('[SignalsInterventionsPlugin:id] Activating plugin for tracker');
    });

    it('uses custom fetchers', () => {
      expect(mockFetcherFactory).toHaveBeenCalledWith(mockTracker, expect.any(Function));
    });

    it('updates fetchers', () => {
      const wrongTracker = { tna: 'skip' };
      plugin.afterTrack!(wrongTracker);
      expect(mockFetcher.update).not.toHaveBeenCalled();

      const payload = { tna: 'id' };
      plugin.afterTrack!(payload);
      expect(mockFetcher.update).toHaveBeenCalledWith(payload);
    });

    it('subscribes', () => {
      const config: SignalsInterventionConfiguration = { endpoint: TEST_ENDPOINT };
      subscribeToInterventions(config);
      expect(mockFetcher.configure).toHaveBeenCalledWith(config);
    });

    it('measures', () => {
      const sse = sources[`${TEST_ENDPOINT}/api/v1/interventions`];
      expect(sse).toBeDefined();

      sse!.emit('message', new MessageEvent('data', { data: JSON.stringify(intervention) }));

      expect(mockTracker.core.track).toHaveBeenCalledTimes(1);
      expect(contextGenerator).toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();

      jest.runOnlyPendingTimers();
      expect(mockTracker.core.track).toHaveBeenCalledTimes(2);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('late subscribers', () => {
      const sse = sources[`${TEST_ENDPOINT}/api/v1/interventions`];
      expect(sse).toBeDefined();

      sse!.emit('message', new MessageEvent('data', { data: JSON.stringify(intervention) }));
      jest.runOnlyPendingTimers();

      expect(mockHandler2).not.toHaveBeenCalled();

      addInterventionHandlers({ mockHandler2 });

      sse!.emit('message', new MessageEvent('data', { data: JSON.stringify(intervention) }));
      jest.runOnlyPendingTimers();

      expect(mockHandler2).toHaveBeenCalledWith(intervention, mockTracker);

      mockHandler2.mockReset();
      removeInterventionHandlers(['mockHandler2']);

      sse!.emit('message', new MessageEvent('data', { data: JSON.stringify(intervention) }));
      jest.runOnlyPendingTimers();

      expect(mockHandler2).not.toHaveBeenCalled();
    });
  });
});
