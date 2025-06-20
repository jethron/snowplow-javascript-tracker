import type { Agent } from './types';
import { objWithKey } from './util';

const DEFAULT_AGENT_ID = 'signals_web';

export const DefaultAgent: Agent = {
  id: DEFAULT_AGENT_ID,
  handleAll: true,
  handler(tracker, intervention, actionSpace) {
    if ('actions' in intervention) throw Error('v2 Interventions are not finalized/implemented');

    switch (intervention.method) {
      case 'clear_attribute':
      case 'set_attribute':
        return;
      case 'computer_use_agent':
        if (!intervention.script_uri) throw Error('Missing required script_uri');
        if (!(intervention.script_uri in actionSpace)) throw Error('Unknown action handler requested');
        return actionSpace[intervention.script_uri].handler(tracker, intervention);
      case 'remote_agent':
        throw Error('Can not handle remote agent actions');
      case 'script':
        if (!intervention.script_uri) throw Error('Missing required script_uri');
        if (!objWithKey(window, intervention.script_uri)) throw Error('Could not find requested function');

        const callable = window[intervention.script_uri];
        if (typeof callable !== 'function') throw Error('Requested function is not callable');

        return callable(intervention.context, intervention.context['$attributes']);
    }
  },
};
