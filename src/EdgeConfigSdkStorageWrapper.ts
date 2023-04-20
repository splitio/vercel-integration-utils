import type { Data } from './types';
import { hasOwnProperty } from './utils'
import { createClient as createEdgeConfigClient, get } from '@vercel/edge-config';
import { createConnectionString } from './VercelApi';

/**
 * Creates an instance of EdgeConfigSdkStorageWrapper that wraps around the PluggableStorageWrapper interface.
 *
 * @param {Object} options - The configuration options for the EdgeConfigApiStorageWrapper instance.
 * @param {string} options.edgeConfigKey - Item key used to get Split data from edge config.
 * @param {string} [options.edgeConfigId] - The ID of the edge config.
 * @param {string} [options.edgeConfigToken] - The edge config related token.
 * @returns {IPluggableStorageWrapper} - An instance of EdgeConfigSdkStorageWrapper that wraps around the PluggableStorageWrapper interface.
 */
export function EdgeConfigSdkStorageWrapper(options: {
  edgeConfigKey: string;
  edgeConfigId?: string;
  edgeConfigToken?: string;
}) {
  let data: Data;

  let readEdgeConfig = get
  const { edgeConfigKey, edgeConfigId, edgeConfigToken } = options
  if(edgeConfigId && edgeConfigToken) {
    const edgeConfigConnectionString = createConnectionString(edgeConfigId, edgeConfigToken);
    const edgeConfig = createEdgeConfigClient(edgeConfigConnectionString);
    readEdgeConfig = edgeConfig.get;
  }
  return {
    // No-op. No need to connect to Edge Config
    async connect() {
      console.log('EdgeConfig SDK connect');

      if (!edgeConfigKey) {
        throw new Error('Edge Config Item Key not provided');
      }

      const edgeConfigData = await readEdgeConfig<Data>(edgeConfigKey)

      if (!edgeConfigData) {
        console.log('Empty Edge Config');
        data = {};
      } else {
        data = edgeConfigData;
      }
    },

    // No-op. No need to disconnect from Edge Config stub
    async disconnect() {
      data = {};
    },

    /**
     * Get the value of given `key`.
     *
     * @function get
     * @param {string} key Item to retrieve
     * @returns {Promise<string | null>} A promise that resolves with the element value associated with the specified `key`,
     * or null if the key does not exist.
     */
    async get(key: string) {
      return data[key] ?? null;
    },

    /**
     * Add or update an item with a specified `key` and `value`.
     *
     * @function set
     * @param {string} key Item to update
     * @param {string} value Value to set
     * @returns {Promise<boolean>} A promise that resolves if the operation success, whether the key was added or updated.
     */
    async set(key: string, value: string) {
      throw new Error('SET not implemented');
    },

    /**
     * Add or update an item with a specified `key` and `value`.
     *
     * @function getAndSet
     * @param {string} key Item to update
     * @param {string} value Value to set
     * @returns {Promise<string | null>} A promise that resolves with the previous value associated to the given `key`, or null if not set.
     */
    async getAndSet(key: string, value: string) {
      throw new Error('GET AND SET not implemented');
    },

    /**
     * Removes the specified item by `key`.
     *
     * @function del
     * @param {string} key Item to delete
     * @returns {Promise<boolean>} A promise that resolves if the operation success, whether the key existed and was removed or it didn't exist.
     */
    async del(key: string) {
      throw new Error('DEL not implemented');
    },

    /**
     * Returns all keys matching the given prefix.
     *
     * @function getKeysByPrefix
     * @param {string} prefix String prefix to match
     * @returns {Promise<string[]>} A promise that resolves with the list of keys that match the given `prefix`.
     */
      async getKeysByPrefix(prefix: string) {
        return Object.keys(data).filter((key) => key.startsWith(prefix));
      },
    /**
     * Returns the values of all given `keys`.
     *
     * @function getMany
     * @param {string[]} keys List of keys to retrieve
     * @returns {Promise<(string | null)[]>} A promise that resolves with the list of items associated with the specified list of `keys`.
     * For every key that does not hold a string value or does not exist, null is returned.
     */
    async getMany(keys: string[]) {
      return keys.map((key) => data[key] ?? null);
    },

    /** Integer operations */

    /**
     * Increments in 1 the given `key` value or set it to 1 if the value doesn't exist.
     *
     * @function incr
     * @param {string} key Key to increment
     * @returns {Promise<number>} A promise that resolves with the value of key after the increment.
     */
    async incr(key: string) {
      throw new Error('INCR not implemented');
    },

    /**
     * Decrements in 1 the given `key` value or set it to -1 if the value doesn't exist.
     *
     * @function decr
     * @param {string} key Key to decrement
     * @returns {Promise<number>} A promise that resolves with the value of key after the decrement.
     */
    async decr(key: string) {
      throw new Error('DECR not implemented');
    },

    /** Set operations */

    /**
     * Returns if item is a member of a set.
     *
     * @function itemContains
     * @param {string} key Set key
     * @param {string} item Item value
     * @returns {Promise<boolean>} A promise that resolves with true boolean value if `item` is a member of the set stored at `key`,
     * or false if it is not a member or `key` set does not exist.
     */
    async itemContains(key: string, item: string) {
      const isSet = hasOwnProperty(data, key) && Array.isArray(data[key]);
      return isSet && data[key].includes(item);
    },

    /**
     * Add the specified `items` to the set stored at `key`. Those items that are already part of the set are ignored.
     * If key does not exist, an empty set is created before adding the items.
     *
     * @function addItems
     * @param {string} key Set key
     * @param {string} items Items to add
     * @returns {Promise<boolean | void>} A promise that resolves if the operation success.
     */
    async addItems(key: string, items: string[]) {
      throw new Error('ADD ITEMS not implemented');
    },

    /**
     * Remove the specified `items` from the set stored at `key`. Those items that are not part of the set are ignored.
     *
     * @function removeItems
     * @param {string} key Set key
     * @param {string} items Items to remove
     * @returns {Promise<boolean | void>} A promise that resolves if the operation success. If key does not exist, the promise also resolves.
     */
    async removeItems(key: string, items: string[]) {
      throw new Error('REMOVE ITEMS not implemented');
    },

    /**
     * Returns all the items of the `key` set.
     *
     * @function getItems
     * @param {string} key Set key
     * @returns {Promise<string[]>} A promise that resolves with the list of items. If key does not exist, the result is an empty list.
     */
    async getItems(key: string) {
      const isSet = hasOwnProperty(data, key) && Array.isArray(data[key]);
      return isSet ? data[key] : [];
    },

    /** Queue operations */
    // Since Split SDK must run in partial consumer mode, events and impressions are
    // not tracked and so there is no need to implement Queue operations

    async pushItems(key: string, items: string[]) {},

    async popItems(key: string, count: number) {
      return [];
    },

    async getItemsCount(key: string) {
      return 0;
    },
  };
}
