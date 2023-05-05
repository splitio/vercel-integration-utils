import { createClient as createEdgeConfigClient, get } from '@vercel/edge-config';

const VERCEL_EDGE_CONFIG = 'https://edge-config.vercel.com'

function createConnectionString(edgeConfigId: string, readAccessToken: string) {
  return `${VERCEL_EDGE_CONFIG}/${edgeConfigId}?token=${readAccessToken}`
}

type Data = Record<string, any>;

/**
 * Creates an instance of EdgeConfigWrapper that wraps around the PluggableStorageWrapper interface.
 *
 * @param {Object} options - The configuration options for the EdgeConfigApiStorageWrapper instance.
 * @param {string} options.edgeConfigKey - Item key used to get Split data from edge config.
 * @param {string} [options.edgeConfigId] - The ID of the edge config.
 * @param {string} [options.edgeConfigReadAccessToken] - The edge config related token.
 * @returns - An instance of EdgeConfigWrapper that wraps around the PluggableStorageWrapper interface.
 */
export function EdgeConfigWrapper(options: {
  edgeConfigKey: string;
  edgeConfigId?: string;
  edgeConfigReadAccessToken?: string;
}) {

  if (!options || !options.edgeConfigKey) {
    throw new Error('Edge Config Item Key not provided');
  }

  const { edgeConfigKey, edgeConfigId, edgeConfigReadAccessToken } = options

  let data: Data;

  let readEdgeConfig = get

  if (edgeConfigId && edgeConfigReadAccessToken) {
    const edgeConfigConnectionString = createConnectionString(edgeConfigId, edgeConfigReadAccessToken);
    const edgeConfig = createEdgeConfigClient(edgeConfigConnectionString);
    readEdgeConfig = edgeConfig.get;
  }

  return {
    // Read data from Edge Config
    async connect() {
      // Throws error if item key is not found
      const edgeConfigData = await readEdgeConfig<Data>(edgeConfigKey)

      // Validate Edge Config data
      if (typeof edgeConfigData !== 'object' || edgeConfigData === null || !edgeConfigData.hasOwnProperty('SPLITIO.splits.till')) {
        throw new Error(`Invalid value received from item key '${edgeConfigKey}'`);
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
      return data[key] ?? null;
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
      const isSet = data.hasOwnProperty(key) && Array.isArray(data[key]);
      return isSet && data[key].includes(item);
    },

    // No-op methods: not used by the SDK in partial consumer mode
    async set(key: string, value: string) { throw new Error('SET not implemented'); },
    async getAndSet(key: string, value: string) { throw new Error('GET AND SET not implemented'); },
    async del(key: string) { throw new Error('DEL not implemented'); },
    async incr(key: string) { throw new Error('INCR not implemented'); },
    async decr(key: string) { throw new Error('DECR not implemented'); },
    async addItems(key: string, items: string[]) { throw new Error('ADD ITEMS not implemented'); },
    async removeItems(key: string, items: string[]) { throw new Error('REMOVE ITEMS not implemented'); },
    async getItems(key: string) { throw new Error('GET ITEMS not implemented'); },
    async pushItems(key: string, items: string[]) { throw new Error('PUSH ITEMS not implemented'); },
    async popItems(key: string, count: number) { throw new Error('POP ITEMS not implemented'); },
    async getItemsCount(key: string) { throw new Error('GET ITEMS COUNT not implemented'); },
  };
}
