import { createConnectionString } from '../VercelApi'
import { createClient, get } from "@vercel/edge-config";

import { EdgeConfigSdkStorageWrapper } from '../EdgeConfigSdkStorageWrapper'

const mockedDefaultOptions = {
  edgeConfigKey: 'edgeConfigKey'
}

const mockedConnectionStringOptions = {
  edgeConfigId: 'edgeConfigId',
  edgeConfigKey: 'edgeConfigKey',
  apiToken: 'apiToken'
}

const mockedData = {
  count1: 3,
  count2: 2,
  key: 'value',
  set: ['item1', 'item2', 'item3']
}

jest.mock('../VercelApi', () => { return {
  createConnectionString: jest.fn(() => 'mockedConnectionString')
}});

jest.mock('@vercel/edge-config', () => { return {
  createClient: jest.fn(() => { return {
    get: jest.fn(() => mockedData)
  }}),
  get: jest.fn(() => mockedData)
}});

async function evaluate(storage) {
    // Get method
    expect(await storage.get('key')).toBe('value');
    expect(await storage.get('key2')).toBe(null);

    // Get keys by prefix method
    expect(await storage.getKeysByPrefix('c')).toEqual(['count1','count2']);
    expect(await storage.getKeysByPrefix('count2')).toEqual(['count2']);

    // Get many method
    expect(await storage.getMany(['count1','count2'])).toEqual([3,2]);

    // Get items method
    expect(await storage.getItems('set')).toEqual(['item1', 'item2', 'item3']);

    // Item contains method
    expect(await storage.itemContains('set', 'item2')).toEqual(true);
    expect(await storage.itemContains('set', 'item4')).toEqual(false);
}

describe('Edge config SDK storage rapper', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Misconfigurations', async () => {
    // @ts-ignore
    let storage = EdgeConfigSdkStorageWrapper({});
    await expect(storage.connect()).rejects.toThrow('Edge Config Item Key not provided');
  });

  test('Default configuration', async () => {
    const storage = EdgeConfigSdkStorageWrapper(mockedDefaultOptions);

    // Connect
    await storage.connect();
    expect(get).toBeCalledTimes(1);
    expect(createConnectionString).not.toBeCalled();
    expect(createClient).not.toBeCalled();

    // test methods
    await evaluate(storage);

    // Disconnect
    await storage.disconnect();

  });

  test('Create connection string', async () => {

    const storage = EdgeConfigSdkStorageWrapper(mockedConnectionStringOptions);

    // Connect
    await storage.connect();
    expect(get).not.toBeCalled();
    expect(createConnectionString).toBeCalledTimes(1);
    expect(createClient).toBeCalledTimes(1);

    // test methods
    await evaluate(storage);

    // Disconnect
    await storage.disconnect();

  });
})
