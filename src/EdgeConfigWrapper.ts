import type { EdgeConfigClient } from '@vercel/edge-config';

/**
 * Creates a storage wrapper instance for Vercel Edge Config.
 *
 * @param {Object} options - The configuration options.
 * @param {string} options.edgeConfigItemKey - Item key used to get Split feature flag definitions from Edge Config.
 * @param {EdgeConfigClient} options.edgeConfig - The Edge Config client instance.
 * @returns - A storage wrapper instance.
 */
export function EdgeConfigWrapper(options: {
  edgeConfigItemKey: string;
  edgeConfig: EdgeConfigClient;
}) {

  const { edgeConfigItemKey, edgeConfig } = options || {};

  if (!edgeConfigItemKey) throw new Error('Edge Config Item Key not provided');
  if (!edgeConfig) throw new Error('Edge Config client not provided');

  let data: Record<string, any>;

  function getSync(key: string) {
    const item = data[key];
    if (item) {
      return typeof item === 'string' ? item : JSON.stringify(item);
    }
    return null;
  }

  return {
    // Read data from Edge Config
    async connect() {
      // Throws error if item key is not found
      const edgeConfigData = await edgeConfig.get(edgeConfigItemKey)

      // Validate Edge Config data
      if (typeof edgeConfigData !== 'object' || edgeConfigData === null || !edgeConfigData.hasOwnProperty('SPLITIO.splits.till')) {
        throw new Error(`No feature flag definitions were found in item key '${edgeConfigItemKey}'`);
      }

      data = edgeConfigData;
    },

    // No-op. No need to disconnect from Edge Config
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
      return getSync(key);
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
      return keys.map(getSync);
    },

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
      return Array.isArray(data[key]) && data[key].includes(item);
    },

    /**
     * Returns all the items of the `key` set.
     *
     * @function getItems
     * @param {string} key Set key
     * @returns {Promise<string[]>} A promise that resolves with the list of items. If key does not exist, the result is an empty list.
     */
    async getItems(key: string) {
      return Array.isArray(data[key]) ? data[key] : [];
    },

    // No-op methods: not used by the SDK in partial consumer mode
    async set(key: string, value: string) { throw new Error('SET not implemented'); },
    async getAndSet(key: string, value: string) { throw new Error('GET AND SET not implemented'); },
    async del(key: string) { throw new Error('DEL not implemented'); },
    async incr(key: string) { throw new Error('INCR not implemented'); },
    async decr(key: string) { throw new Error('DECR not implemented'); },
    async addItems(key: string, items: string[]) { throw new Error('ADD ITEMS not implemented'); },
    async removeItems(key: string, items: string[]) { throw new Error('REMOVE ITEMS not implemented'); },
    async pushItems(key: string, items: string[]) { throw new Error('PUSH ITEMS not implemented'); },
    async popItems(key: string, count: number) { throw new Error('POP ITEMS not implemented'); },
    async getItemsCount(key: string) { throw new Error('GET ITEMS COUNT not implemented'); },
  };
}
