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

import { InQueueManager, type Queue, type QueueCall } from './in_queue';
type TrackerQueue = { (): void; q?: QueueCall[] | Queue };

declare global {
  interface Window {
    /**
     * Window namespace used by Snowplow tracker.
     * Configurable through the --whitelabel build option. Defaults to 'GlobalSnowplowNamespace'.
     */
    GlobalSnowplowNamespace?: Array<string>;
    [key: string]: TrackerQueue;
  }
}

const namespace = window.GlobalSnowplowNamespace;
const queueAttr = document.currentScript && document.currentScript.getAttribute('data-queue');
const warning = 'Could not find GlobalSnowplowNamespace or determine function name; file loaded outside of snippet?';
let functionName: string | undefined;

if (queueAttr) {
  // if queue name was found we can use it directly
  functionName = queueAttr;
  // clean up the global namespace if it exists, though this is optional in this case
  if (namespace && namespace.indexOf(queueAttr) != -1) {
    namespace.splice(namespace.indexOf(queueAttr, 1));
  }
} else if (namespace) {
  // standard behavior, assume the namespaces are in order and take the first value
  functionName = namespace.shift();
}

if (functionName) {
  const queue: TrackerQueue =
    (window[functionName] as TrackerQueue) ||
    function () {
      (queue.q = queue.q || ([] as QueueCall[])).push(arguments as unknown as QueueCall);
    };

  // Now replace initialization array with queue manager object
  queue.q = InQueueManager(functionName, queue.q || []);
} else {
  // the global namespace list was not found or was empty
  // this usually indicates the SDK was loaded outside the snippet
  // we don't know which function name to use so must fail
  console.warn(warning);
}
