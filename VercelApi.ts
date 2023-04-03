import { Data } from "./types";
import fetch from 'node-fetch'

const VERCEL_API_URL = 'https://api.vercel.com/v1'
const VERCEL_EDGE_CONFIG = 'https://edge-config.vercel.com'

/**
 * Fetches the edge config for a Vercel project.
 *
 * @param {string} edgeConfigId - The ID of the edge config to fetch.
 * @param {string} edgeConfigKey - The key of the edge config to fetch.
 * @param {string} teamId - The ID of the team that owns the project.
 * @param {string} token - The Vercel API token to use for authentication.
 * @returns {Promise<Data>} - A Promise that resolves to the edge config data.
 * @throws {Error} - Throws an error if the request fails or the response status is not OK.
 */
export async function fetchEdgeConfig(edgeConfigId: string, edgeConfigKey: string, teamId: string, token: string): Promise<Data> {
  const teamIdQuery = teamId ? `?teamId=${teamId}` : '';
  const response = await fetch(`${VERCEL_API_URL}/edge-config/${edgeConfigId}/item/${edgeConfigKey}${teamIdQuery}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error("Could not read Edge Config");

  if (response.status === 200) {
    const responseBody: any = await response.json();
    console.log('Edge Config data fetched')
    return responseBody.value;
  } else if (response.status === 204) {
    return {};
  } else {
    throw new Error(`Received unexpected response code ${response.status}`);
  }

}

/**
 * Upsert edge config for a Vercel project.
 *
 * @param {string} edgeConfigId - The ID of the edge config to fetch.
 * @param {string} edgeConfigKey - The key of the edge config to fetch.
 * @param {string} teamId - The ID of the team that owns the project.
 * @param {string} token - The Vercel API token to use for authentication.
 * @param {Data} data - The data to be stored.
 * @returns {Promise<Void>} - A Promise that resolves to the edge config data.
 * @throws {Error} - Throws an error if the request fails or the response status is not OK.
 */
export async function upsertEdgeConfig(edgeConfigId: string, edgeConfigKey: string, teamId: string, token: string, data: Data): Promise<void> {
  const teamIdQuery = teamId ? `?teamId=${teamId}` : '';
  console.log('Starting Vercel Synchronization')
  await fetch(
    `${VERCEL_API_URL}/edge-config/${edgeConfigId}/items${teamIdQuery}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      method: "PATCH",
      body: JSON.stringify({
        items: [
          {
            operation: "upsert",
            key: edgeConfigKey,
            value: data,
          },
        ],
      }),
    }
  ).then(
    (response) => {
      if (!response.ok) {
        console.log(response)
        throw new Error("Failed to synchronize Vercel");
      }
      console.log("Vercel synchronized successfully");

      return response.json().then((body) => {
        console.log(body);
      });
    },
    (e) => {
      console.log(e);
    }
  )
}

export function createConnectionString(edgeConfigId: string, token: string) {
  return `${VERCEL_EDGE_CONFIG}/${edgeConfigId}?token=${token}`
}