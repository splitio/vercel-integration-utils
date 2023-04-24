import { createClient, get } from "@vercel/edge-config";

import { EdgeConfigWrapper } from '../EdgeConfigWrapper'

const mockedDefaultOptions = {
  edgeConfigKey: 'edgeConfigKey'
}

const mockedConnectionStringOptions = {
  edgeConfigKey: 'edgeConfigKey',
  edgeConfigId: 'edgeConfigId',
  edgeConfigReadAccessToken: 'edgeConfigReadAccessToken'
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

jest.mock('@vercel/edge-config', () => {
  return {
    createClient: jest.fn(() => {
      return { // @ts-ignore
        get: jest.fn((itemKey) => mockedData[itemKey])
      }
    }), // @ts-ignore
    get: jest.fn((itemKey) => mockedData[itemKey])
  }
});

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

  test('Misconfigurations', async () => { // @ts-expect-error
    expect(() => EdgeConfigWrapper({})).toThrow('Edge Config Item Key not provided'); // @ts-expect-error
    expect(() => EdgeConfigWrapper()).toThrow('Edge Config Item Key not provided');
  });

  test('"connect" promise rejects if edge config key is not found or is invalid', async () => {
    const storage = EdgeConfigWrapper({ edgeConfigKey: 'invalidItem' });

    expect(storage.connect()).rejects.toThrow('Invalid value received from item key \'invalidItem\'');
  });

  test('Default configuration', async () => {
    const storage = EdgeConfigWrapper(mockedDefaultOptions);

    // Connect
    await storage.connect();
    expect(get).toBeCalledTimes(1);
    expect(createClient).not.toBeCalled();

    // Test methods
    await evaluate(storage);

    // Disconnect
    await storage.disconnect();
  });

  test('Configuration with connection string', async () => {
    const storage = EdgeConfigWrapper(mockedConnectionStringOptions);

    // Connect
    await storage.connect();
    expect(get).not.toBeCalled();
    expect(createClient).toBeCalledTimes(1);

    // test methods
    await evaluate(storage);

    // Disconnect
    await storage.disconnect();
  });
})
