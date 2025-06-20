import { type Payload } from '@snowplow/browser-tracker-core';

import type { EntityName, JSONPointer, JSONPointerList } from './types';

const ENTITY_ALIASES = ['co', 'cx', 'context', 'entity', 'entities'];
const EVENT_ALIASES = ['ue', 'ue_pr', 'ue_px', 'unstruct', 'unstruct_event', 'self_describing', 'sde'];
const EVENT_SCHEMAS = {
  se: 'iglu:com.google.analytics/event/jsonschema/1-0-0',
  ev: 'iglu:com.google.analytics/event/jsonschema/1-0-0',
  ad: 'iglu:com.snowplowanalytics.snowplow/ad_impression/jsonschema/1-0-0',
  tr: 'iglu:com.snowplowanalytics.snowplow/transaction/jsonschema/1-0-0',
  ti: 'iglu:com.snowplowanalytics.snowplow/transaction_item/1-0-0',
  pv: 'iglu:com.snowplowanalytics.snowplow/page_view/jsonschema/1-0-0',
  pp: 'iglu:com.snowplowanalytics.snowplow/page_ping/jsonschema/1-0-0',
  ue: '',
};

export const objWithKey = <T extends string>(obj: unknown, key: T): obj is { [key in T]: unknown } =>
  typeof obj === 'object' && obj != null && key in obj;

const extractUrlFrom =
  <F extends string>(part: keyof URL, field: F) =>
  (event: { [_ in F]?: string }): string | undefined => {
    try {
      return new URL(event[field]!)[part].toString();
    } catch (_) {
      return;
    }
  };

const extractUrlParamFrom =
  <F extends string>(param: string, field: F) =>
  (event: { [_ in F]?: string }): string | undefined => {
    try {
      return new URL(event[field]!).searchParams.get(param) ?? undefined;
    } catch (_) {
      return;
    }
  };

const extractParamPartFrom =
  <F extends string>(param: string, field: F, index: number, sep: string = '.') =>
  (event: { [_ in F]?: string }): string | undefined => {
    try {
      const full = new URL(event[field]!).searchParams.get(param) ?? undefined;
      return full ? full.split(sep)[index] : undefined;
    } catch (_) {
      return;
    }
  };

const extractDimensionValueFrom =
  <F extends string>(dim: number, field: F) =>
  (event: { [_ in F]?: string }) => {
    try {
      return event[field]!.split('x')[dim];
    } catch (_) {
      return;
    }
  };

const selectorMap = {
  app_id: 'aid',
  platform: 'p',
  dvce_created_tstamp: 'dtm',
  event: ({ e }: { e?: string }): string | undefined => {
    return (
      {
        se: 'struct',
        ev: 'struct',
        ue: 'unstruct',
        ad: 'ad_impression',
        tr: 'transaction',
        ti: 'transaction_item',
        pv: 'page_view',
        pp: 'page_ping',
      }[e!] ?? e
    );
  },
  event_id: 'eid',
  txn_id: 'tid',
  name_tracker: 'tna',
  v_tracker: 'tv',
  user_id: 'uid',
  user_ipaddress: 'ip',
  user_fingerprint: 'fp',
  domain_userid: 'duid',
  domain_sessionidx: 'vid',
  network_userid: 'nuid',
  page_url: 'url',
  page_title: 'page',
  page_referrer: 'refr',
  page_urlscheme: extractUrlFrom('protocol', 'url'),
  page_urlhost: extractUrlFrom('hostname', 'url'),
  page_urlport: extractUrlFrom('port', 'url'),
  page_urlpath: extractUrlFrom('pathname', 'url'),
  page_urlquery: extractUrlFrom('search', 'url'),
  page_urlfragment: extractUrlFrom('hash', 'url'),
  refr_urlscheme: extractUrlFrom('protocol', 'refr'),
  refr_urlhost: extractUrlFrom('hostname', 'refr'),
  refr_urlport: extractUrlFrom('port', 'refr'),
  refr_urlpath: extractUrlFrom('pathname', 'refr'),
  refr_urlquery: extractUrlFrom('search', 'refr'),
  refr_urlfragment: extractUrlFrom('hash', 'refr'),
  mkt_medium: extractUrlParamFrom('utm_medium', 'url'),
  mkt_source: extractUrlParamFrom('utm_source', 'url'),
  mkt_term: extractUrlParamFrom('utm_term', 'url'),
  mkt_content: extractUrlParamFrom('utm_content', 'url'),
  mkt_campaign: extractUrlParamFrom('utm_campaign', 'url'),
  se_category: 'se_ca',
  se_action: 'se_ac',
  se_label: 'se_la',
  se_property: 'se_pr',
  se_value: 'se_va',
  tr_orderid: 'tr_id',
  tr_affiliation: 'tr_af',
  tr_total: 'tr_tt',
  tr_tax: 'tr_tx',
  tr_shipping: 'tr_sh',
  tr_city: 'tr_ci',
  tr_state: 'tr_st',
  tr_country: 'tr_co',
  ti_orderid: 'ti_id',
  ti_sku: 'ti_sk',
  ti_name: 'ti_na',
  ti_category: 'ti_ca',
  ti_price: 'ti_pr',
  ti_quantity: 'ti_qu',
  pp_xoffset_min: 'pp_mix',
  pp_xoffset_max: 'pp_max',
  pp_yoffset_min: 'pp_miy',
  pp_yoffset_max: 'pp_may',
  useragent: ({ ua }: { ua?: string }) => ua ?? navigator.userAgent, // often elided and extracted from HTTP header
  br_lang: 'lang',
  br_features_pdf: 'f_pdf',
  br_features_flash: 'f_fla',
  br_features_java: 'f_java',
  br_features_director: 'f_dir',
  br_features_quicktime: 'f_qt',
  br_features_realplayer: 'f_realp',
  br_features_windowsmedia: 'f_wma',
  br_features_gears: 'f_gears',
  br_features_silverlight: 'f_ag',
  br_cookies: 'cookie',
  br_colordepth: 'cd',
  br_viewwidth: extractDimensionValueFrom(0, 'res'),
  br_viewheight: extractDimensionValueFrom(1, 'res'),
  os_timezone: 'tz',
  dvce_screenwidth: extractDimensionValueFrom(0, 'vp'),
  dvce_screenheight: extractDimensionValueFrom(1, 'vp'),
  doc_charset: 'cs',
  doc_width: extractDimensionValueFrom(0, 'ds'),
  doc_height: extractDimensionValueFrom(1, 'ds'),
  tr_currency: 'tr_cu',
  ti_currency: 'ti_cu',
  mkt_clickid: extractUrlParamFrom('gclid', 'url'),
  dvce_sent_tstamp: 'stm',
  refr_domain_userid: extractParamPartFrom('_sp', 'url', 0),
  refr_device_tstamp: extractParamPartFrom('_sp', 'url', 1),
  domain_sessionid: 'sid',
  event_vendor: (evt: unknown) => getEventSelf(evt)?.vendor,
  event_name: (evt: unknown) => getEventSelf(evt)?.name,
  event_format: (evt: unknown) => getEventSelf(evt)?.format,
  event_version: (evt: unknown) => getEventSelf(evt)?.version,
  true_tstamp: 'ttm',
} as const;

const parseJsonPointer = (pointer: JSONPointer): string[] | undefined => {
  if (!pointer) return;
  if (pointer[0] !== '/') pointer = `/${pointer}`;
  return pointer
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .slice(1);
};

const parseEncodedFields = (evt: unknown, fields: string[]) =>
  fields.map((field) => {
    if (objWithKey(evt, field)) {
      const val = evt[field];
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch (_) {
          try {
            return JSON.parse(atob(val.replace(/[_-]/g, (m) => (m == '-' ? '+' : '/'))));
          } catch (_) {}
        }
      }
    }
  });

const summarizeEntities = (evt: unknown): Record<string, Record<string, unknown[]>> => {
  const fields = parseEncodedFields(evt, ['co', 'cx']);

  return fields.reduce((acc, ctx) => {
    if (objWithKey(ctx, 'data') && Array.isArray(ctx.data)) {
      ctx.data.forEach((entity) => {
        if (objWithKey(entity, 'schema') && objWithKey(entity, 'data')) {
          if (typeof entity.schema === 'string' && entity.schema.indexOf('iglu:') === 0) {
            const parts = entity.schema.slice(5).split('/');
            if (parts.length !== 4) return;
            const vendor = (acc[parts[0]] = acc[parts[0]] ?? {});
            vendor[parts[1]] = vendor[parts[1]] ?? [];
            vendor[parts[1]].push(entity.data);
          }
        }
      });
    }

    return acc;
  }, {});
};

const summarizeEvent = (evt: unknown): Record<string, Record<string, unknown>> => {
  const fields = parseEncodedFields(evt, ['ue_pr', 'ue_px']);

  return fields.reduce((acc, ctx) => {
    if (objWithKey(ctx, 'data')) {
      if (objWithKey(ctx.data, 'schema') && objWithKey(ctx.data, 'data')) {
        const event = ctx.data;
        if (typeof event.schema === 'string' && event.schema.indexOf('iglu:') === 0) {
          const parts = event.schema.slice(5).split('/');
          if (parts.length !== 4) return;
          const vendor = (acc[parts[0]] = acc[parts[0]] ?? {});
          vendor[parts[1]] = event.data;
        }
      }
    }

    return acc;
  }, {});
};

const getEventSelf = (evt: unknown): { vendor: string; name: string; format: string; version: string } | void => {
  let schema: string | undefined = undefined;
  if (!objWithKey(evt, 'e') || typeof evt.e !== 'string' || !(evt.e in EVENT_SCHEMAS)) return;

  if (evt.e === 'ue') {
    const fields = parseEncodedFields(evt, ['ue_pr', 'ue_px']);
    const ue = fields[0] ?? fields[1];

    if (objWithKey(ue, 'data') && objWithKey(ue.data, 'schema') && typeof ue.data.schema === 'string') {
      schema = ue.data.schema;
    }
  }

  if (typeof schema === 'string' && schema.indexOf('iglu:') === 0) {
    const [vendor, name, format, version] = schema.slice(5).split('/');
    return { vendor, name, format, version };
  }
};

const derefJsonPointer = (pointerString: JSONPointer, obj: unknown): unknown => {
  const pointer = parseJsonPointer(pointerString);
  if (pointer == null) return obj; // return whole document
  if (typeof obj !== 'object' || obj === null) return; // no segments will work

  if (pointer[0] in selectorMap) {
    const mappedSelector = selectorMap[pointer[0] as keyof typeof selectorMap];
    if (typeof mappedSelector === 'string' && objWithKey(obj, mappedSelector)) {
      return obj[mappedSelector];
    } else if (typeof mappedSelector === 'function') {
      return mappedSelector(obj);
    }
  }

  let cursor: unknown = obj;

  if (ENTITY_ALIASES.indexOf(pointer[0]) !== -1) cursor = { [pointer[0]]: summarizeEntities(cursor) };
  if (EVENT_ALIASES.indexOf(pointer[0]) !== -1) cursor = { [pointer[0]]: summarizeEvent(cursor) };

  for (const segment of pointer) {
    if (objWithKey(cursor, segment)) {
      cursor = cursor[segment];
    } else if (Array.isArray(cursor) && cursor.length === 1 && objWithKey(cursor[0], segment)) {
      cursor = cursor[0][segment];
    } else return;
  }

  return cursor;
};

export function extractEntityValues(targets: Record<EntityName, JSONPointerList>, pb: Payload): Record<string, string> {
  const extracted: Record<EntityName, string> = {};

  Object.entries(targets).forEach(([entityName, pointers]) => {
    pointers = Array.isArray(pointers) ? pointers : [pointers];

    for (const pointer of pointers) {
      const candidateId = derefJsonPointer(pointer, pb);
      if (candidateId != null) {
        extracted[entityName] = String(candidateId);
        return;
      }
    }
  });

  return extracted;
}
