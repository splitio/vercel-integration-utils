// Test target
import { EdgeConfigWrapper } from '../EdgeConfigWrapper'

// Mocks
import * as EdgeConfigClient from "@vercel/edge-config";

jest.mock('@vercel/edge-config', () => {
  return { // @ts-ignore
    get: jest.fn((itemKey) => mockedData[itemKey])
  }
});

const { get } = EdgeConfigClient;

const mockedOptions = {
  edgeConfigKey: 'edgeConfigKey',
  edgeConfig: EdgeConfigClient
}

const mockedData = {
  edgeConfigKey: {
    'SPLITIO.splits.till': '1682089737502',
    count1: 3,
    count2: 2,
    key: 'value',
    set: ['item1', 'item2', 'item3']
  },
  invalidItem: {},
}

async function evaluate(storage: any) {
  // Get method
  expect(await storage.get('key')).toBe('value');
  expect(await storage.get('key2')).toBe(null);

  // Get keys by prefix method
  expect(await storage.getKeysByPrefix('c')).toEqual(['count1', 'count2']);
  expect(await storage.getKeysByPrefix('count2')).toEqual(['count2']);

  // Get many method
  expect(await storage.getMany(['count1', 'count2'])).toEqual([3, 2]);

  // Item contains method
  expect(await storage.itemContains('set', 'item2')).toEqual(true);
  expect(await storage.itemContains('set', 'item4')).toEqual(false);
}

describe('Edge config SDK storage wrapper', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Misconfigurations', async () => {
    const ITEM_KEY_NOT_PROVIDED = 'Edge Config Item Key not provided';
    const EDGE_CONFIG_NOT_PROVIDED = 'Edge Config client not provided'; // @ts-expect-error
    expect(() => EdgeConfigWrapper()).toThrow(ITEM_KEY_NOT_PROVIDED); // @ts-expect-error
    expect(() => EdgeConfigWrapper({})).toThrow(ITEM_KEY_NOT_PROVIDED); // @ts-expect-error
    expect(() => EdgeConfigWrapper({ edgeConfigKey: undefined })).toThrow(ITEM_KEY_NOT_PROVIDED); // @ts-expect-error
    expect(() => EdgeConfigWrapper({ edgeConfigKey: 'some-key' })).toThrow(EDGE_CONFIG_NOT_PROVIDED);
  });

  test('"connect" promise rejects if edge config key is not found or is invalid', async () => {
    const storage = EdgeConfigWrapper({ edgeConfigKey: 'invalidItem', edgeConfig: EdgeConfigClient });

    expect(storage.connect()).rejects.toThrow('Invalid value received from item key \'invalidItem\'');
  });

  test('Default configuration', async () => {
    const storage = EdgeConfigWrapper(mockedOptions);

    // Connect
    await storage.connect();
    expect(get).toBeCalledTimes(1);

    // Test methods
    await evaluate(storage);

    // Disconnect
    await storage.disconnect();
  });

})
