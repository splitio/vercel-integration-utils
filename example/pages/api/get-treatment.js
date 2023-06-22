import { SplitFactory, PluggableStorage, ErrorLogger } from '@splitsoftware/splitio-browserjs';
import { EdgeConfigWrapper } from '@splitsoftware/vercel-integration-utils';
import * as EdgeConfigClient from '@vercel/edge-config';

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// Request example: https://<HOST>/api/get-treatment?userKey=<USER_KEY>

// @REPLACE with the feature flag name you want to evaluate
const FEATURE_FLAG_NAME = 'test_split';

// Run API route as an Edge function rather than a Serverless one, because the SDK uses Fetch API to flush data, which is available in Edge runtime but not in Serverless.
export const config = { runtime: "edge" };

export default async function handler(req, event) {
  // Extract user key from request query param
  const { searchParams } = new URL(req.url);
  const userKey = searchParams.get('userKey');

  /** @type {SplitIO.IAsyncClient} */
  const client = SplitFactory({
    core: {
      authorizationKey: process.env.SPLIT_SDK_KEY,
      key: userKey
    },
    mode: 'consumer_partial',
    storage: PluggableStorage({
      wrapper: EdgeConfigWrapper({
        // The Edge Config item where Split stores feature flag definitions, specified in the Split integration step
        edgeConfigKey: process.env.SPLIT_EDGE_CONFIG_ITEM_KEY,
        // The Edge Config client. In this case, we are passing the default client
        // that reads from the Edge Config stored in process.env.EDGE_CONFIG
        edgeConfig: EdgeConfigClient
      })
    }),
    // Disable or keep only ERROR log level in production, to minimize performance impact
    debug: ErrorLogger(),
  }).client();

  // Wait to load feature flag definitions from the Edge Config
  await client.ready();

  const treatment = await client.getTreatment(FEATURE_FLAG_NAME);

  // Flush impressions asynchronously. Avoid 'await' on the destroy call, to not delay the response.
  event.waitUntil(client.destroy());

  return new Response(JSON.stringify({ treatment }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
