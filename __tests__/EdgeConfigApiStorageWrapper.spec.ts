import { fetchEdgeConfig, upsertEdgeConfig } from '../VercelApi'
import { EdgeConfigApiStorageWrapper } from '../EdgeConfigApiStorageWrapper'

const mockedOptions = {
  edgeConfigId: 'edgeConfigId',
  edgeConfigKey: 'edgeConfigKey',
  apiToken: 'apiToken',
  teamId: 'teamId',
  waitUntil: jest.fn()
}
jest.mock('../VercelApi', () => { return {
  fetchEdgeConfig: jest.fn(() => Promise.resolve({})),
  upsertEdgeConfig: jest.fn(() => Promise.resolve({}))
}});

describe('Edge config API storage rapper', () => {

  test('Misconfigurations', async () => {
    // @ts-ignore
    const storage = EdgeConfigApiStorageWrapper({});
    await expect(storage.connect()).rejects.toThrow('Edge Config Id not provided');
    // @ts-ignore
    const storage2 = EdgeConfigApiStorageWrapper({edgeConfigId: 'edgeConfigId'});
    await expect(storage2.connect()).rejects.toThrow('Edge Config Item Key not provided');
    //@ts-ignore
    const storage3 = EdgeConfigApiStorageWrapper({edgeConfigId: 'edgeConfigId', edgeConfigKey: 'edgeConfigKey'});
    await expect(storage3.connect()).rejects.toThrow('API Token not provided');
  });

  test('connect', async () => {
    const storage = EdgeConfigApiStorageWrapper(mockedOptions);

    // Connect
    await storage.connect();
    expect(fetchEdgeConfig).toBeCalledTimes(1);

    // Get method
    expect(await storage.get('key')).toBe(null);

    // Set method
    expect(await storage.set('key', 'value1')).toBe(true);
    expect(await storage.get('key')).toBe('value1');

    // Get and set method
    expect(await storage.getAndSet('key', 'value2')).toBe('value1');
    expect(await storage.get('key')).toBe('value2');

    // Del method
    expect(await storage.del('key')).toBe(true);
    expect(await storage.get('key')).toBe(null);

    // Incr method
    expect(await storage.incr('count1')).toBe(1);
    expect(await storage.incr('count1')).toBe(2);
    expect(await storage.incr('count1')).toBe(3);
    expect(await storage.incr('count1')).toBe(4);

    expect(await storage.incr('count2')).toBe(1);
    expect(await storage.incr('count2')).toBe(2);
    expect(await storage.incr('count2')).toBe(3);

    // Decr method
    expect(await storage.decr('count1')).toBe(3);
    expect(await storage.decr('count2')).toBe(2);

    // Get keys by prefix method
    expect(await storage.getKeysByPrefix('c')).toEqual(['count1','count2']);
    expect(await storage.getKeysByPrefix('count2')).toEqual(['count2']);

    // Get many method
    expect(await storage.getMany(['count1','count2'])).toEqual([3,2]);

    // Add items method
    expect(await storage.addItems('set', ['item1', 'item2'])).toBe(true);
    expect(await storage.addItems('set', ['item3'])).toBe(true);

    // Get items method
    expect(await storage.getItems('set')).toEqual(['item1', 'item2', 'item3']);

    // Remove items method
    expect(await storage.removeItems('set', ['item1','item3'])).toEqual(true);

    // Item contains method
    expect(await storage.itemContains('set', 'item1')).toEqual(false);
    expect(await storage.itemContains('set', 'item2')).toEqual(true);

    // Disconnect
    await storage.disconnect();
    expect(upsertEdgeConfig).toBeCalledTimes(1);

  })
})
