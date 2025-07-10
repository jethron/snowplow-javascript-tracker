import { extractEntityValues } from '../src/util';

const MOCK_SDE = {
  schema: 'iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0',
  data: {
    schema: 'iglu:com.example/custom_event/jsonschema/1-0-0',
    data: {
      value: 'test',
      nested: {
        inner: 'value',
      },
      repeated: [{ key: 'key', value: 'value' }],
    },
  },
};

const MOCK_CONTEXT = {
  schema: 'iglu:com.snowplowanalytics.snowplow/contexts/jsonschema/1-0-1',
  data: [
    {
      schema: 'iglu:com.example/custom_entity/jsonschema/1-0-0',
      data: {
        value: 'test',
        nested: {
          inner: 'value',
        },
        repeated: [{ key: 'key', value: 'value' }],
      },
    },
    {
      schema: 'iglu:com.example/duplicate_entity/jsonschema/1-0-0',
      data: {
        index: 0,
      },
    },
    {
      schema: 'iglu:com.example/duplicate_entity/jsonschema/1-0-0',
      data: {
        index: 1,
      },
    },
  ],
};

describe('utils', () => {
  describe('extractEntityValues', () => {
    it('returns empty', () => {
      expect(extractEntityValues({}, {})).toEqual({});
    });

    it('skips empty json pointers', () => {
      expect(extractEntityValues({ domain_userid: '' }, {})).toEqual({});
    });

    it('ignores unfindable fields', () => {
      expect(extractEntityValues({ domain_userid: '/asdfadsf' }, {})).toEqual({});
    });

    it('finds unknown fields', () => {
      expect(extractEntityValues({ domain_userid: '/blah' }, { blah: 'a' })).toEqual({ domain_userid: 'a' });
    });

    it('finds unaliased fields', () => {
      expect(extractEntityValues({ domain_userid: '/duid' }, { duid: '123' })).toEqual({ domain_userid: '123' });
    });

    it('finds aliased fields', () => {
      expect(extractEntityValues({ domain_userid: '/domain_userid' }, { duid: '123' })).toEqual({
        domain_userid: '123',
      });
    });

    it('fixes json pointers', () => {
      expect(extractEntityValues({ domain_userid: 'duid' as any }, { duid: '123' })).toEqual({ domain_userid: '123' });
    });

    it('finds event types', () => {
      expect(extractEntityValues({ event: '/event' }, { e: 'pv' })).toEqual({ event: 'page_view' });
      expect(extractEntityValues({ event: '/event' }, { e: 'pp' })).toEqual({ event: 'page_ping' });
      expect(extractEntityValues({ event: '/event' }, { e: 'ue' })).toEqual({ event: 'unstruct' });
      expect(extractEntityValues({ event: '/event' }, { e: 'se' })).toEqual({ event: 'struct' });
      expect(extractEntityValues({ event: '/event_name' }, { e: 'pp' })).toEqual({ event: 'page_ping' });
      expect(
        extractEntityValues(
          { name: '/event_name', vendor: '/event_vendor', format: '/event_format', version: '/event_version' },
          { e: 'ue', ue_px: btoa(JSON.stringify(MOCK_SDE)) }
        )
      ).toEqual({ name: 'custom_event', vendor: 'com.example', format: 'jsonschema', version: '1-0-0' });
      expect(
        extractEntityValues(
          { name: '/event_name', vendor: '/event_vendor', format: '/event_format', version: '/event_version' },
          { e: 'ue', ue_pr: JSON.stringify(MOCK_SDE) }
        )
      ).toEqual({ name: 'custom_event', vendor: 'com.example', format: 'jsonschema', version: '1-0-0' });
    });

    it('finds url parts', () => {
      expect(extractEntityValues({ path: '/page_urlpath' }, { url: 'http://example.com/?utm_medium=test' })).toEqual({
        path: '/',
      });
      expect(extractEntityValues({ medium: '/mkt_medium' }, { url: 'http://example.com/?utm_medium=test' })).toEqual({
        medium: 'test',
      });
      expect(extractEntityValues({ none: '/page_urlquery' }, { url: 'http://example.com/' })).toEqual({});
      expect(extractEntityValues({ none: '/refr_urlquery' }, { url: 'http://example.com/' })).toEqual({});
      expect(extractEntityValues({ none: '/mkt_medium' }, { url: 'http://example.com/' })).toEqual({});
    });

    it('finds dimensions', () => {
      expect(
        extractEntityValues({ height: '/dvce_screenheight', width: '/dvce_screenwidth' }, { res: '123x456' })
      ).toEqual({ height: '456', width: '123' });
    });

    it('finds fallback values params', () => {
      expect(
        extractEntityValues(
          { domain_userid: ['/refr_domain_userid', '/duid'] },
          { duid: 'notthis', url: 'http://example.com/?_sp=this.123' }
        )
      ).toEqual({ domain_userid: 'this' });
    });

    it('finds sde properties', () => {
      expect(
        extractEntityValues({ sde: '/sde/com.example/custom_event/value' }, { ue_pr: JSON.stringify(MOCK_SDE) })
      ).toEqual({ sde: 'test' });
      expect(
        extractEntityValues(
          { sde: '/unstruct/com.example/custom_event/nested/inner' },
          { ue_pr: JSON.stringify(MOCK_SDE) }
        )
      ).toEqual({ sde: 'value' });
      expect(
        extractEntityValues(
          { sde: '/ue/com.example/custom_event/repeated/0/key' },
          { ue_px: btoa(JSON.stringify(MOCK_SDE)) }
        )
      ).toEqual({ sde: 'key' });
      expect(
        extractEntityValues(
          { sde: '/unstruct_event/com.example/custom_event/repeated/key' },
          { ue_pr: JSON.stringify(MOCK_SDE) }
        )
      ).toEqual({ sde: 'key' });
    });

    it('finds entity properties', () => {
      expect(
        extractEntityValues({ sdj: '/entity/com.example/custom_entity/value' }, { co: JSON.stringify(MOCK_CONTEXT) })
      ).toEqual({ sdj: 'test' });
      expect(
        extractEntityValues(
          { sdj: '/entities/com.example/custom_entity/nested/inner' },
          { co: JSON.stringify(MOCK_CONTEXT) }
        )
      ).toEqual({ sdj: 'value' });
      expect(
        extractEntityValues(
          { sdj: '/co/com.example/custom_entity/repeated/0/key' },
          { cx: btoa(JSON.stringify(MOCK_CONTEXT)) }
        )
      ).toEqual({ sdj: 'key' });
      expect(
        extractEntityValues(
          { sdj: '/context/com.example/custom_entity/repeated/key' },
          { co: JSON.stringify(MOCK_CONTEXT) }
        )
      ).toEqual({ sdj: 'key' });
      expect(
        extractEntityValues(
          { sdj: '/context/com.example/duplicate_entity/index' },
          { co: JSON.stringify(MOCK_CONTEXT) }
        )
      ).toEqual({});
      expect(
        extractEntityValues(
          { sdj: '/context/com.example/duplicate_entity/0/index' },
          { co: JSON.stringify(MOCK_CONTEXT) }
        )
      ).toEqual({ sdj: '0' });
    });
  });
});
