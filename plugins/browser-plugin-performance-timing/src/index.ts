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

import { BrowserPlugin } from '@snowplow/browser-tracker-core';
import { PerformanceTiming, PerformanceNavigationTiming } from './contexts';

declare global {
  interface Window {
    mozPerformance: any;
    msPerformance: any;
    webkitPerformance: any;
  }
}

type PerformanceTimingPluginOptions = {
  /**
   * Which API should be used to source performance metrics from.
   *
   * Can be PerformanceTiming (default, deprecated) or
   * PerformanceNavigationTiming.
   */
  source?: 'PerformanceTiming' | 'PerformanceNavigationTiming';
  /**
   * PerformanceTiming captures timings in absolute values, but
   * PerformanceNavigationTiming uses values relative to the timeOrigin.
   * This option allows changing between the two for both sources.
   */
  relative?: boolean;
  /**
   * Values collected in this context may not always be useful until a
   * certain stage of the page lifecycle. Set to true to not send until the
   * loadEventEnd, or specify a different metric that must be non-zero
   * before attaching the context.
   */
  onlyWhenComplete?: boolean | keyof PerformanceNavigationTiming;
  /**
   * The context can add to storage overhead when attached to every event,
   * especially if using e.g. page pings. Set to true to only send the context
   * on one event per page lifecycle.
   * Useful when combined with onlyWhenComplete.
   */
  sendOnce?: boolean;
};

/**
 * Backwards compatible defaults.
 * If no options are provided, use the original plugin behavior.
 *
 * @todo Switch to PerformanceNavigationTiming as default in a future release.
 */
const DEFAULT_OPTIONS: PerformanceTimingPluginOptions = {
  source: 'PerformanceTiming',
  relative: false,
  onlyWhenComplete: false,
  sendOnce: false,
};

const PERFORMANCE_TIMING_FIELDS = [
  'navigationStart',
  'redirectStart',
  'redirectEnd',
  'fetchStart',
  'domainLookupStart',
  'domainLookupEnd',
  'connectStart',
  'secureConnectionStart',
  'connectEnd',
  'requestStart',
  'responseStart',
  'responseEnd',
  'unloadEventStart',
  'unloadEventEnd',
  'domLoading',
  'domInteractive',
  'domContentLoadedEventStart',
  'domContentLoadedEventEnd',
  'domComplete',
  'loadEventStart',
  'loadEventEnd',
  'msFirstPaint',
  'chromeFirstPaint',
  'requestEnd',
  'proxyStart',
  'proxyEnd',
] as (keyof Omit<globalThis.PerformanceTiming, 'toJSON'>)[];

/**
 * Adds Performance Timing context to events
 *
 * @remarks
 * May not be fully populated when initial Page View fires
 * Often a good idea to take the latest performance timing context
 * for a given page view id when analyzing in the warehouse
 */
export function PerformanceTimingPlugin(options: PerformanceTimingPluginOptions = DEFAULT_OPTIONS): BrowserPlugin {
  // Flag to enable sendOnce support
  let sent = false;

  /**
   * Creates a context from the window.performance.timing object or latest
   * PerformanceNavigationTiming entry.
   *
   * @returns object PerformanceTiming/PerformanceNavigationTiming context
   */
  function getPerformanceTimingContext() {
    if (options.sendOnce && sent) return [];

    const windowAlias = window,
      performanceAlias =
        windowAlias.performance ||
        windowAlias.mozPerformance ||
        windowAlias.msPerformance ||
        windowAlias.webkitPerformance,
      performanceTimingAlias = performanceAlias && performanceAlias.timing,
      onlyWhenComplete = options.onlyWhenComplete === true ? 'loadEventEnd' : options.onlyWhenComplete,
      alwaysAbsolute = /(Size|Bytes|Count|duration)$/;

    if (options.source === 'PerformanceTiming') {
      if (performanceTimingAlias) {
        // Allow for waiting for a measurement to complete
        if (onlyWhenComplete && !(performanceTimingAlias as any)[onlyWhenComplete]) {
          return [];
        }

        const performanceTiming = PERFORMANCE_TIMING_FIELDS.reduce<PerformanceTiming>((result, field) => {
          // PerformanceTiming timestamps are absolute by default.
          const relativeTs = performanceTimingAlias[field] - performanceTimingAlias['navigationStart'];
          // navigationStart is the equivalent of timeOrigin.
          result[field] = options.relative && field !== 'navigationStart' ? relativeTs : performanceTimingAlias[field];
          return result;
        }, {});

        sent = true;
        return [
          {
            schema: 'iglu:org.w3/PerformanceTiming/jsonschema/1-0-0',
            data: performanceTiming,
          },
        ];
      }
    } else if (options.source === 'PerformanceNavigationTiming' && windowAlias.PerformanceNavigationTiming) {
      const pnt = performanceAlias.getEntriesByType('navigation').pop();
      if (!(pnt instanceof windowAlias.PerformanceNavigationTiming)) return [];

      // Allow for waiting for a measurement to complete
      if (onlyWhenComplete && !(pnt as any)[onlyWhenComplete]) {
        return [];
      }

      const timeOrigin = performanceAlias.timeOrigin;

      type PNTKey = keyof PerformanceNavigationTiming;
      type GPNTKey = keyof globalThis.PerformanceNavigationTiming;

      const performanceTiming = (Object.keys(pnt) as GPNTKey[]).reduce<PerformanceNavigationTiming>(
        (result, field) => {
          const pntVal = pnt[field];
          if (typeof pntVal === 'number') {
            // PerformanceNavigationTiming timestamps are relative to timeOrigin by default.
            result[field as PNTKey] = options.relative || alwaysAbsolute.test(field) ? pntVal : timeOrigin + pntVal;
          } else if (typeof pntVal !== 'function') {
            // ignore toJSON() etc.
            result[field as PNTKey] = pntVal;
          }

          return result;
        },
        { timeOrigin }
      );

      sent = true;
      return [
        {
          schema: 'iglu:org.w3/PerformanceNavigationTiming/jsonschema/1-0-0',
          data: performanceTiming,
        },
      ];
    } else {
      throw new Error(
        'browser-plugin-performance-timing: Unsupported performance timing source: ' + String(options.source)
      );
    }

    return [];
  }

  return {
    contexts: () => getPerformanceTimingContext(),
  };
}
