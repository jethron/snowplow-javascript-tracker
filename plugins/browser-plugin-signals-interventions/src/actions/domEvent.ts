import { ActionHandler } from '../types';

const DEFAULT_SIGNALS_DOM_EVENT = 'signals-intervention';

export const domEvent: ActionHandler = function (_, action) {
  window.dispatchEvent(new CustomEvent(DEFAULT_SIGNALS_DOM_EVENT, { detail: action }));
};
