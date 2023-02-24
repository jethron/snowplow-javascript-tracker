/*
 * Copyright (c) 2022 Snowplow Analytics Ltd, 2010 Anthon Pang
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { buildLinkClick, trackerCore, EventJsonWithKeys } from '@snowplow/tracker-core';
import { JSDOM } from 'jsdom';
import { PerformanceTimingPlugin } from '../src';

declare var jsdom: JSDOM;

const TIME_ORIGIN = 1000;

const PERFORMANCE_TIMING = {
  navigationStart: TIME_ORIGIN,
  redirectStart: 1002,
  redirectEnd: 1003,
  fetchStart: 1004,
  domainLookupStart: 1005,
  domainLookupEnd: 1006,
  connectStart: 1007,
  secureConnectionStart: 1008,
  connectEnd: 1009,
  requestStart: 1010,
  responseStart: 1011,
  responseEnd: 1012,
  unloadEventStart: 1013,
  unloadEventEnd: 1014,
  domLoading: 1015,
  domInteractive: 1016,
  domContentLoadedEventStart: 1017,
  domContentLoadedEventEnd: 1018,
  domComplete: 1019,
  loadEventStart: 1020,
  loadEventEnd: 1021,
  msFirstPaint: 1022,
  chromeFirstPaint: 1023,
  requestEnd: 1024,
  proxyStart: 1025,
  proxyEnd: 1026,
};

const PERFORMANCE_TIMING_REL = {
  navigationStart: TIME_ORIGIN,
  redirectStart: 2,
  redirectEnd: 3,
  fetchStart: 4,
  domainLookupStart: 5,
  domainLookupEnd: 6,
  connectStart: 7,
  secureConnectionStart: 8,
  connectEnd: 9,
  requestStart: 10,
  responseStart: 11,
  responseEnd: 12,
  unloadEventStart: 13,
  unloadEventEnd: 14,
  domLoading: 15,
  domInteractive: 16,
  domContentLoadedEventStart: 17,
  domContentLoadedEventEnd: 18,
  domComplete: 19,
  loadEventStart: 20,
  loadEventEnd: 21,
  msFirstPaint: 22,
  chromeFirstPaint: 23,
  requestEnd: 24,
  proxyStart: 25,
  proxyEnd: 26,
};

const PERFORMANCE_NAVIGATION_TIMING = {
  name: 'https://example.com/',
  entryType: 'navigation',
  startTime: 0,
  duration: 20,
  initiatorType: 'navigation',
  nextHopProtocol: 'h2',
  workerStart: 0,
  redirectStart: 1,
  redirectEnd: 2,
  fetchStart: 3,
  domainLookupStart: 4,
  domainLookupEnd: 5,
  connectStart: 6,
  secureConnectionStart: 7,
  connectEnd: 8,
  requestStart: 9,
  responseStart: 10,
  responseEnd: 11,
  unloadEventStart: 12,
  unloadEventEnd: 13,
  domInteractive: 14,
  domContentLoadedEventStart: 15,
  domContentLoadedEventEnd: 16,
  domComplete: 17,
  loadEventStart: 18,
  loadEventEnd: 19,
  redirectCount: 1,
  transferSize: 100,
  encodedBodySize: 42,
  decodedBodySize: 88,
  serverTiming: [
    {
      name: 'server',
      duration: 0.5,
      description: 'server thing',
    },
  ],
  type: 'navigate',
};

const PERFORMANCE_NAVIGATION_TIMING_ABS = {
  name: 'https://example.com/',
  entryType: 'navigation',
  startTime: TIME_ORIGIN,
  duration: 20,
  initiatorType: 'navigation',
  nextHopProtocol: 'h2',
  workerStart: TIME_ORIGIN + 0,
  redirectStart: TIME_ORIGIN + 1,
  redirectEnd: TIME_ORIGIN + 2,
  fetchStart: TIME_ORIGIN + 3,
  domainLookupStart: TIME_ORIGIN + 4,
  domainLookupEnd: TIME_ORIGIN + 5,
  connectStart: TIME_ORIGIN + 6,
  secureConnectionStart: TIME_ORIGIN + 7,
  connectEnd: TIME_ORIGIN + 8,
  requestStart: TIME_ORIGIN + 9,
  responseStart: TIME_ORIGIN + 10,
  responseEnd: TIME_ORIGIN + 11,
  unloadEventStart: TIME_ORIGIN + 12,
  unloadEventEnd: TIME_ORIGIN + 13,
  domInteractive: TIME_ORIGIN + 14,
  domContentLoadedEventStart: TIME_ORIGIN + 15,
  domContentLoadedEventEnd: TIME_ORIGIN + 16,
  domComplete: TIME_ORIGIN + 17,
  loadEventStart: TIME_ORIGIN + 18,
  loadEventEnd: TIME_ORIGIN + 19,
  redirectCount: 1,
  transferSize: 100,
  encodedBodySize: 42,
  decodedBodySize: 88,
  serverTiming: [
    {
      name: 'server',
      duration: 0.5,
      description: 'server thing',
    },
  ],
  type: 'navigate',
};

function testPerformancePlugin(
  config: Parameters<typeof PerformanceTimingPlugin>[0],
  callback: (json: EventJsonWithKeys[]) => void,
  events = 1
) {
  const core = trackerCore({
    corePlugins: [PerformanceTimingPlugin(config)],
    callback: (payloadBuilder) => {
      const json = payloadBuilder.getJson().filter((e) => e.keyIfEncoded === 'cx');
      callback(json);
    },
  });

  while (events--) core.track(buildLinkClick({ targetUrl: 'https://example.com' }));
}

describe('Performance Timing plugin', () => {
  beforeAll(() => {
    Object.defineProperty(jsdom.window.performance, 'timing', {
      value: Object.assign({}, PERFORMANCE_TIMING),
      configurable: true,
    });

    Object.defineProperty(jsdom.window.performance, 'timeOrigin', {
      value: TIME_ORIGIN,
      configurable: true,
    });

    Object.defineProperty(jsdom.window, 'PerformanceNavigationTiming', {
      value: function () {
        return this;
      }, // Fakes the instanceof check
      configurable: true,
    });

    Object.defineProperty(jsdom.window.performance, 'getEntriesByType', {
      value: function (t: string) {
        return t === 'navigation'
          ? [Object.assign(new jsdom.window.PerformanceNavigationTiming(), PERFORMANCE_NAVIGATION_TIMING)]
          : [];
      },
      configurable: true,
    });
  });

  it('Returns values for Performance Timing properties', (done) => {
    testPerformancePlugin(undefined, (json) => {
      expect(json[0].json).toMatchObject({
        data: [
          {
            schema: 'iglu:org.w3/PerformanceTiming/jsonschema/1-0-0',
            data: PERFORMANCE_TIMING,
          },
        ],
      });
      done();
    });
  });

  it('Returns values for Performance Navigation Timing properties', (done) => {
    testPerformancePlugin({ source: 'PerformanceNavigationTiming', relative: true }, (json) => {
      expect(json[0].json).toMatchObject({
        data: [
          {
            schema: 'iglu:org.w3/PerformanceNavigationTiming/jsonschema/1-0-0',
            data: Object.assign({}, PERFORMANCE_NAVIGATION_TIMING, { timeOrigin: TIME_ORIGIN }),
          },
        ],
      });
      done();
    });
  });

  it('Returns relative values for Performance Timing properties when requested', (done) => {
    testPerformancePlugin({ source: 'PerformanceTiming', relative: true }, (json) => {
      expect(json[0].json).toMatchObject({
        data: [
          {
            schema: 'iglu:org.w3/PerformanceTiming/jsonschema/1-0-0',
            data: PERFORMANCE_TIMING_REL,
          },
        ],
      });
      done();
    });
  });

  it('Returns absolute values for Performance Navigation Timing properties when requested', (done) => {
    testPerformancePlugin({ source: 'PerformanceNavigationTiming', relative: false }, (json) => {
      expect(json[0].json).toMatchObject({
        data: [
          {
            schema: 'iglu:org.w3/PerformanceNavigationTiming/jsonschema/1-0-0',
            data: Object.assign({}, PERFORMANCE_NAVIGATION_TIMING_ABS, { timeOrigin: TIME_ORIGIN }),
          },
        ],
      });
      done();
    });
  });

  it('Does not send incomplete metrics when requested', (done) => {
    testPerformancePlugin({ source: 'PerformanceNavigationTiming', onlyWhenComplete: 'workerStart' }, (json) => {
      expect(json.length).toEqual(0);
      done();
    });
  });

  it('Sends complete metrics when requested', (done) => {
    testPerformancePlugin({ source: 'PerformanceNavigationTiming', onlyWhenComplete: true }, (json) => {
      expect(json[0].json).toMatchObject({
        data: [
          {
            schema: 'iglu:org.w3/PerformanceNavigationTiming/jsonschema/1-0-0',
            data: Object.assign({}, PERFORMANCE_NAVIGATION_TIMING_ABS, { timeOrigin: TIME_ORIGIN }),
          },
        ],
      });
      done();
    });
  });

  it('Sends only once when requested', (done) => {
    let calls = 0;
    let context: EventJsonWithKeys[] = [];

    testPerformancePlugin(
      { source: 'PerformanceNavigationTiming', sendOnce: true },
      (json) => {
        calls += 1;
        if (json.length) {
          // Empty when first time we have seen the context
          expect(context.length).toBe(0);
          context = json;
        }

        if (calls > 1) {
          expect(context[0].json).toMatchObject({
            data: [
              {
                schema: 'iglu:org.w3/PerformanceNavigationTiming/jsonschema/1-0-0',
                data: Object.assign({}, PERFORMANCE_NAVIGATION_TIMING_ABS, { timeOrigin: TIME_ORIGIN }),
              },
            ],
          });
          done();
        }
      },
      2
    );
  });
});
